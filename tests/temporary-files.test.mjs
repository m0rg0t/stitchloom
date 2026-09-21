import assert from "node:assert/strict";
import {
  createTemporaryFilesService,
  TemporaryFilesError,
} from "../dist/temporary-files-service.js";

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

let nowMs = 2_000_000_000_000;
const nowSeconds = () => Math.floor(nowMs / 1000);
const calls = [];
const fetchImpl = async (url, init = {}) => {
  calls.push({ url, init });
  if (url.endsWith("/v1/auth/vk")) {
    return jsonResponse({
      token: "access-token",
      expiresAt: nowSeconds() + 900,
      refreshToken: "refresh-token",
      refreshExpiresAt: nowSeconds() + 8 * 60 * 60,
      appId: 54777468,
    });
  }
  if (url.endsWith("/v1/uploads")) {
    return jsonResponse({
      uploadId: "upload-1",
      ticket: "ticket-1",
      upload: {
        method: "PUT",
        url: "https://storage.example/upload",
        headers: {
          "Content-Type": "application/pdf",
          "x-amz-meta-upload-id": "upload-1",
        },
      },
    });
  }
  if (url === "https://storage.example/upload") return new Response(null, { status: 200 });
  if (url.endsWith("/v1/uploads/upload-1/complete")) {
    return jsonResponse({
      downloadUrl: "https://storage.example/download?signature=test",
      fileName: "stitchloom-70x70.pdf",
      expiresAt: nowSeconds() + 900,
    });
  }
  throw new Error(`Unexpected request: ${url}`);
};

const launchParams = "?vk_app_id=54777468&vk_user_id=42&vk_platform=mobile_android&vk_ts=2000000000&sign=signed";
const service = createTemporaryFilesService({
  fetchImpl,
  now: () => nowMs,
  getLaunchParams: () => launchParams,
  serviceUrl: "https://files.pixel-and-byte.ru/",
});

await Promise.all([service.initialize(), service.initialize()]);
assert.equal(calls.filter(({ url }) => url.endsWith("/v1/auth/vk")).length, 1, "startup auth is deduplicated");
assert.deepEqual(JSON.parse(calls[0].init.body), {
  launchParams,
  appId: 54777468,
});

const file = new File(["%PDF-1.4\n%%EOF\n"], "stitchloom-70x70.pdf", { type: "application/pdf" });
const result = await service.upload(file);
assert.deepEqual(result, {
  downloadUrl: "https://storage.example/download?signature=test",
  fileName: "stitchloom-70x70.pdf",
  expiresAt: nowSeconds() + 900,
});
assert.deepEqual(calls.map(({ url }) => url), [
  "https://files.pixel-and-byte.ru/v1/auth/vk",
  "https://files.pixel-and-byte.ru/v1/uploads",
  "https://storage.example/upload",
  "https://files.pixel-and-byte.ru/v1/uploads/upload-1/complete",
]);
assert.equal(calls[1].init.headers.Authorization, "Bearer access-token");
assert.deepEqual(JSON.parse(calls[1].init.body), {
  fileName: "stitchloom-70x70.pdf",
  fileSize: file.size,
  contentType: "application/pdf",
  validation: { sourceFileCount: 1 },
});
assert.deepEqual(calls[2].init.headers, {
  "Content-Type": "application/pdf",
  "x-amz-meta-upload-id": "upload-1",
});
assert.equal(calls[2].init.body, file);
assert.equal(calls[3].init.headers.Authorization, "Bearer access-token");

let invalidFetchCalled = false;
const validationService = createTemporaryFilesService({
  fetchImpl: async () => {
    invalidFetchCalled = true;
    throw new Error("should not fetch");
  },
});
await assert.rejects(
  validationService.upload(new File(["no"], "pattern.exe", { type: "application/octet-stream" })),
  (error) => error instanceof TemporaryFilesError && error.code === "invalid_export_file",
);
assert.equal(invalidFetchCalled, false, "invalid files are rejected before authentication");

let refreshNow = 2_000_100_000_000;
const refreshCalls = [];
const refreshService = createTemporaryFilesService({
  now: () => refreshNow,
  getLaunchParams: () => `?vk_app_id=54777468&vk_user_id=42&vk_platform=mobile_android&vk_ts=${Math.floor(refreshNow / 1000)}&sign=signed`,
  fetchImpl: async (url, init) => {
    refreshCalls.push({ url, init });
    if (url.endsWith("/v1/auth/vk")) {
      return jsonResponse({
        token: "short-access",
        expiresAt: Math.floor(refreshNow / 1000) + 60,
        refreshToken: "long-refresh",
        refreshExpiresAt: Math.floor(refreshNow / 1000) + 3600,
        appId: 54777468,
      });
    }
    return jsonResponse({
      token: "renewed-access",
      expiresAt: Math.floor(refreshNow / 1000) + 900,
      refreshToken: "renewed-refresh",
      refreshExpiresAt: Math.floor(refreshNow / 1000) + 3000,
      appId: 54777468,
    });
  },
});
await refreshService.initialize();
refreshNow += 40_000;
await refreshService.initialize();
assert.equal(refreshCalls[1].url, "https://files.pixel-and-byte.ru/v1/auth/refresh");
assert.equal(refreshCalls[1].init.headers.Authorization, "Bearer long-refresh");

let expiredFetchCalled = false;
const expiredLaunchService = createTemporaryFilesService({
  now: () => 2_000_000_000_000,
  getLaunchParams: () => "?vk_app_id=54777468&vk_user_id=42&vk_platform=mobile_android&vk_ts=1999999000&sign=expired",
  fetchImpl: async () => {
    expiredFetchCalled = true;
    throw new Error("expired launch data must not be sent");
  },
});
await assert.rejects(
  expiredLaunchService.initialize(),
  (error) => error instanceof TemporaryFilesError && error.code === "session_expired" && error.status === 401,
);
assert.equal(expiredFetchCalled, false, "expired signed launch params are rejected before the network request");

const timeoutService = createTemporaryFilesService({
  apiTimeoutMs: 5,
  getLaunchParams: () => launchParams,
  fetchImpl: async () => new Promise(() => {}),
});
await assert.rejects(
  timeoutService.initialize(),
  (error) => error instanceof TemporaryFilesError && error.code === "request_timeout",
);

console.log("temporary-files: ok");
