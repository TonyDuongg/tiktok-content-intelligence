const API_BASE = import.meta.env?.VITE_API_BASE_URL || "";

async function request(endpoint, options = {}) {
  const { timeout = 20000, signal, ...fetchOptions } = options;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try {
    const response = await fetch(API_BASE + endpoint, {
      ...fetchOptions,
      credentials: "omit",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success === false) {
      const validation =
        response.status === 400 && data?.data && typeof data.data === "object"
          ? Object.values(data.data).join(". ")
          : "";
      throw new Error(
        validation ||
          (response.status === 429
            ? "Bạn đang gửi quá nhiều yêu cầu. Vui lòng đợi một lát rồi thử lại."
            : data?.message ||
              `Không thể hoàn tất yêu cầu (${response.status}). Vui lòng thử lại.`),
      );
    }
    if (!data)
      throw new Error("Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (controller.signal.aborted)
      throw new Error(
        "Yêu cầu mất quá nhiều thời gian. Hãy làm mới kho kịch bản trước khi tạo lại để tránh trùng lặp.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "Không kết nối được máy chủ. Kiểm tra backend và thử lại.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export const api = {
  getCategories: (options) => request("/api/v1/categories", options),
  getWorkspaceStatus: (options) => request("/api/v1/workspace/status", options),
  ingestChannel: (username, categoryId, maxVideos = 10) =>
    request(
      `/api/v1/channels/ingest?${new URLSearchParams({ username, categoryId, maxVideos })}`,
      { method: "POST", timeout: 90000 },
    ),
  getChannel: (username) =>
    request(`/api/v1/channels/${encodeURIComponent(username)}`),
  getTopVideos: (username, limit = 10) =>
    request(
      `/api/v1/channels/${encodeURIComponent(username)}/top-videos?limit=${limit}`,
    ),
  dispatchJob: (jobData) =>
    request("/api/v1/jobs", { method: "POST", body: JSON.stringify(jobData) }),
  getJob: (jobId) => request(`/api/v1/jobs/${encodeURIComponent(jobId)}`),
  getMyJobs: () => request("/api/v1/jobs/my-jobs"),
  generateDirectScript: (scriptData) =>
    request("/api/v1/scripts/generate", {
      method: "POST",
      body: JSON.stringify(scriptData),
      // Leave time for the backend's 120-second Gemini timeout and error response.
      timeout: 150000,
    }),
  getScriptDetail: (id) => request(`/api/v1/scripts/${encodeURIComponent(id)}`),
  getMyScripts: (options) => request("/api/v1/scripts/my-scripts", options),
  updateScriptStatus: (id, status) =>
    request(
      `/api/v1/scripts/${encodeURIComponent(id)}/status?${new URLSearchParams({ status })}`,
      { method: "PATCH" },
    ),
};
