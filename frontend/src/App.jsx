import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Archive,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Film,
  LoaderCircle,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { api } from "./api";
import {
  DRAFT_KEY,
  filterScripts,
  formatDate,
  formatNumber,
  normalizeUsername,
  readDraft,
  safeVideoUrl,
  scriptText,
  STATUS_LABELS,
  categoryKind,
  categoryLabel,
  durationToSeconds,
  formatDuration,
} from "./studio";
import { EmptyState, Notice, ScriptPreview } from "./components";

const TONES = [
  "Chân thực, gần gũi",
  "Hài hước, dí dỏm",
  "Chuyên gia, rõ ràng",
  "Tâm sự, kể chuyện",
];
const SHORT_TONES = ["Chân thực", "Hài hước", "Chuyên gia", "Kể chuyện"];
const SHORT_CATEGORIES = { beauty: "Làm đẹp", fashion: "Thời trang", food: "Ẩm thực", tech: "Công nghệ", lifestyle: "Đời sống" };
const IDEAS = [
  ["beauty", "3 điều cần kiểm tra khi chọn kem chống nắng"],
  ["fashion", "Phối một chiếc áo sơ mi thành 3 bộ đồ đi làm"],
  ["food", "Một bữa trưa dễ nấu cho ngày bận rộn"],
  ["tech", "3 cách sắp xếp màn hình điện thoại gọn hơn"],
  ["lifestyle", "Những điều tôi học được trong tháng đầu đi làm"],
];
const TABS = [
  { id: "studio", label: "Xưởng kịch bản", icon: FileText },
  { id: "channel", label: "Nghiên cứu kênh", icon: TrendingUp },
  { id: "history", label: "Kho kịch bản", icon: Bookmark },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("studio");
  const [draft, setDraft] = useState(readDraft);
  const [storageError, setStorageError] = useState(false);
  const [categories, setCategories] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(true);
  const [scriptsError, setScriptsError] = useState("");
  const [script, setScript] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [pending, setPending] = useState(null);
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef();
  const previewRef = useRef(null);
  const generationLock = useRef(false);
  const statusLock = useRef(false);
  const setupVersion = useRef(0);
  const scriptsVersion = useRef(0);
  const [username, setUsername] = useState("");
  const [channelCategory, setChannelCategory] = useState("");
  const [maxVideos, setMaxVideos] = useState(10);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [channelLoading, setChannelLoading] = useState(false);
  const channelLock = useRef(false);
  const [channelError, setChannelError] = useState("");
  const [videoError, setVideoError] = useState("");
  const [sort, setSort] = useState("engagementRate");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopPane, setDesktopPane] = useState("brief");

  useEffect(() => {
    void window.creatorDesktop?.setBusy(generating || channelLoading).catch(() => {});
  }, [generating, channelLoading]);

  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  }, []);

  const loadSetup = useCallback(async (signal) => {
    const version = ++setupVersion.current;
    const results = await Promise.allSettled([
      api.getCategories({ signal }),
      api.getWorkspaceStatus({ signal }),
    ]);
    if (signal?.aborted || version !== setupVersion.current) return;
    if (results[0].status === "fulfilled" && results[0].value.data?.length) {
      const list = results[0].value.data.map((category) => ({
        ...category,
        name: categoryLabel(category),
      }));
      setCategories(list);
      setDraft((prev) => ({
        ...prev,
        categoryId: list.some((c) => String(c.id) === String(prev.categoryId))
          ? prev.categoryId
          : list[0].id,
      }));
      setChannelCategory((prev) =>
        list.some((c) => String(c.id) === String(prev)) ? prev : list[0].id,
      );
      setSetupError("");
    } else
      setSetupError(
        results[0].reason?.message ||
          "Chưa có lĩnh vực nào. Vui lòng kiểm tra dữ liệu trên máy chủ.",
      );
    if (results[1].status === "fulfilled") {
      setWorkspace(results[1].value.data);
      setWorkspaceError("");
    } else {
      setWorkspace(null);
      setWorkspaceError(
        "Chưa xác định được nguồn dữ liệu. Thử kết nối lại trước khi sử dụng kết quả nghiên cứu.",
      );
    }
    setSetupLoading(false);
  }, []);

  const loadScripts = useCallback(async (signal) => {
    const version = ++scriptsVersion.current;
    try {
      const result = await api.getMyScripts({ signal });
      if (signal?.aborted || version !== scriptsVersion.current) return;
      setScripts(result.data || []);
      setScriptsError("");
    } catch (error) {
      if (!signal?.aborted && version === scriptsVersion.current)
        setScriptsError(error.message);
    } finally {
      if (!signal?.aborted && version === scriptsVersion.current)
        setScriptsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadSetup(controller.signal);
      loadScripts(controller.signal);
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
      clearTimeout(toastTimer.current);
    };
  }, [loadSetup, loadScripts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [draft]);

  function reloadSetup() {
    setSetupLoading(true);
    loadSetup();
  }
  function reloadScripts() {
    setScriptsLoading(true);
    loadScripts();
  }

  function navigate(tab) {
    setActiveTab(tab);
    setMenuOpen(false);
    setActionError("");
  }
  function focusPreview() {
    setDesktopPane("preview");
    requestAnimationFrame(() => {
      previewRef.current?.focus({ preventScroll: true });
      if (window.creatorDesktop) {
        previewRef.current?.querySelector(".preview-content")?.scrollTo({ top: 0 });
        return;
      }
      previewRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    });
  }
  function openScript(item) {
    setScript(item);
    navigate("studio");
    focusPreview();
  }
  function updateDraft(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }
  function upsertScript(value) {
    // Ignore list requests that started before this mutation.
    scriptsVersion.current += 1;
    setScriptsLoading(false);
    setScripts((prev) =>
      [value, ...prev.filter((item) => item.id !== value.id)].sort(
        (a, b) =>
          (Date.parse(b.createdAt) || b.id) - (Date.parse(a.createdAt) || a.id),
      ),
    );
    setScript((prev) => (prev?.id === value.id ? value : prev));
  }

  async function generate(event) {
    event.preventDefault();
    if (generationLock.current) return;
    const requestedDurationSeconds = durationToSeconds(
      draft.durationValue,
      draft.durationUnit,
    );
    if (requestedDurationSeconds === null) {
      setGenerateError(
        "Chọn thời lượng từ 15 giây đến 10 phút, làm tròn đến giây.",
      );
      return;
    }
    if (!draft.topic.trim()) {
      setGenerateError("Nhập chủ đề video trước khi tạo kịch bản.");
      return;
    }
    if (!draft.categoryId || setupError) {
      setGenerateError("Tải danh sách lĩnh vực rồi thử lại.");
      return;
    }
    generationLock.current = true;
    setGenerating(true);
    setGenerateError("");
    setActionError("");
    try {
      const result = await api.generateDirectScript({
        categoryId: Number(draft.categoryId),
        topic: draft.topic.trim(),
        targetAudience:
          draft.targetAudience.trim() || "Người xem TikTok Việt Nam",
        tone: draft.tone,
        referenceVideoIds: draft.references.map((v) => v.id),
        requestedDurationSeconds,
      });
      setScript(result.data);
      upsertScript(result.data);
      notify("Đã tạo và lưu kịch bản vào kho.");
      focusPreview();
    } catch (error) {
      setGenerateError(error.message);
    } finally {
      generationLock.current = false;
      setGenerating(false);
    }
  }

  async function changeStatus(item, status) {
    if (statusLock.current) return;
    statusLock.current = true;
    setPending(item.id);
    setActionError("");
    try {
      const result = await api.updateScriptStatus(item.id, status);
      upsertScript(result.data);
      notify(
        status === "FAVORITE"
          ? "Đã thêm vào yêu thích."
          : status === "ARCHIVED"
            ? "Đã lưu trữ kịch bản."
            : "Đã chuyển về bản nháp.",
      );
    } catch (error) {
      setActionError(error.message);
    } finally {
      statusLock.current = false;
      setPending(null);
    }
  }

  async function copy(item) {
    try {
      await navigator.clipboard.writeText(scriptText(item));
      notify("Đã sao chép kịch bản.");
    } catch {
      setActionError(
        "Trình duyệt chưa cho phép sao chép. Bạn có thể tải file .txt để lấy nội dung.",
      );
    }
  }
  function download(item) {
    const url = URL.createObjectURL(
      new Blob([scriptText(item)], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `kich-ban-${item.id}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Đã xuất kịch bản dạng .txt.");
  }

  async function searchChannel(event) {
    event.preventDefault();
    if (channelLock.current) return;
    const clean = normalizeUsername(username);
    if (!clean) {
      setChannelError(
        "Nhập @username (2–24 ký tự) hoặc link hồ sơ dạng https://tiktok.com/@tenkenh.",
      );
      return;
    }
    channelLock.current = true;
    setChannelLoading(true);
    setChannelError("");
    setVideoError("");
    setChannel(null);
    setVideos([]);
    try {
      const result = await api.ingestChannel(clean, channelCategory, maxVideos);
      setChannel(result.data);
      setUsername(clean);
      try {
        const resultVideos = await api.getTopVideos(clean, maxVideos);
        setVideos(resultVideos.data || []);
      } catch (error) {
        setVideoError(error.message);
      }
    } catch (error) {
      setChannelError(error.message);
    } finally {
      channelLock.current = false;
      setChannelLoading(false);
    }
  }
  async function retryVideos() {
    if (!channel || channelLock.current) return;
    channelLock.current = true;
    setChannelLoading(true);
    try {
      const result = await api.getTopVideos(channel.tiktokUsername, maxVideos);
      setVideos(result.data || []);
      setVideoError("");
    } catch (error) {
      setVideoError(error.message);
    } finally {
      channelLock.current = false;
      setChannelLoading(false);
    }
  }
  function selectReference(video) {
    if (draft.references.some((v) => v.id === video.id)) {
      navigate("studio");
      return;
    }
    if (draft.references.length >= 5) {
      setChannelError(
        "Bạn đã chọn 5 video. Bỏ một video trong xưởng kịch bản để chọn video khác.",
      );
      return;
    }
    setDraft((prev) => ({
      ...prev,
      categoryId: channel.category?.id || channelCategory,
      topic: prev.topic || video.caption?.slice(0, 1000) || "",
      references: [
        ...prev.references,
        {
          id: video.id,
          caption: video.caption,
          username: channel.tiktokUsername,
        },
      ],
    }));
    navigate("studio");
    notify("Đã thêm video tham khảo. Bạn có thể sửa chủ đề trước khi tạo.");
  }

  const filtered = filterScripts(scripts, query, filter);
  const pages = Math.max(1, Math.ceil(filtered.length / 9));
  const currentPage = Math.min(page, pages);
  const visibleScripts = filtered.slice((currentPage - 1) * 9, currentPage * 9);
  const currentCategory = categories.find(
    (c) => String(c.id) === String(draft.categoryId),
  );
  const idea =
    IDEAS.find(([slug]) => categoryKind(currentCategory) === slug)?.[1] ||
    IDEAS[0][1];
  const sortedVideos = [...videos].sort(
    (a, b) => Number(b[sort] || 0) - Number(a[sort] || 0),
  );

  return (
    <div className={window.creatorDesktop ? `app-shell desktop-mode workspace-${activeTab}` : "app-shell"}>
      <a href="#main" className="skip-link">
        Đến nội dung chính
      </a>
      <header className="app-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#studio"
            onClick={() => navigate("studio")}
          >
            <span className="brand-mark">
              <Film size={21} />
            </span>
            <span>
              <strong>Creator Studio</strong>
              <small>TikTok Content Intelligence</small>
            </span>
          </a>
          <button
            className="icon-button mobile-menu"
            aria-label="Mở điều hướng"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={22} />
          </button>
          <nav
            aria-label="Điều hướng chính"
            className={menuOpen ? "navigation open" : "navigation"}
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={
                  activeTab === id ? "nav-button active" : "nav-button"
                }
                aria-current={activeTab === id ? "page" : undefined}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
          {window.creatorDesktop ? (
            <button className="button subtle desktop-settings" aria-label="Cài đặt" disabled={generating || channelLoading}
              onClick={() => window.creatorDesktop.openSettings().catch(() => notify("Không mở được cài đặt. Hãy thử lại."))}>
              <Settings size={18} /> <span className="desktop-settings-label">Cài đặt</span>
            </button>
          ) : <div className="workspace-label">
            <span
              className={`connection-dot ${setupError ? "offline" : setupLoading ? "connecting" : ""}`}
            />
            {setupError
              ? "Chưa kết nối"
              : setupLoading
                ? "Đang kết nối"
                : "Dữ liệu trực tiếp"}
          </div>}
        </div>
      </header>
      <main id="main" className="main-container">
        <div className="page-heading">
          <div>
            <h1>
              {activeTab === "studio"
                ? "Viết kịch bản"
                : activeTab === "channel"
                  ? "Nghiên cứu kênh TikTok"
                  : "Kho kịch bản"}
            </h1>
            <p>
              {activeTab === "studio"
                ? "Từ chủ đề của bạn đến lời thoại sẵn sàng chỉnh sửa."
                : activeTab === "channel"
                  ? "Tìm video nổi bật và chọn chất liệu cho kịch bản."
                  : "Tìm lại, đánh dấu và chuẩn bị cho lần quay tiếp theo."}
            </p>
          </div>
          {activeTab === "studio" && window.creatorDesktop && (
            <div className="pane-switch" role="group" aria-label="Chọn vùng làm việc">
              <button type="button" aria-pressed={desktopPane === "brief"} onClick={() => setDesktopPane("brief")}>Thiết lập</button>
              <button type="button" aria-pressed={desktopPane === "preview"} onClick={() => setDesktopPane("preview")}>Kịch bản</button>
            </div>
          )}
          {activeTab === "history" && (
            <button
              className="button primary"
              onClick={() => navigate("studio")}
            >
              <Plus size={18} />
              Tạo kịch bản
            </button>
          )}
        </div>
        <div className="workspace-notices">
        {setupError && <Notice onRetry={reloadSetup}>{setupError}</Notice>}
        {workspaceError && (
          <Notice warning onRetry={reloadSetup}>
            {workspaceError}
          </Notice>
        )}
        {window.creatorDesktop && workspace?.issues?.length ? (
          <Notice warning>Mở Cài đặt để thêm khóa API cho {[
            !workspace.aiConfigured && "Gemini",
            !workspace.scraperConfigured && "RapidAPI",
          ].filter(Boolean).join(" và ") || "dịch vụ chưa kết nối"}.</Notice>
        ) : workspace?.issues?.map((issue) => (
          <Notice key={issue}>{issue}</Notice>
        ))}
        {actionError && <Notice>{actionError}</Notice>}
        </div>
        {activeTab === "studio" && (
          <div className={`studio-layout show-${desktopPane}`}>
            <section
              className="panel brief-panel"
              aria-label="Thiết lập kịch bản"
            >
              <div className="panel-heading">
                <h2>Thông tin video</h2>
                <span className="muted">
                  {storageError ? "Chưa lưu bản nhập" : "Tự lưu bản nhập"}
                </span>
              </div>
              {storageError && (
                <Notice warning>
                  Không lưu được bản nhập trên trình duyệt này. Hãy sao chép ý
                  tưởng trước khi đóng trang.
                </Notice>
              )}
              <form onSubmit={generate}>
                <fieldset disabled={generating} className="brief-fields">
                  <div className="field field-category">
                    <label htmlFor="category">Lĩnh vực</label>
                    <select
                      id="category"
                      value={draft.categoryId}
                      onChange={(e) =>
                        updateDraft("categoryId", e.target.value)
                      }
                      disabled={setupLoading || !!setupError || generating}
                    >
                      {!categories.length && (
                        <option value="">
                          {setupLoading
                            ? "Đang tải lĩnh vực…"
                            : "Chưa tải được lĩnh vực"}
                        </option>
                      )}
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {window.creatorDesktop ? SHORT_CATEGORIES[categoryKind(c)] || c.name : c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field field-topic">
                    <div className="label-row">
                      <label htmlFor="topic">
                        Chủ đề video <span className="required">*</span>
                      </label>
                      <span className="muted">{draft.topic.length}/1000</span>
                    </div>
                    <textarea
                      id="topic"
                      required
                      maxLength={1000}
                      rows={4}
                      placeholder="Nêu một vấn đề cụ thể và điều bạn muốn người xem nhận được…"
                      value={draft.topic}
                      onChange={(e) => {
                        updateDraft("topic", e.target.value);
                        setGenerateError("");
                      }}
                    />
                    <button
                      type="button"
                      className="idea-button"
                      aria-label={`Dùng gợi ý: ${idea}`}
                      title={idea}
                      onClick={() => updateDraft("topic", idea)}
                    >
                      <Plus size={14} />
                      <span className="idea-copy">Dùng gợi ý: {idea}</span>
                      <span className="idea-short" aria-hidden="true">Dùng gợi ý</span>
                    </button>
                  </div>
                  <div className="field field-audience">
                    <label htmlFor="audience">Người xem mục tiêu</label>
                    <input
                      id="audience"
                      maxLength={300}
                      placeholder={window.creatorDesktop ? "Ví dụ: sinh viên" : "Ví dụ: sinh viên mới bắt đầu chăm sóc da"}
                      value={draft.targetAudience}
                      onChange={(e) =>
                        updateDraft("targetAudience", e.target.value)
                      }
                    />
                  </div>
                  <div className="field field-tone">
                    <label htmlFor="tone">Giọng điệu</label>
                    <select
                      id="tone"
                      value={draft.tone}
                      onChange={(e) => updateDraft("tone", e.target.value)}
                    >
                      {TONES.map((tone, index) => (
                        <option key={tone} value={tone}>{window.creatorDesktop ? SHORT_TONES[index] : tone}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field field-duration">
                    <label htmlFor="duration-preset">Thời lượng video</label>
                    <select
                      id="duration-preset"
                      value={
                        draft.customDuration
                          ? "custom"
                          : durationToSeconds(
                              draft.durationValue,
                              draft.durationUnit,
                            )
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setDraft((prev) =>
                          value === "custom"
                            ? { ...prev, customDuration: true }
                            : {
                                ...prev,
                                durationValue: value,
                                durationUnit: "seconds",
                                customDuration: false,
                              },
                        );
                        setGenerateError("");
                      }}
                      aria-describedby="duration-hint"
                    >
                      {[15, 30, 60, 120, 180].map((seconds) => (
                        <option key={seconds} value={seconds}>
                          {formatDuration(seconds)}
                        </option>
                      ))}
                      <option value="custom">Tùy chỉnh…</option>
                    </select>
                    {draft.customDuration && (
                      <div className="duration-custom">
                        <div>
                          <label htmlFor="duration-value">Thời lượng</label>
                          <input
                            id="duration-value"
                            type="number"
                            required
                            min={draft.durationUnit === "minutes" ? 0.25 : 15}
                            max={draft.durationUnit === "minutes" ? 10 : 600}
                            step={draft.durationUnit === "minutes" ? "any" : 1}
                            inputMode="decimal"
                            value={draft.durationValue}
                            aria-describedby="duration-hint"
                            onChange={(e) =>
                              updateDraft("durationValue", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label htmlFor="duration-unit">Đơn vị</label>
                          <select
                            id="duration-unit"
                            value={draft.durationUnit}
                            onChange={(e) => {
                              const unit = e.target.value;
                              setDraft((prev) => {
                                const seconds = durationToSeconds(
                                  prev.durationValue,
                                  prev.durationUnit,
                                );
                                return {
                                  ...prev,
                                  durationUnit: unit,
                                  durationValue:
                                    seconds === null
                                      ? ""
                                      : String(
                                          unit === "minutes"
                                            ? seconds / 60
                                            : seconds,
                                        ),
                                };
                              });
                            }}
                          >
                            <option value="seconds">Giây</option>
                            <option value="minutes">Phút</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <p id="duration-hint" className="field-hint">
                      {draft.customDuration ? "Từ 15 giây đến 10 phút. " : ""}AI
                      điều chỉnh lời thoại và mốc quay theo thời lượng.
                    </p>
                  </div>
                  <details
                    className="references-field"
                    open={draft.references.length > 0 || undefined}
                  >
                    <summary>
                      Video tham khảo{" "}
                      <span className="muted">
                        {draft.references.length}/5 · tùy chọn
                      </span>
                    </summary>
                    {draft.references.length ? (
                      <ul className="selected-references">
                        {draft.references.map((v) => (
                          <li key={v.id}>
                            <div>
                              <strong>@{v.username}</strong>
                              <span>{v.caption || `Video ${v.id}`}</span>
                            </div>
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Bỏ video tham khảo ${v.id}`}
                              onClick={() =>
                                updateDraft(
                                  "references",
                                  draft.references.filter(
                                    (item) => item.id !== v.id,
                                  ),
                                )
                              }
                            >
                              <X size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="hint">
                        Không bắt buộc. Thêm video để AI tham khảo cấu trúc.
                      </p>
                    )}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => navigate("channel")}
                    >
                      Chọn từ nghiên cứu kênh <ArrowRight size={14} />
                    </button>
                  </details>
                </fieldset>
                <div className="brief-actions" aria-busy={generating}>
                {generateError && <Notice>{generateError}</Notice>}
                <button
                  type="submit"
                  className="button primary full-width"
                  disabled={
                    generating ||
                    setupLoading ||
                    !!setupError ||
                    !workspace?.aiConfigured
                  }
                >
                  {generating ? (
                    <>
                      <LoaderCircle size={18} className="spin" />
                      Đang tạo kịch bản…
                    </>
                  ) : (
                    <>
                      Tạo kịch bản
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <p className="form-note" role="status">
                  {generating
                    ? "Đang chờ AI phản hồi, có thể mất tối đa 2 phút."
                    : "Tự lưu vào kho kịch bản dùng chung"}
                </p>
                </div>
              </form>
            </section>
            <ScriptPreview
              script={script}
              loading={generating}
              pending={pending}
              onStatus={changeStatus}
              onCopy={copy}
              onDownload={download}
              onResearch={() => navigate("channel")}
              previewRef={previewRef}
            />
          </div>
        )}

        {activeTab === "channel" && (
          <div className="channel-workspace">
            <section className="panel search-panel">
              <h2>Phân tích một kênh TikTok</h2>
              <form onSubmit={searchChannel}>
                <div className="channel-fields">
                  <div className="field username-field">
                    <label htmlFor="username">
                      Tên người dùng hoặc link hồ sơ
                    </label>
                    <div className="input-with-icon">
                      <Search size={18} />
                      <input
                        id="username"
                        placeholder="@tenkenh hoặc https://tiktok.com/@tenkenh"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={channelLoading}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="channel-category">Lĩnh vực của kênh</label>
                    <select
                      id="channel-category"
                      value={channelCategory}
                      onChange={(e) => setChannelCategory(e.target.value)}
                      disabled={channelLoading || setupLoading}
                    >
                      {!categories.length && (
                        <option value="">Chưa tải lĩnh vực</option>
                      )}
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field sample-limit">
                    <label htmlFor="max-videos">Số video</label>
                    <select
                      id="max-videos"
                      value={maxVideos}
                      onChange={(e) => setMaxVideos(Number(e.target.value))}
                      disabled={channelLoading}
                    >
                      {[10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                          {n} video
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="button primary"
                    disabled={
                      channelLoading ||
                      setupLoading ||
                      !!setupError ||
                      !workspace?.scraperConfigured
                    }
                  >
                    {channelLoading ? (
                      <LoaderCircle size={18} className="spin" />
                    ) : (
                      <Search size={18} />
                    )}
                    {channelLoading ? "Đang phân tích…" : "Phân tích kênh"}
                  </button>
                </div>
              </form>
              <p className="hint">
                Hỗ trợ tên kênh và link hồ sơ đầy đủ. Kết quả phụ thuộc nguồn dữ
                liệu đang được cấu hình.
              </p>
            </section>
            <div className="channel-results">
            {channelError && <Notice>{channelError}</Notice>}
            {channelLoading && (
              <p role="status" className="loading-line">
                <LoaderCircle size={18} className="spin" /> Đang lấy hồ sơ và
                các video của kênh…
              </p>
            )}
            {channel && (
              <>
                <section className="channel-summary">
                  <div>
                    <h2>{channel.nickname || `@${channel.tiktokUsername}`}</h2>
                    <p className="muted">
                      @{channel.tiktokUsername} · Cập nhật{" "}
                      {formatDate(channel.lastScrapedAt)}
                    </p>
                    {channel.bio && (
                      <p className="channel-bio">{channel.bio}</p>
                    )}
                  </div>
                  <dl className="channel-stats">
                    <div>
                      <dt>Người theo dõi</dt>
                      <dd>{formatNumber(channel.followersCount)}</dd>
                    </div>
                    <div>
                      <dt>Tổng lượt thích</dt>
                      <dd>{formatNumber(channel.totalLikes)}</dd>
                    </div>
                    <div>
                      <dt>Video trên kênh</dt>
                      <dd>{formatNumber(channel.totalVideos)}</dd>
                    </div>
                  </dl>
                </section>
                <div className="section-toolbar">
                  <div>
                    <h2>
                      Video nổi bật{" "}
                      <span className="muted">({videos.length})</span>
                    </h2>
                    <p className="hint">
                      ER = (thích + bình luận + chia sẻ) / lượt xem × 100%. Xếp
                      hạng trong số video đã lấy.
                    </p>
                  </div>
                  <label className="sort-label">
                    Sắp xếp
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="engagementRate">Tương tác cao nhất</option>
                      <option value="viewCount">Lượt xem cao nhất</option>
                    </select>
                  </label>
                </div>
                {videoError && (
                  <Notice onRetry={retryVideos}>{videoError}</Notice>
                )}
                {!videos.length && !channelLoading && !videoError && (
                  <EmptyState title="Chưa tìm thấy video">
                    Thử một kênh khác hoặc phân tích lại sau.
                  </EmptyState>
                )}
                <div className="video-list">
                  {sortedVideos.map((video, i) => (
                    <article className="video-row" key={video.id}>
                      <span className="video-rank">{i + 1}</span>
                      <div className="video-description">
                        <h3>{video.caption || "Video chưa có mô tả"}</h3>
                        <div className="meta">
                          <span>{video.durationSeconds ?? "—"} giây</span>
                          <span>{formatDate(video.videoPublishedAt)}</span>
                          {safeVideoUrl(video.videoUrl) && (
                            <a
                              href={safeVideoUrl(video.videoUrl)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Xem trên TikTok <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                      <dl className="video-metrics">
                        <div>
                          <dt>Lượt xem</dt>
                          <dd>{formatNumber(video.viewCount)}</dd>
                        </div>
                        <div>
                          <dt>Tương tác</dt>
                          <dd>
                            {Number(video.engagementRate || 0).toLocaleString(
                              "vi-VN",
                              { maximumFractionDigits: 2 },
                            )}
                            %
                          </dd>
                        </div>
                      </dl>
                      <button
                        className="button secondary"
                        disabled={generating}
                        onClick={() => selectReference(video)}
                      >
                        {draft.references.some((v) => v.id === video.id) ? (
                          <Check size={16} />
                        ) : (
                          <Plus size={16} />
                        )}
                        {draft.references.some((v) => v.id === video.id)
                          ? "Đã chọn"
                          : "Tham khảo"}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
            {!channel && !channelLoading && (
              <EmptyState title="Bắt đầu từ một kênh bạn quan tâm">
                Tìm cách mở đầu, nhịp kể chuyện và chủ đề được quan tâm. Chọn
                video tham khảo để đưa vào brief của bạn.
              </EmptyState>
            )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <section className="library-workspace" aria-label="Kho kịch bản">
            <div className="library-toolbar">
              <div
                className="filter-tabs"
                role="group"
                aria-label="Lọc trạng thái"
              >
                {[
                  ["DRAFT", "Bản nháp"],
                  ["FAVORITE", "Yêu thích"],
                  ["ARCHIVED", "Lưu trữ"],
                  ["ALL", "Tất cả"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    className={
                      filter === value
                        ? "filter-button selected"
                        : "filter-button"
                    }
                    onClick={() => {
                      setFilter(value);
                      setPage(1);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="library-search">
                <label className="input-with-icon">
                  <Search size={17} />
                  <input
                    aria-label="Tìm kịch bản"
                    placeholder="Tìm chủ đề hoặc người xem…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                <button
                  className="icon-button"
                  aria-label="Làm mới kho kịch bản"
                  disabled={scriptsLoading || generating || pending !== null}
                  onClick={reloadScripts}
                >
                  <RefreshCw
                    size={18}
                    className={scriptsLoading ? "spin" : ""}
                  />
                </button>
              </div>
            </div>
            <p className="library-description">
              {filtered.length} kịch bản{scriptsLoading ? " · Đang tải…" : ""} ·
              Kho dùng chung của tool.
            </p>
            {scriptsError && (
              <Notice onRetry={reloadScripts}>{scriptsError}</Notice>
            )}
            {scriptsLoading && (
              <p role="status" className="loading-line">
                <LoaderCircle size={18} className="spin" /> Đang tải kho kịch
                bản…
              </p>
            )}
            {!scriptsLoading && !scriptsError && !filtered.length && (
              <EmptyState
                title={
                  query || scripts.length
                    ? "Chưa có kịch bản phù hợp"
                    : "Kịch bản đầu tiên bắt đầu từ một ý tưởng"
                }
              >
                {query || scripts.length
                  ? "Thử một từ khóa khác hoặc chọn bộ lọc Tất cả."
                  : "Tạo kịch bản trong xưởng. Mỗi kết quả sẽ được lưu tự động tại đây."}
              </EmptyState>
            )}
            <div className="script-library">
              {visibleScripts.map((item) => (
                <article className="library-item" key={item.id}>
                  <div className="meta">
                    <span>{STATUS_LABELS[item.status]}</span>
                    <span>{formatDate(item.createdAt)}</span>
                    <span>
                      {item.requestedDurationSeconds
                        ? `Mục tiêu ${formatDuration(item.requestedDurationSeconds)}`
                        : `Ước tính ${formatDuration(item.estimatedDurationSeconds)}`}
                    </span>
                  </div>
                  <button
                    className="script-title-button"
                    onClick={() => openScript(item)}
                  >
                    <h2>{item.title}</h2>
                  </button>
                  <p className="muted audience-summary">
                    {item.targetAudience}
                  </p>
                  <div className="library-item-footer">
                    <button
                      className="text-button"
                      onClick={() => openScript(item)}
                    >
                      Mở kịch bản <ArrowRight size={14} />
                    </button>
                    <div className="actions">
                      <button
                        className="icon-button"
                        aria-label={
                          item.status === "FAVORITE"
                            ? `Bỏ yêu thích ${item.title}`
                            : `Yêu thích ${item.title}`
                        }
                        aria-pressed={item.status === "FAVORITE"}
                        disabled={pending !== null}
                        onClick={() =>
                          changeStatus(
                            item,
                            item.status === "FAVORITE" ? "DRAFT" : "FAVORITE",
                          )
                        }
                      >
                        <Bookmark
                          size={17}
                          fill={
                            item.status === "FAVORITE" ? "currentColor" : "none"
                          }
                        />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={
                          item.status === "ARCHIVED"
                            ? `Khôi phục ${item.title}`
                            : `Lưu trữ ${item.title}`
                        }
                        disabled={pending !== null}
                        onClick={() =>
                          changeStatus(
                            item,
                            item.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED",
                          )
                        }
                      >
                        {item.status === "ARCHIVED" ? (
                          <RefreshCw size={17} />
                        ) : (
                          <Archive size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {pages > 1 && (
              <div className="pagination">
                <button
                  className="button secondary"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={16} />
                  Trước
                </button>
                <span>
                  Trang {currentPage}/{pages}
                </span>
                <button
                  className="button secondary"
                  disabled={currentPage === pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Sau
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}
        <footer className="app-footer">
          <span>© 2026 TonyDuongg · <a href="https://github.com/TonyDuongg/tiktok-content-intelligence/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a></span>
          <nav aria-label="Liên kết dự án" className="footer-links">
            <a href="https://github.com/TonyDuongg/tiktok-content-intelligence" target="_blank" rel="noreferrer">Mã nguồn</a>
            <a href="https://github.com/TonyDuongg/tiktok-content-intelligence/releases/latest" target="_blank" rel="noreferrer">Tải cho Windows</a>
          </nav>
        </footer>
      </main>
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <Check size={18} />
            <span>{toast}</span>
            <button
              className="icon-button"
              onClick={() => setToast("")}
              aria-label="Đóng thông báo"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
