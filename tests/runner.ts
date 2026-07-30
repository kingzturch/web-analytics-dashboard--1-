import { queueService } from '../src/services/queueService';
import { Logger } from '../src/lib/logger';

async function runTestSuite() {
  Logger.info('TestRunner', '==============================================');
  Logger.info('TestRunner', 'PULSE ANALYTICS AUTOMATED TEST SUITE v1.0.0-RC');
  Logger.info('TestRunner', '==============================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      Logger.info('TestRunner', `[PASS] ${testName}`);
      passed++;
    } else {
      Logger.error('TestRunner', `[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Queue Enqueue & Metrics Test
  Logger.info('TestRunner', '--- Test Suite 1: Queue & Rate Limiting ---');
  const enqueued = queueService.enqueue('event', 'site_test_001', { event_name: 'button_click' }, 'req_test_1');
  assert(enqueued === true, 'Queue enqueues event successfully');

  const duplicateCheck = queueService.isDuplicate('req_test_1');
  assert(duplicateCheck === true, 'Idempotency filter identifies duplicate request key');

  const duplicateCheckNew = queueService.isDuplicate('req_test_2');
  assert(duplicateCheckNew === false, 'Idempotency filter permits unique request key');

  const rateLimit1 = queueService.checkRateLimit('ip_127_0_0_1', 10, 60000);
  assert(rateLimit1.allowed === true, 'Rate limiter permits request under limit');

  // 2. Metrics Generation Test
  Logger.info('TestRunner', '--- Test Suite 2: System Telemetry Metrics ---');
  const metrics = queueService.getMetrics();
  assert(metrics.collectorStatus === 'online', 'Collector status reports online');
  assert(typeof metrics.queueLength === 'number', 'Queue length metric is valid number');
  assert(typeof metrics.avgInsertTimeMs === 'number', 'Average insert latency metric is numeric');

  Logger.info('TestRunner', '==============================================');
  Logger.info('TestRunner', `SUMMARY: ${passed} Passed, ${failed} Failed`);
  Logger.info('TestRunner', '==============================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  Logger.error('TestRunner', 'Fatal error during test run', { error: err });
  process.exit(1);
});
