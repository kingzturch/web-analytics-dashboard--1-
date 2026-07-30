# PULSE ANALYTICS CLIENT SDK DOCUMENTATION
**Universal JavaScript Embedded Tracker v1.0.0**

---

## 1. Quick Start Installation

Embed the high-performance Pulse script tag into the `<head>` of your website or web application:

```html
<!-- Pulse Analytics Global Ingestion Script -->
<script
  defer
  src="https://your-domain.com/tracker.js"
  data-api-key="pa_live_sec_YOUR_API_KEY">
</script>
```

---

## 2. Global JavaScript API (`window.pulse`)

### `pulse.track(eventName, options)`
Tracks a custom conversion event, button click, or user action.

```javascript
window.pulse.track('purchase_completed', {
  category: 'ecommerce',
  action: 'checkout',
  label: 'Enterprise Plan Annual',
  value: 299.00,
  metadata: {
    coupon: 'SUMMER2026',
    itemsCount: 1
  }
});
```

### `pulse.identify(userId)`
Associates current visitor session with a custom user identifier (e.g. user ID or email).

```javascript
window.pulse.identify('usr_91823901');
```

### `pulse.trackPageView(customUrl)`
Manually triggers pageview collection (useful for custom SPA routers or dynamic view changes).

```javascript
window.pulse.trackPageView('https://app.example.com/dashboard/analytics');
```

---

## 3. Advanced Features & Reliability Architecture

### Single Page Application (SPA) Support
The SDK automatically patches `history.pushState`, `history.replaceState`, and listens to `popstate` events to capture route changes seamlessly without duplicate triggers.

### Web Vitals Performance Metrics
Captures real-user Core Web Vitals automatically:
- **LCP** (Largest Contentful Paint)
- **FID** / **INP** (First Input Delay / Interaction to Next Paint)
- **CLS** (Cumulative Layout Shift)

### IndexedDB Offline Queue
If the client loses internet connectivity or network requests fail, events are stored locally in IndexedDB (`_pulse_offline_db`). When the `online` window event fires, the SDK automatically flushes queued payloads sequentially.

### Adaptive Heartbeat
- **Active Tab**: 30-second heartbeat interval.
- **Background Tab**: Scales down to 60-second interval.
- **Hidden / Unfocused Tab**: Pauses completely to reduce client CPU & network overhead.

### Beacon On-Unload Delivery
Uses `navigator.sendBeacon()` upon `pagehide` and `visibilitychange` to guarantee session termination events deliver even when a user closes their tab rapidly.
