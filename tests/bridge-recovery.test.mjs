import test from 'node:test';
import assert from 'node:assert/strict';
import { createVkBridgeService } from '../dist/vk-bridge-service.js';
test('Bridge startup also bounds a stalled bundle loader', async () => {
  const service = createVkBridgeService({ context: { enabled: true }, loadBridge: () => new Promise(() => {}), commandTimeoutMs: 10 });
  assert.equal(await service.init(), false);
});
test('negative initialization does not start optional ads', async () => {
  const calls = [];
  const service = createVkBridgeService({ context: { enabled: true }, loadBridge: async () => ({ send: async method => { calls.push(method); return { result: false }; } }) });
  assert.equal(await service.showBannerAd(), false); assert.deepEqual(calls, ['VKWebAppInit']);
});
test('concurrent exports share one interstitial attempt', async () => {
  const calls = [];
  const service = createVkBridgeService({ context: { enabled: true }, loadBridge: async () => ({ send: async method => { calls.push(method); return { result: true }; } }) });
  assert.deepEqual(await Promise.all([service.showInterstitialAfterExport(), service.showInterstitialAfterExport()]), [true, true]);
  assert.equal(calls.filter(method => method === 'VKWebAppShowNativeAds').length, 1);
  assert.equal(await service.showInterstitialAfterExport(), false);
});
test('failed interstitial result is not remembered as successful', async () => {
  let shown = 0;
  const service = createVkBridgeService({ context: { enabled: true }, loadBridge: async () => ({ send: async method => ({ result: method !== 'VKWebAppShowNativeAds' || ++shown > 1 }) }) });
  assert.equal(await service.showInterstitialAfterExport(), false);
  assert.equal(await service.showInterstitialAfterExport(), true);
});
