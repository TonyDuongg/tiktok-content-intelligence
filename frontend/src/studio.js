export const DRAFT_KEY = "creator-studio-draft-v2-live";
export const EMPTY_DRAFT = {
  categoryId: "",
  topic: "",
  targetAudience: "",
  tone: "Authentic and relatable",
  durationValue: "60",
  durationUnit: "seconds",
  customDuration: false,
  references: [],
};

export function durationToSeconds(value, unit = "seconds") {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (!["seconds", "minutes"].includes(unit) || String(value).trim() === "")
    return null;
  const seconds = Number(value) * (unit === "minutes" ? 60 : 1);
  const rounded = Math.round(seconds);
  return Number.isFinite(seconds) &&
    Math.abs(seconds - rounded) < 0.000001 &&
    rounded >= 15 &&
    rounded <= 600
    ? rounded
    : null;
}

export function formatDuration(seconds) {
  if (!Number.isInteger(seconds) || seconds <= 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return [minutes ? `${minutes} min` : "", rest ? `${rest} sec` : ""]
    .filter(Boolean)
    .join(" ");
}
export const STATUS_LABELS = {
  DRAFT: "Draft",
  FAVORITE: "Favorite",
  ARCHIVED: "Archived",
};

export function categoryKind(category) {
  const slug = category?.slug || "";
  return [
    ["beauty", /beauty|lam-dep|skincare/],
    ["fashion", /fashion|thoi-trang/],
    ["food", /food|an-uong/],
    ["tech", /tech|cong-nghe/],
    ["lifestyle", /lifestyle|doi-song/],
  ].find(([, pattern]) => pattern.test(slug))?.[0];
}

export function categoryLabel(category) {
  return (
    {
      beauty: "Beauty & skincare",
      fashion: "Fashion & styling",
      food: "Food & cooking",
      tech: "Technology & gadgets",
      lifestyle: "Lifestyle & storytelling",
    }[categoryKind(category)] || category.name
  );
}

const LEGACY_TONES = {
  "Chân thực, gần gũi": "Authentic and relatable",
  "Hài hước, dí dỏm": "Humorous and witty",
  "Chuyên gia, rõ ràng": "Expert and clear",
  "Tâm sự, kể chuyện": "Personal storytelling",
};

export function readDraft() {
  try {
    const liveDraft = localStorage.getItem(DRAFT_KEY);
    const data = JSON.parse(
      liveDraft || localStorage.getItem("creator-studio-draft-v1"),
    );
    if (!liveDraft && data) {
      data.references = [];
      data.categoryId = "";
    }
    if (!data || typeof data !== "object") return EMPTY_DRAFT;
    return {
      categoryId:
        typeof data.categoryId === "number" ||
        typeof data.categoryId === "string"
          ? data.categoryId
          : "",
      topic: typeof data.topic === "string" ? data.topic.slice(0, 1000) : "",
      targetAudience:
        typeof data.targetAudience === "string"
          ? data.targetAudience.slice(0, 300)
          : "",
      tone:
        typeof data.tone === "string"
          ? (LEGACY_TONES[data.tone] || data.tone).slice(0, 100)
          : EMPTY_DRAFT.tone,
      ...(durationToSeconds(data.durationValue, data.durationUnit) !== null
        ? {
            durationValue: String(data.durationValue),
            durationUnit: data.durationUnit,
            customDuration:
              data.customDuration === true ||
              ![15, 30, 60, 120, 180].includes(
                durationToSeconds(data.durationValue, data.durationUnit),
              ),
          }
        : {
            durationValue: "60",
            durationUnit: "seconds",
            customDuration: false,
          }),
      references: Array.isArray(data.references)
        ? data.references
            .filter((v) => v && Number.isInteger(v.id) && v.id > 0)
            .filter(
              (v, i, refs) => refs.findIndex((item) => item.id === v.id) === i,
            )
            .slice(0, 5)
            .map((v) => ({
              id: v.id,
              caption:
                typeof v.caption === "string" ? v.caption.slice(0, 1000) : "",
              username:
                typeof v.username === "string"
                  ? v.username.slice(0, 24)
                  : "selected channel",
            }))
        : [],
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function normalizeUsername(input) {
  let value = input.trim();
  if (/^(https?:\/\/|www\.)/i.test(value)) {
    try {
      const url = new URL(
        value.startsWith("www.") ? `https://${value}` : value,
      );
      if (
        !["www.tiktok.com", "tiktok.com", "m.tiktok.com"].includes(
          url.hostname.toLowerCase(),
        )
      )
        return null;
      const match = url.pathname.match(/^\/@([^/]+)\/?$/);
      if (!match) return null;
      value = match[1];
    } catch {
      return null;
    }
  }
  value = value.replace(/^@/, "").toLowerCase();
  return /^[a-z0-9._]{2,24}$/.test(value) ? value : null;
}

export function scriptText(script) {
  const structure = script.scriptStructure || {};
  return `${script.title || "Video script"}\nAudience: ${script.targetAudience || "Unspecified"}\n${script.requestedDurationSeconds ? `Target duration: ${formatDuration(script.requestedDurationSeconds)}\n` : ""}Duration: ${script.estimatedDurationSeconds ?? "—"} sec (AI estimate)\nSource: ${script.aiModelUsed || "Unspecified"}\n\nHOOK · 3 SECONDS\n${structure.hook3s || ""}\n\nMAIN CONTENT\n${structure.bodyContent || ""}\n\nFILMING NOTES\n${script.visualAndSoundCues || ""}\n\nCALL TO ACTION\n${structure.callToAction || ""}\n\nHASHTAG\n${(script.suggestedHashtags || []).join(" ")}\n`;
}

export function filterScripts(scripts, query, status) {
  const needle = query.trim().toLocaleLowerCase("vi");
  return scripts.filter(
    (script) =>
      (status === "ALL" || script.status === status) &&
      `${script.title || ""} ${script.targetAudience || ""}`
        .toLocaleLowerCase("vi")
        .includes(needle),
  );
}
export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
export const formatDate = (value) =>
  value && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date(value))
    : "Undated";
export const safeVideoUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "tiktok.com" || url.hostname.endsWith(".tiktok.com"))
      ? url.href
      : null;
  } catch {
    return null;
  }
};
