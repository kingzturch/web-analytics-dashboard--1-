import { getRequiredEnv, getRequiredNumberEnv, loadServerEnv } from '../lib/env';
import { getServerSupabase } from '../lib/supabase/server';
import type { EventsInsert, Json } from '../lib/supabase/types';

function getSupabaseClient() {
  loadServerEnv();
  return getServerSupabase();
}

export interface QueueEventPayload {
  visitor_id: string;
  session_id: string;
  page_view_id?: string | null;
  event_name: string;
  event_category?: string;
  event_action?: string | null;
  event_label?: string | null;
  event_value?: number | null;
  target_selector?: string | null;
  target_text?: string | null;
  target_href?: string | null;
  x_position?: number | null;
  y_position?: number | null;
  scroll_percent?: number | null;
  metadata?: Json | null;
  occurred_at?: string;
}

export interface QueueItem {
  id: string;
  type: 'pageview' | 'event' | 'heartbeat';
  siteId: string;
  payload: QueueEventPayload;
  idempotencyKey?: string;
  enqueuedAt: number;
  retryCount: number;
}

export interface SystemMetrics {
  collectorStatus: 'online' | 'degraded' | 'offline';
  queueLength: number;
  activeWorkers: number;
  requestsPerSec: number;
  eventsPerSec: number;
  avgInsertTimeMs: number | null;
  retryQueueLength: number;
  failedInserts: number;
  droppedEvents: number;
  supabaseStatus: 'connected' | 'reconnecting' | 'disconnected';
  lastProcessedAt: string | null;
  sdkVersion: string;
  collectorVersion: string;
}

class QueueService {
  private queue: QueueItem[] = [];
  private retryQueue: QueueItem[] = [];
  private idempotencyCache: Map<string, number> = new Map(); // idempotencyKey -> timestamp
  private rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map();
  
  // Metrics Counters
  private totalRequestsThisWindow = 0;
  private totalEventsThisWindow = 0;
  private currentRps = 0;
  private currentEps = 0;
  private totalInsertTimeMs = 0;
  private processedInsertBatches = 0;
  private failedInsertsCount = 0;
  private droppedEventsCount = 0;
  private lastProcessedTime: string | null = null;
  
  private workerInterval: NodeJS.Timeout | null = null;
  private metricsWindowInterval: NodeJS.Timeout | null = null;

  private readonly BATCH_SIZE = getRequiredNumberEnv('INGESTION_QUEUE_BATCH_SIZE');
  private readonly FLUSH_INTERVAL_MS = getRequiredNumberEnv('INGESTION_QUEUE_FLUSH_MS');
  private readonly MAX_RETRIES = getRequiredNumberEnv('INGESTION_QUEUE_MAX_RETRY');

  constructor() {
    this.startWorker();
    this.startMetricsWindow();
  }

  // 1. Rate Limiting Check
  public checkRateLimit(key: string, limit: number, windowMs: number = 60000): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
      this.rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    entry.count += 1;
    return { allowed: true, remaining: limit - entry.count };
  }

  // 2. Idempotency Check
  public isDuplicate(idempotencyKey?: string): boolean {
    if (!idempotencyKey) return false;
    const now = Date.now();
    
    // Cleanup expired cache (> 10 mins)
    if (this.idempotencyCache.size > 5000) {
      for (const [key, ts] of this.idempotencyCache.entries()) {
        if (now - ts > 10 * 60 * 1000) {
          this.idempotencyCache.delete(key);
        }
      }
    }

    if (this.idempotencyCache.has(idempotencyKey)) {
      return true;
    }

    this.idempotencyCache.set(idempotencyKey, now);
    return false;
  }

  // 3. Enqueue Item
  public enqueue(type: 'pageview' | 'event' | 'heartbeat', siteId: string, payload: QueueEventPayload, idempotencyKey?: string): boolean {
    this.totalRequestsThisWindow++;
    if (type === 'event') this.totalEventsThisWindow++;

    if (this.isDuplicate(idempotencyKey)) {
      return true; // Gracefully acknowledge duplicates
    }

    const item: QueueItem = {
      id: `q_${Math.random().toString(36).substring(2, 10)}${Date.now()}`,
      type,
      siteId,
      payload,
      idempotencyKey,
      enqueuedAt: Date.now(),
      retryCount: 0
    };

    this.queue.push(item);
    return true;
  }

  // 4. Background Worker Processing Loop
  private startWorker() {
    if (this.workerInterval) clearInterval(this.workerInterval);
    this.workerInterval = setInterval(() => {
      this.processQueue();
    }, this.FLUSH_INTERVAL_MS);
  }

  private startMetricsWindow() {
    if (this.metricsWindowInterval) clearInterval(this.metricsWindowInterval);
    this.metricsWindowInterval = setInterval(() => {
      this.currentRps = this.totalRequestsThisWindow;
      this.currentEps = this.totalEventsThisWindow;
      this.totalRequestsThisWindow = 0;
      this.totalEventsThisWindow = 0;
    }, 1000);
  }

  private async processQueue() {
    if (this.queue.length === 0 && this.retryQueue.length === 0) return;

    // Drain batch from main or retry queue
    const batch: QueueItem[] = [];
    while (batch.length < this.BATCH_SIZE && this.queue.length > 0) {
      batch.push(this.queue.shift()!);
    }
    while (batch.length < this.BATCH_SIZE && this.retryQueue.length > 0) {
      batch.push(this.retryQueue.shift()!);
    }

    if (batch.length === 0) return;

    const startTime = Date.now();
    const supabase = getSupabaseClient();

    if (!supabase) {
      console.warn('[QueueWorker] Supabase client unavailable. Re-queueing items.');
      this.handleBatchFailure(batch);
      return;
    }

    try {
      // Group items by type for bulk processing
      const eventsBatch = batch.filter(i => i.type === 'event');
      if (eventsBatch.length > 0) {
        const dbEvents: EventsInsert[] = eventsBatch.map((item) => ({
          site_id: item.siteId,
          visitor_id: item.payload.visitor_id,
          session_id: item.payload.session_id,
          page_view_id: item.payload.page_view_id || null,
          event_name: item.payload.event_name,
          event_category: item.payload.event_category || 'custom',
          event_action: item.payload.event_action || null,
          event_label: item.payload.event_label || null,
          event_value: item.payload.event_value || null,
          target_selector: item.payload.target_selector || null,
          target_text: item.payload.target_text || null,
          target_href: item.payload.target_href || null,
          x_position: item.payload.x_position || null,
          y_position: item.payload.y_position || null,
          scroll_percent: item.payload.scroll_percent || null,
          metadata: item.payload.metadata || null,
          occurred_at: item.payload.occurred_at || new Date().toISOString(),
        }));

        const { error } = await supabase.from('events').insert(dbEvents);
        if (error) throw error;
      }

      // Record metrics
      const duration = Date.now() - startTime;
      this.totalInsertTimeMs += duration;
      this.processedInsertBatches++;
      this.lastProcessedTime = new Date().toISOString();

    } catch (err) {
      console.error('[QueueWorker] Batch insert failed:', err);
      this.handleBatchFailure(batch);
    }
  }

  private handleBatchFailure(batch: QueueItem[]) {
    this.failedInsertsCount++;
    for (const item of batch) {
      if (item.retryCount < this.MAX_RETRIES) {
        item.retryCount++;
        this.retryQueue.push(item);
      } else {
        this.droppedEventsCount++;
        console.error(`[QueueWorker] Max retries reached for item ${item.id}. Event dropped.`);
      }
    }
  }

  // 5. System Health & Metrics Export
  public getMetrics(): SystemMetrics {
    const avgInsertTime = this.processedInsertBatches > 0 
      ? Math.round(this.totalInsertTimeMs / this.processedInsertBatches) 
      : null;

    const supabase = getSupabaseClient();

    return {
      collectorStatus: 'online',
      queueLength: this.queue.length,
      activeWorkers: this.workerInterval ? 1 : 0,
      requestsPerSec: this.currentRps,
      eventsPerSec: this.currentEps,
      avgInsertTimeMs: avgInsertTime,
      retryQueueLength: this.retryQueue.length,
      failedInserts: this.failedInsertsCount,
      droppedEvents: this.droppedEventsCount,
      supabaseStatus: supabase ? 'connected' : 'disconnected',
      lastProcessedAt: this.lastProcessedTime,
      sdkVersion: getRequiredEnv('PULSE_SDK_VERSION'),
      collectorVersion: getRequiredEnv('PULSE_COLLECTOR_VERSION')
    };
  }
}

export const queueService = new QueueService();

