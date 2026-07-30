/**
 * Pulse Analytics TypeScript SDK
 */

export interface PulseInitOptions {
  apiKey: string;
  siteId?: string;
  collectorUrl?: string;
  autoTrackPageView?: boolean;
}

export class PulseTracker {
  private apiKey: string;
  private apiBaseUrl: string;
  private visitorUid: string;
  private sessionUid: string;
  private currentPageViewId: string | null = null;
  private identifiedUser: string | null = null;

  constructor(options: PulseInitOptions) {
    this.apiKey = options.apiKey;
    this.apiBaseUrl =
      options.collectorUrl ||
      (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_COLLECTOR_URL : '') ||
      '';
    if (!this.apiBaseUrl) {
      throw new Error('[Pulse SDK] collectorUrl (or VITE_COLLECTOR_URL) is required.');
    }
    this.visitorUid = this.getOrSetStorage('local', '_pulse_vid', () => this.generateUid('vis'));
    this.sessionUid = this.getOrSetStorage('session', '_pulse_sid', () => this.generateUid('ses'));

    if (options.autoTrackPageView !== false && typeof window !== 'undefined') {
      this.trackPageView();
      this.initHeartbeat();
    }
  }

  private getOrSetStorage(type: 'local' | 'session', key: string, fallback: () => string): string {
    if (typeof window === 'undefined') return fallback();
    try {
      const storage = type === 'local' ? window.localStorage : window.sessionStorage;
      let val = storage.getItem(key);
      if (!val) {
        val = fallback();
        storage.setItem(key, val);
      }
      return val;
    } catch {
      return fallback();
    }
  }

  private generateUid(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 11)}${Date.now().toString(36)}`;
  }

  public async trackPageView(customUrl?: string) {
    if (typeof window === 'undefined') return;
    const payload = {
      apiKey: this.apiKey,
      visitorUid: this.visitorUid,
      sessionUid: this.sessionUid,
      url: customUrl || window.location.href,
      path: window.location.pathname,
      title: document.title || 'Untitled Page',
      referrer: document.referrer || '',
      language: navigator.language || 'en-US',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      screenWidth: window.screen ? window.screen.width : 0,
      screenHeight: window.screen ? window.screen.height : 0,
      viewportWidth: window.innerWidth || 0,
      viewportHeight: window.innerHeight || 0,
      enteredAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${this.apiBaseUrl.replace(/\/$/, '')}/api/v1/collect/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.page_view_id) {
        this.currentPageViewId = data.page_view_id;
      }
    } catch (err) {
      console.warn('[Pulse SDK] Track pageview failed:', err);
    }
  }

  public async trackEvent(eventName: string, options: {
    category?: string;
    action?: string;
    label?: string;
    value?: number;
    metadata?: Record<string, any>;
  } = {}) {
    if (typeof window === 'undefined') return;
    const payload = {
      apiKey: this.apiKey,
      visitorUid: this.visitorUid,
      sessionUid: this.sessionUid,
      pageViewId: this.currentPageViewId,
      eventName: eventName,
      eventCategory: options.category || 'custom',
      eventAction: options.action || 'click',
      eventLabel: options.label || null,
      eventValue: options.value || null,
      metadata: options.metadata || null,
      occurredAt: new Date().toISOString()
    };

    try {
      await fetch(`${this.apiBaseUrl.replace(/\/$/, '')}/api/v1/collect/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('[Pulse SDK] Track event failed:', err);
    }
  }

  public identify(userId: string) {
    this.identifiedUser = userId;
    this.trackEvent('user_identified', { label: userId });
  }

  private initHeartbeat() {
    if (typeof window === 'undefined') return;
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetch(`${this.apiBaseUrl.replace(/\/$/, '')}/api/v1/collect/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey
          },
          body: JSON.stringify({
            apiKey: this.apiKey,
                  visitorUid: this.visitorUid,
            sessionUid: this.sessionUid,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});
      }
    }, 25000);
  }
}
