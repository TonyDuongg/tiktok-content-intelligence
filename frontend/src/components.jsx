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
    .replace(/\s+(?=(?:Cách|Bước|Mẹo)\s+\d+\s*:)/gu, "\n\n")
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
          Thử lại
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
        aria-label="Kết quả kịch bản"
        aria-busy={loading}
      >
        <div className="panel-heading">
          <h2>Kịch bản</h2>
        </div>
        {loading ? (
          <div className="empty-state" role="status">
            <LoaderCircle className="spin" size={30} />
            <h2>Đang viết kịch bản của bạn…</h2>
            <p>
              Bạn có thể chuyển sang kho kịch bản trong lúc chờ. Kết quả sẽ được
              lưu tự động khi hoàn tất.
            </p>
          </div>
        ) : (
          <>
            <EmptyState title="Kịch bản sẽ xuất hiện ở đây">
              Điền thông tin video và chọn Tạo kịch bản. Kết quả gồm lời thoại,
              gợi ý quay và hashtag.
            </EmptyState>
            <button className="research-link" onClick={onResearch}>
              <TrendingUp size={18} />
              <span>Tìm video tham khảo</span>
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
      aria-label="Kết quả kịch bản"
      aria-busy={loading}
      ref={previewRef}
      tabIndex={-1}
    >
      {loading && (
        <p className="loading-line" role="status">
          <LoaderCircle size={16} className="spin" /> Đang tạo bản mới. Bản
          trước vẫn ở bên dưới.
        </p>
      )}
      <div className="script-heading">
        <div className="meta">
          <span>
            <Clock size={14} />{" "}
            {script.requestedDurationSeconds
              ? `Mục tiêu ${formatDuration(script.requestedDurationSeconds)}`
              : `Ước tính ${formatDuration(script.estimatedDurationSeconds)}`}
          </span>
          <span>{STATUS_LABELS[script.status]}</span>
          <span title={script.aiModelUsed}>
            {script.aiModelUsed?.startsWith("google-")
              ? "Gemini"
              : script.aiModelUsed || "Chưa xác định nguồn"}
          </span>
        </div>
        <h2>{script.title}</h2>
        <p className="muted">
          Dành cho {script.targetAudience || "người xem TikTok"}
        </p>
        <div className="actions">
          <button className="button secondary" onClick={() => onCopy(script)}>
            <Copy size={16} /> Sao chép
          </button>
          <button
            className="button secondary"
            onClick={() => onDownload(script)}
          >
            <Download size={16} /> Tải .txt
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
            {script.status === "FAVORITE" ? "Đã yêu thích" : "Yêu thích"}
          </button>
        </div>
      </div>
      <div className="preview-content" tabIndex={0} role="region" aria-label="Nội dung kịch bản">
      {script.requestedDurationSeconds && (
        <p className="duration-note">
          AI ước tính {formatDuration(script.estimatedDurationSeconds)}. Đọc thử
          để điều chỉnh nhịp nói và thời gian chuyển cảnh.
        </p>
      )}
      {isSample && (
        <Notice warning>
          Đây là khung minh họa từ chế độ mẫu. Hãy bổ sung nội dung thực tế; kết
          quả này chưa được tạo bởi mô hình AI trực tuyến.
        </Notice>
      )}
      <section className="script-part hook">
        <div className="part-title">
          <h3>Mở đầu</h3>
          <span>0–3 giây</span>
        </div>
        <p>{structure.hook3s}</p>
      </section>
      <section className="script-part">
        <h3>Nội dung chính</h3>
        <ScriptProse text={structure.bodyContent} />
      </section>
      <details className="script-part shooting-notes">
        <summary>Hướng dẫn quay & âm thanh</summary>
        <ScriptProse
          text={script.visualAndSoundCues || "Chưa có hướng dẫn quay."}
        />
      </details>
      <section className="script-part">
        <h3>Kêu gọi hành động</h3>
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
          <h3>Video tham khảo</h3>
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
        Kịch bản đã tự động lưu vào kho · {formatDate(script.createdAt)}. Kiểm
        tra thông tin và điều chỉnh lời thoại trước khi quay.
      </p>
      </div>
    </article>
  );
}
