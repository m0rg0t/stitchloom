import assert from "node:assert/strict";
import {
  createVkBridgeService,
  getVkLaunchContext,
  shouldShowInterstitial,
} from "../dist/vk-bridge-service.js";

assert.deepEqual(
  getVkLaunchContext({
    hostname: "example.com",
    search: "?vk_app_id=1&vk_user_id=2&vk_platform=mobile_android&sign=signed",
  }),
  { enabled: true, isTestMode: false, appId: "1", platform: "mobile_android" },
);
assert.equal(getVkLaunchContext({ hostname: "example.com", search: "?vk_app_id=1" }).enabled, false);
assert.equal(getVkLaunchContext({ hostname: "example.com", search: "?vk_test=1" }).enabled, false);
assert.equal(getVkLaunchContext({ hostname: "127.0.0.1", search: "?vk_test=1" }).enabled, true);
assert.equal(shouldShowInterstitial({ alreadyShown: false }), true);
assert.equal(shouldShowInterstitial({ alreadyShown: true }), false);

const successfulCalls = [];
const storageValues = new Map();
const successfulService = createVkBridgeService({
  context: { enabled: true },
  loadBridge: async () => ({
    async send(method, params) {
      successfulCalls.push({ method, params });
      if (
        method === "VKWebAppShowBannerAd"
        || method === "VKWebAppCheckNativeAds"
        || method === "VKWebAppShowStoryBox"
      ) {
        return { result: true };
      }
      return {};
    },
  }),
  sessionStorage: {
    getItem: (key) => storageValues.get(key) || null,
    setItem: (key, value) => storageValues.set(key, value),
  },
});

assert.equal(await successfulService.showBannerAd(), true);
assert.equal(await successfulService.showInterstitialAfterExport(), true);
assert.equal(await successfulService.showInterstitialAfterExport(), false, "interstitial is capped to once per session");
assert.equal(await successfulService.showStory({
  blob: "data:image/jpeg;base64,c3RpdGNobG9vbQ==",
  attachmentUrl: "https://vk.com/app1",
}), true);
assert.deepEqual(successfulCalls.map(({ method }) => method), [
  "VKWebAppInit",
  "VKWebAppShowBannerAd",
  "VKWebAppCheckNativeAds",
  "VKWebAppShowNativeAds",
  "VKWebAppShowStoryBox",
]);
assert.deepEqual(successfulCalls.at(-1), {
  method: "VKWebAppShowStoryBox",
  params: {
    background_type: "image",
    blob: "data:image/jpeg;base64,c3RpdGNobG9vbQ==",
    locked: true,
    attachment: {
      text: "open",
      type: "url",
      url: "https://vk.com/app1",
    },
  },
});

const failingService = createVkBridgeService({
  context: { enabled: true },
  loadBridge: async () => ({ send: async () => { throw new Error("declined"); } }),
  sessionStorage: null,
});
assert.equal(await failingService.showBannerAd(), false);
assert.equal(await failingService.showInterstitialAfterExport(), false);
assert.equal(await failingService.showStory({ blob: "data:image/png;base64,c3RpdGNobG9vbQ==" }), false);
assert.equal(await successfulService.showStory({ blob: "not-an-image" }), false);

console.log("vk-mode: ok");
