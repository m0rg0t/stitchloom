import assert from "node:assert/strict";
import {
  createVkBridgeService,
  getVkLaunchContext,
  isAppleNativeVkPlatform,
  isNativeVkPlatform,
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
assert.equal(isNativeVkPlatform("mobile_android"), true);
assert.equal(isNativeVkPlatform("mobile_iphone"), true);
assert.equal(isNativeVkPlatform("mobile_web"), false);
assert.equal(isAppleNativeVkPlatform("mobile_ipad"), true);
assert.equal(isAppleNativeVkPlatform("mobile_android"), false);

const successfulCalls = [];
const storageValues = new Map();
const successfulService = createVkBridgeService({
  context: { enabled: true, platform: "mobile_android" },
  loadBridge: async () => ({
    async send(method, params) {
      successfulCalls.push({ method, params });
      if (
        method === "VKWebAppShowBannerAd"
        || method === "VKWebAppCheckNativeAds"
        || method === "VKWebAppShowStoryBox"
        || method === "VKWebAppDownloadFile"
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
assert.equal(await successfulService.downloadFile(
  "https://files.pixel-and-byte.ru/download.pdf?signature=test",
  "stitchloom.pdf",
), true);
assert.deepEqual(successfulCalls.map(({ method }) => method), [
  "VKWebAppInit",
  "VKWebAppShowBannerAd",
  "VKWebAppCheckNativeAds",
  "VKWebAppShowNativeAds",
  "VKWebAppShowStoryBox",
  "VKWebAppDownloadFile",
]);
assert.deepEqual(successfulCalls.at(-2), {
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
assert.deepEqual(successfulCalls.at(-1), {
  method: "VKWebAppDownloadFile",
  params: {
    url: "https://files.pixel-and-byte.ru/download.pdf?signature=test",
    filename: "stitchloom.pdf",
  },
});

const appleCalls = [];
const appleService = createVkBridgeService({
  context: { enabled: true, platform: "mobile_iphone" },
  loadBridge: async () => ({
    async send(method, params) {
      appleCalls.push({ method, params });
      return { result: true };
    },
  }),
  sessionStorage: null,
});
assert.equal(await appleService.downloadFile("https://files.example/pattern.pdf", "pattern.pdf"), false);
assert.equal(appleCalls.length, 0, "Apple download waits for a direct user action");
assert.equal(await appleService.downloadFile(
  "https://files.example/pattern.pdf",
  "pattern.pdf",
  { userInitiated: true },
), true);
assert.deepEqual(appleCalls.map(({ method }) => method), ["VKWebAppInit", "VKWebAppDownloadFile"]);

const webService = createVkBridgeService({
  context: { enabled: true, platform: "mobile_web" },
  loadBridge: async () => { throw new Error("must not load bridge"); },
  sessionStorage: null,
});
assert.equal(webService.supportsFileDownload(), false);
assert.equal(await webService.downloadFile("https://files.example/pattern.pdf", "pattern.pdf"), false);

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
