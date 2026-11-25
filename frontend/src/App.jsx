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
import ChannelInsights from "./ChannelInsights";

const TONES = [
  "Authentic and relatable",
  "Humorous and witty",
  "Expert and clear",
  "Personal storytelling",
];
const SHORT_TONES = ["Authentic", "Humorous", "Expert", "Storytelling"];
const SHORT_CATEGORIES = { beauty: "Beauty", fashion: "Fashion", food: "Food", tech: "Technology", lifestyle: "Lifestyle" };
const IDEAS = [
  ["beauty", "3 things to check when choosing sunscreen"],
  ["fashion", "Style one shirt for 3 work outfits"],
  ["food", "An easy lunch for a busy day"],
  ["tech", "3 ways to organize your phone screen"],
  ["lifestyle", "What I learned in my first month at work"],
];
const TABS = [
  { id: "studio", label: "Script studio", icon: FileText },
  { id: "channel", label: "Channel research", icon: TrendingUp },
  { id: "history", label: "Script library", icon: Bookmark },
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
  const [savedChannels, setSavedChannels] = useState([]);
  const [savedChannelsError, setSavedChannelsError] = useState("");
  const [researchView, setResearchView] = useState("videos");
  const [researchSearchOpen, setResearchSearchOpen] = useState(true);
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

  const loadSavedChannels = useCallback(async (signal) => {
    try {
      const result = await api.getSavedChannels({ signal });
      if (!signal?.aborted) { setSavedChannels(result.data || []); setSavedChannelsError(""); }
    } catch (error) { if (!signal?.aborted) setSavedChannelsError(error.message); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => { void loadSavedChannels(controller.signal); }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [loadSavedChannels]);

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
          "No categories are available. Check the server's category data.",
      );
    if (results[1].status === "fulfilled") {
      setWorkspace(results[1].value.data);
      setWorkspaceError("");
    } else {
      setWorkspace(null);
      setWorkspaceError(
        "Unable to verify the data source. Reconnect before using the research results.",
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
        "Choose a duration from 15 seconds to 10 minutes, in whole seconds.",
      );
      return;
    }
    if (!draft.topic.trim()) {
      setGenerateError("Enter a video topic before generating a script.");
      return;
    }
    if (!draft.categoryId || setupError) {
      setGenerateError("Load the categories and try again.");
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
          draft.targetAudience.trim() || "TikTok viewers",
        tone: draft.tone,
        referenceVideoIds: draft.references.map((v) => v.id),
        requestedDurationSeconds,
      });
      setScript(result.data);
      upsertScript(result.data);
      notify("Script generated and saved to the library.");
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
          ? "Added to favorites."
          : status === "ARCHIVED"
            ? "Script archived."
            : "Moved to drafts.",
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
      notify("Script copied.");
    } catch {
      setActionError(
        "Clipboard access is unavailable. Download the .txt file to save the script.",
      );
    }
  }
  function download(item) {
    const url = URL.createObjectURL(
      new Blob([scriptText(item)], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `script-${item.id}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Script exported as .txt.");
  }

  async function searchChannel(event) {
    event.preventDefault();
    if (channelLock.current) return;
    const clean = normalizeUsername(username);
    if (!clean) {
      setChannelError(
        "Enter a @username (2–24 characters) or a profile URL such as https://tiktok.com/@creator.",
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
      setResearchSearchOpen(false);
      setSavedChannels(previous => [result.data, ...previous.filter(c => c.id !== result.data.id)]);
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
  async function openSavedChannel(name) {
    if (!name || channelLock.current) return;
    channelLock.current = true; setChannelLoading(true); setChannelError(""); setVideoError("");
    setChannel(null); setVideos([]);
    try {
      const [profileResult, videoResult] = await Promise.allSettled([api.getChannel(name), api.getTopVideos(name, maxVideos)]);
      if (profileResult.status === "rejected") throw profileResult.reason;
      setChannel(profileResult.value.data); setUsername(name);
      setResearchSearchOpen(false);
      if (profileResult.value.data.category?.id) setChannelCategory(profileResult.value.data.category.id);
      if (videoResult.status === "fulfilled") setVideos(videoResult.value.data || []);
      else setVideoError(videoResult.reason.message);
    } catch (error) { setChannelError(error.message); }
    finally { channelLock.current = false; setChannelLoading(false); }
  }

  function useExperiment(idea, report) {
    if (!channel || channel.tiktokUsername !== report.username || generating || channelLoading) return;
    const target = [report.targetAudience, report.offering && `Offering: ${report.offering}`].filter(Boolean).join(". ").slice(0, 300);
    setDraft(previous => ({ ...previous, categoryId: channel.category?.id || channelCategory || previous.categoryId,
      topic: `${idea.topic}${report.offering ? `. Connect to ${report.offering}` : ""}${report.goal ? `. Goal: ${report.goal}` : ""}`.slice(0, 1000),
      targetAudience: target, durationValue: String(idea.durationSeconds), durationUnit: "seconds",
      customDuration: ![15, 30, 60, 120, 180].includes(idea.durationSeconds),
      references: [{ id: idea.reference.videoId, caption: idea.reference.caption, username: report.username }],
    }));
    setDesktopPane("brief"); navigate("studio");
    notify("Idea, target profile and reference video added to the brief.");
  }
  function openOwnChannel(name) {
    setResearchView("insights");
    if (savedChannels.some(c => c.tiktokUsername === name)) { void openSavedChannel(name); return; }
    setUsername(name); setChannel(null); setVideos([]); setResearchSearchOpen(true);
    notify("Your channel is ready. Select Analyze channel to fetch public data.");
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
        "You have selected 5 videos. Remove a reference in the script studio before adding another.",
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
    notify("Reference added. You can edit the topic before generating.");
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
        Skip to main content
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
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={22} />
          </button>
          <nav
            aria-label="Main navigation"
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
            <button className="button subtle desktop-settings" aria-label="Settings" disabled={generating || channelLoading}
              onClick={() => window.creatorDesktop.openSettings().catch(() => notify("Unable to open settings. Try again."))}>
              <Settings size={18} /> <span className="desktop-settings-label">Settings</span>
            </button>
          ) : <div className="workspace-label">
            <span
              className={`connection-dot ${setupError ? "offline" : setupLoading ? "connecting" : ""}`}
            />
            {setupError
              ? "Disconnected"
              : setupLoading
                ? "Connecting"
                : "Live data"}
          </div>}
        </div>
      </header>
      <main id="main" className="main-container">
        <div className="page-heading">
          <div>
            <h1>
              {activeTab === "studio"
                ? "Write a script"
                : activeTab === "channel"
                  ? "TikTok channel research"
                  : "Script library"}
            </h1>
            <p>
              {activeTab === "studio"
                ? "Turn your topic into a script ready to edit."
                : activeTab === "channel"
                  ? "Find standout videos and references for your script."
                  : "Find saved scripts and prepare for your next shoot."}
            </p>
          </div>
          {activeTab === "studio" && window.creatorDesktop && (
            <div className="pane-switch" role="group" aria-label="Choose workspace pane">
              <button type="button" aria-pressed={desktopPane === "brief"} onClick={() => setDesktopPane("brief")}>Brief</button>
              <button type="button" aria-pressed={desktopPane === "preview"} onClick={() => setDesktopPane("preview")}>Script</button>
            </div>
          )}
          {activeTab === "history" && (
            <button
              className="button primary"
              onClick={() => navigate("studio")}
            >
              <Plus size={18} />
              Generate script
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
          <Notice warning>Open Settings to add API keys for {[
            !workspace.aiConfigured && "Gemini",
            !workspace.scraperConfigured && "RapidAPI",
          ].filter(Boolean).join(" and ") || "unconfigured services"}.</Notice>
        ) : workspace?.issues?.map((issue) => (
          <Notice key={issue}>{issue}</Notice>
        ))}
        {actionError && <Notice>{actionError}</Notice>}
        </div>
        {activeTab === "studio" && (
          <div className={`studio-layout show-${desktopPane}`}>
            <section
              className="panel brief-panel"
              aria-label="Script brief"
            >
              <div className="panel-heading">
                <h2>Video brief</h2>
                <span className="muted">
                  {storageError ? "Brief not saved" : "Autosaved brief"}
                </span>
              </div>
              {storageError && (
                <Notice warning>
                  Unable to save the brief in this browser. Copy your idea before closing the page.
                </Notice>
              )}
              <form onSubmit={generate}>
                <fieldset disabled={generating} className="brief-fields">
                  <div className="field field-category">
                    <label htmlFor="category">Category</label>
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
                            ? "Loading categories…"
                            : "Categories unavailable"}
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
                        Video topic <span className="required">*</span>
                      </label>
                      <span className="muted">{draft.topic.length}/1000</span>
                    </div>
                    <textarea
                      id="topic"
                      required
                      maxLength={1000}
                      rows={4}
                      placeholder="Describe a specific problem and what viewers should take away…"
                      value={draft.topic}
                      onChange={(e) => {
                        updateDraft("topic", e.target.value);
                        setGenerateError("");
                      }}
                    />
                    <button
                      type="button"
                      className="idea-button"
                      aria-label={`Use idea: ${idea}`}
                      title={idea}
                      onClick={() => updateDraft("topic", idea)}
                    >
                      <Plus size={14} />
                      <span className="idea-copy">Use idea: {idea}</span>
                      <span className="idea-short" aria-hidden="true">Use idea</span>
                    </button>
                  </div>
                  <div className="field field-audience">
                    <label htmlFor="audience">Target audience</label>
                    <input
                      id="audience"
                      maxLength={300}
                      placeholder={window.creatorDesktop ? "Example: students" : "Example: students starting a skincare routine"}
                      value={draft.targetAudience}
                      onChange={(e) =>
                        updateDraft("targetAudience", e.target.value)
                      }
                    />
                  </div>
                  <div className="field field-tone">
                    <label htmlFor="tone">Tone</label>
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
                    <label htmlFor="duration-preset">Video duration</label>
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
                      <option value="custom">Custom…</option>
                    </select>
                    {draft.customDuration && (
                      <div className="duration-custom">
                        <div>
                          <label htmlFor="duration-value">Duration</label>
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
                          <label htmlFor="duration-unit">Unit</label>
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
                            <option value="seconds">Seconds</option>
                            <option value="minutes">Minutes</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <p id="duration-hint" className="field-hint">
                      {draft.customDuration ? "15 seconds to 10 minutes. " : ""}AI
                      adapts the dialogue and scene timing to your duration.
                    </p>
                  </div>
                  <details
                    className="references-field"
                    open={draft.references.length > 0 || undefined}
                  >
                    <summary>
                      Reference videos{" "}
                      <span className="muted">
                        {draft.references.length}/5 · optional
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
                              aria-label={`Remove reference video ${v.id}`}
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
                        Optional. Add videos as structural references for AI.
                      </p>
                    )}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => navigate("channel")}
                    >
                      Choose from channel research <ArrowRight size={14} />
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
                      Generating script…
                    </>
                  ) : (
                    <>
                      Generate script
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <p className="form-note" role="status">
                  {generating
                    ? "Waiting for AI. This may take up to 2 minutes."
                    : "Automatically saved to the workspace library"}
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
            {researchView !== "profiles" && <section className="panel search-panel">
              {(researchSearchOpen || !channel) && <div className="research-search-heading"><h2>{channel ? `Channel @${channel.tiktokUsername}` : "Analyze a TikTok channel"}</h2>
                {channel && <button type="button" className="button subtle" disabled={channelLoading} onClick={() => setResearchSearchOpen(open => !open)}>{researchSearchOpen ? "Collapse" : "Change / refresh"}</button>}
              </div>}
              {(researchSearchOpen || !channel) && <>
              <form onSubmit={searchChannel}>
                <div className="channel-fields">
                  <div className="field username-field">
                    <label htmlFor="username">
                      Username or profile URL
                    </label>
                    <div className="input-with-icon">
                      <Search size={18} />
                      <input
                        id="username"
                        placeholder="@creator or https://tiktok.com/@creator"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={channelLoading}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="channel-category">Channel category</label>
                    <select
                      id="channel-category"
                      value={channelCategory}
                      onChange={(e) => setChannelCategory(e.target.value)}
                      disabled={channelLoading || setupLoading}
                    >
                      {!categories.length && (
                        <option value="">Categories not loaded</option>
                      )}
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field sample-limit">
                    <label htmlFor="max-videos">Video count</label>
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
                    {channelLoading ? "Analyzing…" : "Analyze channel"}
                  </button>
                </div>
              </form>
              <p className="hint">
                Enter a username or a full profile URL. Results depend on the configured data provider.
              </p>
              </>}
              <div className="saved-channel-picker">
                <label htmlFor="saved-channel">Open saved channel</label>
                <select id="saved-channel" value={channel?.tiktokUsername || ""} disabled={channelLoading || !savedChannels.length} onChange={e => openSavedChannel(e.target.value)}>
                  <option value="">{savedChannels.length ? "Choose a channel without a new API request" : "No saved channels"}</option>
                  {savedChannels.map(c => <option key={c.id} value={c.tiktokUsername}>@{c.tiktokUsername} · {c.nickname || c.tiktokUsername}</option>)}
                </select>
                <button type="button" className="button subtle" disabled={channelLoading} onClick={() => loadSavedChannels()} aria-label="Refresh saved channels"><RefreshCw size={16} /></button>
                {channel && !researchSearchOpen && <button type="button" className="button secondary" disabled={channelLoading} onClick={() => setResearchSearchOpen(true)}>Change / refresh</button>}
              </div>
            </section>}
            <div className="research-tabs" role="group" aria-label="Research sections">
              {[["videos", "Reference videos"], ["insights", "Audience & trends"], ["profiles", "My profiles"]].map(([id, label]) => <button key={id} type="button" aria-pressed={researchView === id} onClick={() => setResearchView(id)}>{label}</button>)}
            </div>
            <div className="channel-results">
            {savedChannelsError && <Notice onRetry={() => loadSavedChannels()}>{savedChannelsError}</Notice>}
            {channelError && <Notice>{channelError}</Notice>}
            {channelLoading && (
              <p role="status" className="loading-line">
                <LoaderCircle size={18} className="spin" /> Fetching the channel profile and videos…
              </p>
            )}
            {researchView !== "videos" && <ChannelInsights channel={channel} view={researchView} onUseExperiment={useExperiment} onOpenOwnChannel={openOwnChannel} disabled={generating || channelLoading} />}
            {researchView === "videos" && channel && (
              <>
                <section className="channel-summary">
                  <div>
                    <h2>{channel.nickname || `@${channel.tiktokUsername}`}</h2>
                    <p className="muted">
                      @{channel.tiktokUsername} · Updated{" "}
                      {formatDate(channel.lastScrapedAt)}
                    </p>
                    {channel.bio && (
                      <p className="channel-bio">{channel.bio}</p>
                    )}
                  </div>
                  <dl className="channel-stats">
                    <div>
                      <dt>Followers</dt>
                      <dd>{formatNumber(channel.followersCount)}</dd>
                    </div>
                    <div>
                      <dt>Total likes</dt>
                      <dd>{formatNumber(channel.totalLikes)}</dd>
                    </div>
                    <div>
                      <dt>Channel videos</dt>
                      <dd>{formatNumber(channel.totalVideos)}</dd>
                    </div>
                  </dl>
                </section>
                <div className="section-toolbar">
                  <div>
                    <h2>
                      Top videos{" "}
                      <span className="muted">({videos.length})</span>
                    </h2>
                    <p className="hint">
                      ER = (likes + comments + shares) / views × 100%. Ranked within the fetched sample.
                    </p>
                  </div>
                  <label className="sort-label">
                    Sort by
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="engagementRate">Highest engagement</option>
                      <option value="viewCount">Most views</option>
                    </select>
                  </label>
                </div>
                {videoError && (
                  <Notice onRetry={retryVideos}>{videoError}</Notice>
                )}
                {!videos.length && !channelLoading && !videoError && (
                  <EmptyState title="No videos found">
                    Try another channel or analyze again later.
                  </EmptyState>
                )}
                <div className="video-list">
                  {sortedVideos.map((video, i) => (
                    <article className="video-row" key={video.id}>
                      <span className="video-rank">{i + 1}</span>
                      <div className="video-description">
                        <h3>{video.caption || "Untitled video"}</h3>
                        <div className="meta">
                          <span>{video.durationSeconds ?? "—"} sec</span>
                          <span>{formatDate(video.videoPublishedAt)}</span>
                          {safeVideoUrl(video.videoUrl) && (
                            <a
                              href={safeVideoUrl(video.videoUrl)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View on TikTok <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                      <dl className="video-metrics">
                        <div>
                          <dt>Views</dt>
                          <dd>{formatNumber(video.viewCount)}</dd>
                        </div>
                        <div>
                          <dt>Engagement</dt>
                          <dd>
                            {Number(video.engagementRate || 0).toLocaleString(
                              "en-US",
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
                          ? "Selected"
                          : "Use reference"}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
            {researchView === "videos" && !channel && !channelLoading && (
              <EmptyState title="Start with a channel you want to explore">
                Explore hooks, pacing and topics. Select reference videos to add to your brief.
              </EmptyState>
            )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <section className="library-workspace" aria-label="Script library">
            <div className="library-toolbar">
              <div
                className="filter-tabs"
                role="group"
                aria-label="Filter by status"
              >
                {[
                  ["DRAFT", "Drafts"],
                  ["FAVORITE", "Favorites"],
                  ["ARCHIVED", "Archive"],
                  ["ALL", "All"],
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
                    aria-label="Search scripts"
                    placeholder="Search topics or audiences…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                <button
                  className="icon-button"
                  aria-label="Refresh script library"
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
              {filtered.length} scripts{scriptsLoading ? " · Loading…" : ""} ·
              Shared workspace library.
            </p>
            {scriptsError && (
              <Notice onRetry={reloadScripts}>{scriptsError}</Notice>
            )}
            {scriptsLoading && (
              <p role="status" className="loading-line">
                <LoaderCircle size={18} className="spin" /> Loading script library…
              </p>
            )}
            {!scriptsLoading && !scriptsError && !filtered.length && (
              <EmptyState
                title={
                  query || scripts.length
                    ? "No matching scripts"
                    : "Your first script starts with an idea"
                }
              >
                {query || scripts.length
                  ? "Try another keyword or select All."
                  : "Generate a script in the studio. Each result is saved here automatically."}
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
                        ? `Target ${formatDuration(item.requestedDurationSeconds)}`
                        : `Estimated ${formatDuration(item.estimatedDurationSeconds)}`}
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
                      Open script <ArrowRight size={14} />
                    </button>
                    <div className="actions">
                      <button
                        className="icon-button"
                        aria-label={
                          item.status === "FAVORITE"
                            ? `Remove favorite ${item.title}`
                            : `Favorites ${item.title}`
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
                            ? `Restore ${item.title}`
                            : `Archive ${item.title}`
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
                  Previous
                </button>
                <span>
                  Page {currentPage}/{pages}
                </span>
                <button
                  className="button secondary"
                  disabled={currentPage === pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}
        <footer className="app-footer">
          <span>© 2026 TonyDuongg · <a href="https://github.com/TonyDuongg/tiktok-content-intelligence/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a></span>
          <nav aria-label="Project links" className="footer-links">
            <a href="https://github.com/TonyDuongg/tiktok-content-intelligence" target="_blank" rel="noreferrer">Source code</a>
            <a href="https://github.com/TonyDuongg/tiktok-content-intelligence/releases/latest" target="_blank" rel="noreferrer">Download for Windows</a>
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
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
