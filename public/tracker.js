/**
 * Pulse Analytics Client Tracking SDK v1.0.0
 * Pure JavaScript embeddable tracker with SPA support, Web Vitals, IndexedDB Offline Storage, Adaptive Heartbeat, and Retry Queue.
 */
(function () {
  'use strict';

  if (window.__PULSE_TRACKER_INITIALIZED__) return;
  window.__PULSE_TRACKER_INITIALIZED__ = true;

  // 1. Locate current script tag and configuration
  const scriptTag = document.currentScript || document.querySelector('script[data-api-key]');
  const apiKey = scriptTag ? scriptTag.getAttribute('data-api-key') : (window.PULSE_API_KEY || '');
  const apiBaseUrl = '__PULSE_COLLECTOR_URL__';

  if (!apiBaseUrl || apiBaseUrl.indexOf('__PULSE_COLLECTOR_URL__') === 0) {
    console.warn('[Pulse Analytics SDK] VITE_COLLECTOR_URL is required. Tracking disabled.');
    return;
  }

  // 2. Local Identity Helpers
  function getOrSetStorage(type, key, defaultValueGenerator) {
    try {
      const storage = type === 'local' ? window.localStorage : window.sessionStorage;
      let val = storage.getItem(key);
      if (!val) {
        val = defaultValueGenerator();
        storage.setItem(key, val);
      }
      return val;
    } catch (e) {
      return defaultValueGenerator();
    }
  }

  function generateUid(prefix) {
    return prefix + '_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  const visitorUid = getOrSetStorage('local', '_pulse_vid', () => generateUid('vis'));
  const sessionUid = getOrSetStorage('session', '_pulse_sid', () => generateUid('ses'));
  let currentPageViewId = null;
  let identifiedUser = null;

  // 3. IndexedDB Offline Queue Implementation
  let idb = null;
  function initIndexedDB() {
    if (!window.indexedDB) return;
    try {
      const request = window.indexedDB.open('_pulse_offline_db', 1);
      request.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = function (e) {
        idb = e.target.result;
        flushIndexedDB();
      };
    } catch (e) {
      // IndexedDB restricted or disabled
    }
  }

  function saveToOfflineQueue(endpoint, payload) {
    if (!idb) return;
    try {
      const tx = idb.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      store.add({ endpoint, payload, createdAt: Date.now() });
    } catch (e) {}
  }

  function flushIndexedDB() {
    if (!idb || !navigator.onLine) return;
    try {
      const tx = idb.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.getAll();
      request.onsuccess = function () {
        const items = request.result || [];
        if (items.length === 0) return;
        
        items.forEach(item => {
          sendRequest(item.endpoint, item.payload);
        });

        const clearTx = idb.transaction('queue', 'readwrite');
        clearTx.objectStore('queue').clear();
      };
    } catch (e) {}
  }

  window.addEventListener('online', flushIndexedDB);
  initIndexedDB();

  // 4. Retry Queue & Network Dispatcher
  const retryQueue = [];
  let isFlushingQueue = false;

  async function sendRequest(endpoint, payload, isBeacon = false) {
    if (!apiKey) {
      console.warn('[Pulse Analytics SDK] Missing API Key. Tracking request skipped.');
      return;
    }

    const idempotencyKey = `req_${Math.random().toString(36).substring(2, 10)}${Date.now()}`;

    const fullPayload = {
      apiKey: apiKey,
      visitorUid: visitorUid,
      sessionUid: sessionUid,
      identifiedUser: identifiedUser,
      idempotencyKey: idempotencyKey,
      ...payload
    };

    const targetUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/collect/${endpoint}`;

    if (isBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify(fullPayload)], { type: 'application/json' });
        const success = navigator.sendBeacon(targetUrl, blob);
        if (success) return;
      } catch (e) {}
    }

    if (!navigator.onLine) {
      saveToOfflineQueue(endpoint, fullPayload);
      return;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(fullPayload),
        keepalive: true
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const resData = await response.json();
      if (resData && resData.page_view_id) {
        currentPageViewId = resData.page_view_id;
      }
      return resData;
    } catch (err) {
      console.warn(`[Pulse Analytics] Network dispatch failed for ${endpoint}. Storing offline.`, err);
      saveToOfflineQueue(endpoint, fullPayload);
    }
  }

  // 5. Device & Browser Intelligence
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';

    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Internet';
    else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
    else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Edge';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';

    let os = 'Unknown';
    if (ua.indexOf('Win') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('like Mac') > -1) os = 'iOS';

    let deviceType = 'desktop';
    if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
    if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';

    return { browser, os, deviceType };
  }

  // 6. Track Pageview
  function trackPageView(customUrl) {
    const loc = window.location;
    const { browser, os, deviceType } = getBrowserInfo();

    const payload = {
      url: customUrl || loc.href,
      path: loc.pathname,
      title: document.title || 'Untitled Page',
      referrer: document.referrer || '',
      language: navigator.language || 'en-US',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      screenWidth: window.screen ? window.screen.width : 0,
      screenHeight: window.screen ? window.screen.height : 0,
      viewportWidth: window.innerWidth || 0,
      viewportHeight: window.innerHeight || 0,
      browser: browser,
      operatingSystem: os,
      deviceType: deviceType,
      enteredAt: new Date().toISOString()
    };

    sendRequest('pageview', payload);
  }

  // 7. Track Custom Event
  function trackEvent(eventName, options = {}) {
    if (!eventName) return;
    const payload = {
      pageViewId: currentPageViewId,
      eventName: eventName,
      eventCategory: options.category || 'custom',
      eventAction: options.action || 'click',
      eventLabel: options.label || null,
      eventValue: options.value || null,
      targetSelector: options.selector || null,
      targetText: options.text || null,
      targetHref: options.href || null,
      metadata: options.metadata || null,
      occurredAt: new Date().toISOString()
    };

    sendRequest('event', payload);
  }

  // 8. Track Heartbeat
  function sendHeartbeat(isExit = false) {
    const payload = {
      pageViewId: currentPageViewId,
      timestamp: new Date().toISOString(),
      isExit: isExit
    };
    sendRequest('heartbeat', payload, isExit);
  }

  // 9. Adaptive Heartbeat Timer (30s active tab, 60s background tab, paused when hidden)
  let heartbeatTimer = null;
  function setupAdaptiveHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    if (document.visibilityState === 'hidden') {
      // Paused when hidden
      return;
    }

    const intervalMs = document.hasFocus() ? 30000 : 60000;
    heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat(false);
      }
    }, intervalMs);
  }

  window.addEventListener('focus', setupAdaptiveHeartbeat);
  window.addEventListener('blur', setupAdaptiveHeartbeat);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendHeartbeat(true);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    } else {
      setupAdaptiveHeartbeat();
    }
  });

  // 10. Capture Web Vitals Performance Metrics
  function captureWebVitals() {
    if (!window.performance || !window.PerformanceObserver) return;
    try {
      const vitals = {};
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            vitals.LCP = Math.round(entry.startTime);
          }
          if (entry.entryType === 'first-input') {
            vitals.FID = Math.round(entry.processingStart - entry.startTime);
          }
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            vitals.CLS = (vitals.CLS || 0) + entry.value;
          }
        }
        if (Object.keys(vitals).length > 0) {
          trackEvent('web_vitals', {
            category: 'performance',
            metadata: { webVitals: vitals }
          });
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'first-input', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
  }

  // 11. SPA Navigation Handlers
  let lastPath = window.location.pathname;
  function handleUrlChange() {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackPageView();
    }
  }

  const originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      handleUrlChange();
    };
  }

  const originalReplaceState = history.replaceState;
  if (originalReplaceState) {
    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      handleUrlChange();
    };
  }

  window.addEventListener('popstate', handleUrlChange);

  // 12. Page Leave / Visibility Change with Beacon
  window.addEventListener('pagehide', () => {
    sendHeartbeat(true);
  });

  // 13. Auto-initialize
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    trackPageView();
    captureWebVitals();
    setupAdaptiveHeartbeat();
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      trackPageView();
      captureWebVitals();
      setupAdaptiveHeartbeat();
    });
  }

  // 14. Expose Global SDK API
  window.pulse = {
    track: trackEvent,
    trackPageView: trackPageView,
    identify: function (userId) {
      identifiedUser = userId;
      trackEvent('user_identified', { label: userId });
    }
  };
})();
