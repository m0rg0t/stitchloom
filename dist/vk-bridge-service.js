const VK_REQUIRED_LAUNCH_PARAMS = ["vk_app_id", "vk_user_id", "vk_platform", "sign"];
const VK_INTERSTITIAL_SESSION_KEY = "stitchloom:vk-interstitial-shown:v1";

function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function getVkLaunchContext(locationLike = {}) {
  const params = new URLSearchParams(locationLike.search || "");
  const isTestMode = isLocalHostname(locationLike.hostname || "") && params.get("vk_test") === "1";
  const hasLaunchParams = VK_REQUIRED_LAUNCH_PARAMS.every((key) => Boolean(params.get(key)));

  return {
    enabled: isTestMode || hasLaunchParams,
    isTestMode,
    platform: params.get("vk_platform") || (isTestMode ? "mobile_web" : ""),
  };
}

export function shouldShowInterstitial({ alreadyShown = false } = {}) {
  return !alreadyShown;
}

function withTimeout(promise, timeoutMs, method) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${method} timed out`)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

function diagnostic(...values) {
  console.info("[Stitchloom/VK]", ...values);
}

export function createVkBridgeService({
  context,
  loadBridge,
  sessionStorage,
} = {}) {
  let initPromise = null;
  let shownInMemory = false;

  async function send(method, params, timeoutMs = 8000) {
    if (!context?.enabled) return null;
    try {
      const bridge = await loadBridge();
      if (!bridge?.send) throw new Error("VK Bridge is unavailable");
      const result = await withTimeout(Promise.resolve(bridge.send(method, params)), timeoutMs, method);
      diagnostic(method, "success", result || {});
      return result || {};
    } catch (error) {
      diagnostic(method, "failed", error instanceof Error ? error.message : error);
      return null;
    }
  }

  function init() {
    if (!context?.enabled) return Promise.resolve(false);
    initPromise ??= send("VKWebAppInit").then(Boolean);
    return initPromise;
  }

  async function showBannerAd() {
    if (!await init()) return false;
    const result = await send("VKWebAppShowBannerAd", {
      banner_location: "bottom",
      layout_type: "resize",
    });
    return Boolean(result?.result);
  }

  function wasInterstitialShown() {
    if (shownInMemory) return true;
    try {
      return sessionStorage?.getItem(VK_INTERSTITIAL_SESSION_KEY) === "1";
    } catch {
      return shownInMemory;
    }
  }

  function rememberInterstitial() {
    shownInMemory = true;
    try {
      sessionStorage?.setItem(VK_INTERSTITIAL_SESSION_KEY, "1");
    } catch {
      // The in-memory flag still prevents repeated interruptions on this page.
    }
  }

  async function showInterstitialAfterExport() {
    if (!context?.enabled || !shouldShowInterstitial({ alreadyShown: wasInterstitialShown() })) {
      return false;
    }
    if (!await init()) return false;
    const availability = await send("VKWebAppCheckNativeAds", { ad_format: "interstitial" });
    if (!availability?.result) return false;
    const result = await send("VKWebAppShowNativeAds", { ad_format: "interstitial" }, 120000);
    if (!result) return false;
    rememberInterstitial();
    return true;
  }

  async function hideBannerAd() {
    if (!context?.enabled) return false;
    const result = await send("VKWebAppHideBannerAd");
    return Boolean(result?.result);
  }

  return { init, showBannerAd, showInterstitialAfterExport, hideBannerAd };
}

function createLocalMockBridge(windowRef) {
  const calls = [];
  const scenario = new URLSearchParams(windowRef.location.search).get("vk_mock") || "success";
  windowRef.__STITCHLOOM_VK_MOCK__ = { calls, scenario };

  return {
    async send(method, params) {
      calls.push({ method, params: params || null });
      if (scenario === "ads-unavailable" && (method.includes("Ads") || method.includes("BannerAd"))) {
        throw new Error("Ads are unavailable in this mock scenario");
      }
      if (method === "VKWebAppShowBannerAd" || method === "VKWebAppCheckNativeAds") {
        return { result: true };
      }
      if (method === "VKWebAppHideBannerAd") return { result: true };
      return {};
    },
  };
}

function loadBrowserBridge(windowRef, documentRef, context) {
  if (context.isTestMode) {
    windowRef.__STITCHLOOM_VK_BRIDGE_MOCK__ ??= createLocalMockBridge(windowRef);
    return Promise.resolve(windowRef.__STITCHLOOM_VK_BRIDGE_MOCK__);
  }
  if (windowRef.vkBridge?.send) return Promise.resolve(windowRef.vkBridge);

  return new Promise((resolve, reject) => {
    const existing = documentRef.querySelector('script[data-stitchloom-vk-bridge]');
    const script = existing || documentRef.createElement("script");
    const finish = () => windowRef.vkBridge?.send
      ? resolve(windowRef.vkBridge)
      : reject(new Error("VK Bridge did not initialize"));
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("VK Bridge failed to load")), { once: true });
      return;
    }
    script.src = new URL("./vendor/vk-bridge.min.js", import.meta.url).href;
    script.dataset.stitchloomVkBridge = "";
    script.onload = finish;
    script.onerror = () => reject(new Error("VK Bridge failed to load"));
    documentRef.head.appendChild(script);
  });
}

const browserWindow = typeof window === "undefined" ? null : window;
const browserDocument = typeof document === "undefined" ? null : document;

export const vkLaunchContext = browserWindow
  ? getVkLaunchContext(browserWindow.location)
  : { enabled: false, isTestMode: false, platform: "" };

export const vkBridgeService = createVkBridgeService({
  context: vkLaunchContext,
  loadBridge: () => loadBrowserBridge(browserWindow, browserDocument, vkLaunchContext),
  sessionStorage: (() => {
    try {
      return browserWindow?.sessionStorage || null;
    } catch {
      return null;
    }
  })(),
});

export async function initVkMode() {
  if (!vkLaunchContext.enabled) return false;
  document.documentElement.dataset.vkMode = "true";
  const initialized = await vkBridgeService.init();
  if (initialized) await vkBridgeService.showBannerAd();
  return initialized;
}

export function showVkInterstitialAfterExport() {
  return vkBridgeService.showInterstitialAfterExport();
}
