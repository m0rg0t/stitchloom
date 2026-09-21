const DEFAULT_SERVICE_URL = "https://files.pixel-and-byte.ru";
const STITCHLOOM_APP_ID = 54777468;
const SESSION_REFRESH_MARGIN_SECONDS = 30;
const API_TIMEOUT_MS = 20000;
const STORAGE_TIMEOUT_MS = 120000;
const MAX_TEMPORARY_FILE_SIZE = 64 * 1024 * 1024;

const FILE_RULES = Object.freeze({
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".csv": "text/csv",
  ".stitchloom": "application/x-stitchloom+json",
});

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseErrorCode(body) {
  return isRecord(body) && typeof body.error === "string" && body.error
    ? body.error
    : "request_failed";
}

function expectedTypeForFile(file) {
  const normalizedName = String(file?.name || "").toLowerCase();
  const extension = Object.keys(FILE_RULES).find((candidate) => normalizedName.endsWith(candidate));
  return extension ? FILE_RULES[extension] : "";
}

function isValidHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export class TemporaryFilesError extends Error {
  constructor(code, status = null) {
    super(code);
    this.name = "TemporaryFilesError";
    this.code = code;
    this.status = status;
  }
}

export function createTemporaryFilesService({
  fetchImpl = globalThis.fetch?.bind(globalThis),
  now = () => Date.now(),
  getLaunchParams = () => globalThis.window?.location?.search || "",
  serviceUrl = DEFAULT_SERVICE_URL,
  appId = STITCHLOOM_APP_ID,
  apiTimeoutMs = API_TIMEOUT_MS,
  storageTimeoutMs = STORAGE_TIMEOUT_MS,
} = {}) {
  let session = null;
  let sessionRequest = null;
  let sessionGeneration = 0;
  const baseUrl = String(serviceUrl).replace(/\/+$/, "");

  async function withDeadline(operation, timeoutMs) {
    const controller = new AbortController();
    let timer;
    const expired = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new TemporaryFilesError("request_timeout"));
      }, timeoutMs);
    });
    try {
      return await Promise.race([operation(controller.signal), expired]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function requestJson(path, init, timeoutMs = apiTimeoutMs) {
    if (typeof fetchImpl !== "function") throw new TemporaryFilesError("network_unavailable");
    return withDeadline(async (signal) => {
      let response;
      try {
        response = await fetchImpl(`${baseUrl}${path}`, {
          ...init,
          signal,
          headers: { "Content-Type": "application/json", ...(init.headers || {}) },
        });
      } catch (error) {
        if (error instanceof TemporaryFilesError) throw error;
        throw new TemporaryFilesError("network_error");
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new TemporaryFilesError(parseErrorCode(body), response.status);
      }
      const body = await response.json().catch(() => null);
      if (!isRecord(body)) throw new TemporaryFilesError("invalid_response");
      return body;
    }, timeoutMs);
  }

  function validateSession(body) {
    const nowSeconds = Math.floor(now() / 1000);
    if (
      typeof body.token !== "string"
      || !body.token
      || !Number.isFinite(body.expiresAt)
      || body.expiresAt <= nowSeconds
      || (body.appId !== undefined && Number(body.appId) !== appId)
    ) {
      throw new TemporaryFilesError("invalid_auth_response");
    }
    if (body.refreshToken !== undefined && (
      typeof body.refreshToken !== "string"
      || !body.refreshToken
      || !Number.isFinite(body.refreshExpiresAt)
      || body.refreshExpiresAt <= nowSeconds
    )) {
      throw new TemporaryFilesError("invalid_auth_response");
    }
    return body;
  }

  async function requestSession() {
    const nowSeconds = Math.floor(now() / 1000);
    if (session?.refreshToken && session.refreshExpiresAt > nowSeconds) {
      return validateSession(await requestJson("/v1/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.refreshToken}` },
      }));
    }

    const launchParams = getLaunchParams();
    const params = new URLSearchParams(launchParams);
    const launchedAt = Number(params.get("vk_ts"));
    if (params.has("sign") && launchedAt && nowSeconds - launchedAt > 900) {
      throw new TemporaryFilesError("session_expired", 401);
    }
    return validateSession(await requestJson("/v1/auth/vk", {
      method: "POST",
      body: JSON.stringify({ launchParams, appId }),
    }));
  }

  async function getSession() {
    const nowSeconds = Math.floor(now() / 1000);
    if (session && session.expiresAt > nowSeconds + SESSION_REFRESH_MARGIN_SECONDS) return session;
    if (!sessionRequest) {
      const generation = sessionGeneration;
      sessionRequest = requestSession().then((value) => {
        if (generation === sessionGeneration) session = value;
        return value;
      }).finally(() => {
        if (generation === sessionGeneration) sessionRequest = null;
      });
    }
    return sessionRequest;
  }

  function validateFile(file) {
    const expectedType = expectedTypeForFile(file);
    if (
      !expectedType
      || file.type !== expectedType
      || !Number.isFinite(file.size)
      || file.size < 1
      || file.size > MAX_TEMPORARY_FILE_SIZE
    ) {
      throw new TemporaryFilesError("invalid_export_file");
    }
  }

  function validateUploadPlan(created) {
    if (
      typeof created.uploadId !== "string"
      || !created.uploadId
      || typeof created.ticket !== "string"
      || !created.ticket
      || !isRecord(created.upload)
      || String(created.upload.method || "PUT").toUpperCase() !== "PUT"
      || !isValidHttpsUrl(created.upload.url)
      || !isRecord(created.upload.headers)
      || Object.values(created.upload.headers).some((value) => typeof value !== "string")
    ) {
      throw new TemporaryFilesError("invalid_upload_response");
    }
  }

  async function uploadToStorage(plan, file) {
    await withDeadline(async (signal) => {
      let response;
      try {
        response = await fetchImpl(plan.url, {
          method: "PUT",
          headers: plan.headers,
          body: file,
          signal,
        });
      } catch {
        throw new TemporaryFilesError("storage_network_error");
      }
      if (!response.ok) {
        throw new TemporaryFilesError("storage_upload_failed", response.status);
      }
    }, storageTimeoutMs);
  }

  async function upload(file) {
    validateFile(file);
    const currentSession = await getSession();
    const created = await requestJson("/v1/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${currentSession.token}` },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        validation: { sourceFileCount: 1 },
      }),
    });
    validateUploadPlan(created);
    await uploadToStorage(created.upload, file);

    // A large upload can outlive the access token used to create it.
    const completionSession = await getSession();
    const completed = await requestJson(
      `/v1/uploads/${encodeURIComponent(created.uploadId)}/complete`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${completionSession.token}` },
        body: JSON.stringify({ ticket: created.ticket }),
      },
    );
    if (
      !isValidHttpsUrl(completed.downloadUrl)
      || completed.fileName !== file.name
      || !Number.isFinite(completed.expiresAt)
      || completed.expiresAt <= now() / 1000
    ) {
      throw new TemporaryFilesError("invalid_download_response");
    }
    return completed;
  }

  function clearSession() {
    sessionGeneration += 1;
    session = null;
    sessionRequest = null;
  }

  return { upload, initialize: getSession, clearSession };
}

export const temporaryFilesService = createTemporaryFilesService();
