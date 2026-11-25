import {
  ArrowRight,
  Bookmark,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Info,
  LoaderCircle,
  TrendingUp,
} from "lucide-react";
import {
  formatDate,
  formatDuration,
  safeVideoUrl,
  STATUS_LABELS,
} from "./studio";

function ScriptProse({ text }) {
  return (text || "")
    .replace(/\s+(?=(?:Tip|Step|Method|Cách|Bước|Mẹo)\s+\d+\s*:)/gu, "\n\n")
    .replace(/\n(?=\s*\[\d)/gu, "\n\n")
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph, index) => {
      const timing = paragraph.match(/^\s*\[([^\]]+)\]\s*/u);
      return timing ? (
        <div className="script-beat" key={index}>
          <p className="scene-time">{timing[1]}</p>
          <p>{paragraph.slice(timing[0].length)}</p>
        </div>
      ) : (
        <p key={index}>{paragraph}</p>
      );
    });
}

export function Notice({ children, onRetry, warning = false }) {
  return (
    <div
      className={`notice ${warning ? "notice-warning" : "notice-error"}`}
      role={warning ? "status" : "alert"}
    >
      <Info size={18} aria-hidden="true" />
      <div>{children}</div>
      {onRetry && (
        <button className="text-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <FileText size={32} strokeWidth={1.4} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

export function ScriptPreview({
  script,
  loading,
  pending,
  onStatus,
  onCopy,
  onDownload,
  onResearch,
  previewRef,
}) {
  if (!script)
    return (
      <section
        className="preview panel"
        aria-label="Script result"
        aria-busy={loading}
      >
        <div className="panel-heading">
          <h2>Script</h2>
        </div>
        {loading ? (
          <div className="empty-state" role="status">
            <LoaderCircle className="spin" size={30} />
            <h2>Writing your script…</h2>
            <p>
              You can browse the library while you wait. The result is saved automatically when complete.
            </p>
          </div>
        ) : (
          <>
            <EmptyState title="Your script will appear here">
              Complete the brief and select Generate script for dialogue, filming notes and hashtags.
            </EmptyState>
            <button className="research-link" onClick={onResearch}>
              <TrendingUp size={18} />
              <span>Find reference videos</span>
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </section>
    );
  const structure = script.scriptStructure || {};
  const isSample = /mock|template/i.test(script.aiModelUsed || "");
  return (
    <article
      className="preview panel"
      aria-label="Script result"
      aria-busy={loading}
      ref={previewRef}
      tabIndex={-1}
    >
      {loading && (
        <p className="loading-line" role="status">
          <LoaderCircle size={16} className="spin" /> Generating a new version. Your previous script is below.
        </p>
      )}
      <div className="script-heading">
        <div className="meta">
          <span>
            <Clock size={14} />{" "}
            {script.requestedDurationSeconds
              ? `Target ${formatDuration(script.requestedDurationSeconds)}`
              : `Estimated ${formatDuration(script.estimatedDurationSeconds)}`}
          </span>
          <span>{STATUS_LABELS[script.status]}</span>
          <span title={script.aiModelUsed}>
            {script.aiModelUsed?.startsWith("google-")
              ? "Gemini"
              : script.aiModelUsed || "Unknown source"}
          </span>
        </div>
        <h2>{script.title}</h2>
        <p className="muted">
          For {script.targetAudience || "TikTok viewers"}
        </p>
        <div className="actions">
          <button className="button secondary" onClick={() => onCopy(script)}>
            <Copy size={16} /> Copy
          </button>
          <button
            className="button secondary"
            onClick={() => onDownload(script)}
          >
            <Download size={16} /> Download .txt
          </button>
          <button
            className={`button secondary ${script.status === "FAVORITE" ? "is-favorite" : ""}`}
            disabled={pending !== null}
            aria-pressed={script.status === "FAVORITE"}
            onClick={() =>
              onStatus(
                script,
                script.status === "FAVORITE" ? "DRAFT" : "FAVORITE",
              )
            }
          >
            <Bookmark size={16} />
            {script.status === "FAVORITE" ? "Favorited" : "Favorite"}
          </button>
        </div>
      </div>
      <div className="preview-content" tabIndex={0} role="region" aria-label="Script content">
      {script.requestedDurationSeconds && (
        <p className="duration-note">
          AI estimates {formatDuration(script.estimatedDurationSeconds)}. Read it aloud to adjust pacing and transitions.
        </p>
      )}
      {isSample && (
        <Notice warning>
          This older sample was not generated by a live AI model. Replace it with a new script before use.
        </Notice>
      )}
      <section className="script-part hook">
        <div className="part-title">
          <h3>Hook</h3>
          <span>0–3 sec</span>
        </div>
        <p>{structure.hook3s}</p>
      </section>
      <section className="script-part">
        <h3>Main content</h3>
        <ScriptProse text={structure.bodyContent} />
      </section>
      <details className="script-part shooting-notes">
        <summary>Filming & sound notes</summary>
        <ScriptProse
          text={script.visualAndSoundCues || "No filming notes available."}
        />
      </details>
      <section className="script-part">
        <h3>Call to action</h3>
        <p>{structure.callToAction}</p>
      </section>
      {script.suggestedHashtags?.length > 0 && (
        <div className="hashtags">
          {script.suggestedHashtags.map((tag, i) => (
            <span key={i}>{tag}</span>
          ))}
        </div>
      )}
      {script.referenceVideos?.length > 0 && (
        <section className="script-part">
          <h3>Reference videos</h3>
          <ul className="reference-links">
            {script.referenceVideos.map((video, i) => (
              <li key={video.videoId}>
                {safeVideoUrl(video.videoUrl) ? (
                  <a
                    href={safeVideoUrl(video.videoUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Video {i + 1}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  `Video ${i + 1}`
                )}
                <span className="muted">{video.insightNote}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="footnote">
        Automatically saved to the library · {formatDate(script.createdAt)}. Check the facts and edit the dialogue before filming.
      </p>
      </div>
    </article>
  );
}
