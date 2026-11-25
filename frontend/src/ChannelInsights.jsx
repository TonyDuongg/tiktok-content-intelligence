import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download, Plus, Save, Trash2 } from "lucide-react";
import { api } from "./api";
import { EmptyState, Notice } from "./components";
import { formatNumber, normalizeUsername, safeVideoUrl } from "./studio";

const blankProfile = () => ({ name: "", ownUsername: "", targetAudience: "", offering: "", goal: "", keywords: "", excludedKeywords: "", analyticsNotes: "" });
const PROFILE_KEY = "creator-studio-research-profile";
const readSelection = () => { try { return localStorage.getItem(PROFILE_KEY) || ""; } catch { return ""; } };
const researchTime = value => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "Chưa rõ thời điểm";

export default function ChannelInsights({ channel, view, onUseExperiment, onOpenOwnChannel, disabled }) {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(readSelection);
  const [draft, setDraft] = useState(blankProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const saveLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    api.getResearchProfiles({ signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      const list = result.data || [];
      const remembered = list.find(p => String(p.id) === readSelection()) || list[0];
      setProfiles(list);
      setSelected(remembered ? String(remembered.id) : "");
      setDraft(remembered || blankProfile());
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    try { if (selected) localStorage.setItem(PROFILE_KEY, selected); else localStorage.removeItem(PROFILE_KEY); } catch { /* Profiles themselves are stored on the server. */ }
  }, [selected]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setReport(null); setReportError("");
      if (view !== "insights" || !channel || !selected) { setReportLoading(false); return; }
      setReportLoading(true);
      api.getChannelInsights(channel.tiktokUsername, selected, { signal: controller.signal }).then(result => {
        if (!controller.signal.aborted) setReport(result.data);
      }).catch(err => { if (!controller.signal.aborted) setReportError(err.message); })
        .finally(() => { if (!controller.signal.aborted) setReportLoading(false); });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [channel, selected, view, revision]);

  function choose(id) {
    setSelected(id);
    setDraft(profiles.find(p => String(p.id) === id) || blankProfile());
    setMessage(""); setError(""); setConfirmDelete(false);
  }
  function change(field, value) { setDraft(p => ({ ...p, [field]: value })); setMessage(""); setConfirmDelete(false); }

  async function save(event) {
    event.preventDefault();
    if (saveLock.current) return;
    const ownUsername = draft.ownUsername.trim() ? normalizeUsername(draft.ownUsername) : "";
    if (ownUsername === null) { setError("Tên hoặc đường dẫn kênh của bạn chưa hợp lệ."); return; }
    saveLock.current = true; setSaving(true); setError(""); setMessage("");
    try {
      const { data } = await api.saveResearchProfile({ ...draft, ownUsername });
      setProfiles(previous => [data, ...previous.filter(p => p.id !== data.id)]);
      setSelected(String(data.id)); setDraft(data); setRevision(r => r + 1);
      setMessage("Đã lưu hồ sơ. Bạn có thể dùng lại khi so sánh các kênh khác.");
    } catch (err) { setError(err.message); }
    finally { saveLock.current = false; setSaving(false); }
  }

  async function remove() {
    if (saveLock.current || !draft.id) return;
    saveLock.current = true; setSaving(true); setError("");
    try {
      await api.deleteResearchProfile(draft.id);
      const remaining = profiles.filter(p => p.id !== draft.id);
      const next = remaining[0]; setProfiles(remaining); setSelected(next ? String(next.id) : "");
      setDraft(next || blankProfile()); setConfirmDelete(false); setMessage("Đã xóa hồ sơ. Các kênh và kịch bản vẫn được giữ.");
    } catch (err) { setError(err.message); }
    finally { saveLock.current = false; setSaving(false); }
  }

  return <div className="research-insights" data-view={view}>
    <div className="profile-picker">
      <div className="field">
        <label htmlFor="research-profile">Hồ sơ khách hàng mục tiêu</label>
        <select id="research-profile" value={selected} disabled={loading || saving} onChange={e => choose(e.target.value)}>
          <option value="">Tạo hồ sơ mới</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <button className="button secondary" disabled={loading || saving} onClick={() => choose("")}><Plus size={16} /> Hồ sơ mới</button>
    </div>
    {loading && <p role="status">Đang tải hồ sơ đã lưu…</p>}
    {error && <Notice>{error}</Notice>}
    {message && <p role="status" className="save-message">{message}</p>}
    {(view === "profiles" || (!selected && !loading)) && <section className="panel profile-editor" aria-labelledby="profile-heading">
      <h2 id="profile-heading">{draft.id ? "Chỉnh sửa hồ sơ" : "Lưu hồ sơ kênh và khách hàng"}</h2>
      <p className="hint">Nhập mục tiêu một lần, dùng lại để đánh giá nhiều kênh. {window.creatorDesktop ? "Hồ sơ lưu trên máy này." : "Hồ sơ lưu trong thư viện dùng chung của website."}</p>
      {draft.id && draft.ownUsername && <button type="button" className="button secondary own-channel-action" disabled={saving || disabled} onClick={() => onOpenOwnChannel(draft.ownUsername)}>Nghiên cứu @{draft.ownUsername} <ArrowRight size={16} /></button>}
      <form onSubmit={save}>
        <fieldset disabled={saving || loading} className="profile-fields">
          <div className="field"><label htmlFor="profile-name">Tên hồ sơ *</label><input id="profile-name" required maxLength={100} value={draft.name} onChange={e => change("name", e.target.value)} placeholder="Ví dụ: Chăm sóc da cho sinh viên" /></div>
          <div className="field"><label htmlFor="profile-username">Kênh TikTok của bạn</label><input id="profile-username" maxLength={200} value={draft.ownUsername} onChange={e => change("ownUsername", e.target.value)} placeholder="@tenkenh hoặc link hồ sơ" /></div>
          <div className="field profile-wide"><label htmlFor="profile-audience">Khách hàng muốn tiếp cận *</label><textarea id="profile-audience" required maxLength={300} rows={2} value={draft.targetAudience} onChange={e => change("targetAudience", e.target.value)} placeholder="Nhu cầu, hoàn cảnh và vấn đề họ muốn giải quyết" /></div>
          <div className="field"><label htmlFor="profile-offering">Sản phẩm hoặc giá trị bạn cung cấp</label><input id="profile-offering" maxLength={500} value={draft.offering} onChange={e => change("offering", e.target.value)} /></div>
          <div className="field"><label htmlFor="profile-goal">Mục tiêu của kênh</label><input id="profile-goal" maxLength={500} value={draft.goal} onChange={e => change("goal", e.target.value)} placeholder="Ví dụ: người xem lưu video, hỏi tư vấn" /></div>
          <div className="field"><label htmlFor="profile-keywords">Từ khóa về nhu cầu và chủ đề *</label><textarea id="profile-keywords" required maxLength={1000} rows={3} value={draft.keywords} onChange={e => change("keywords", e.target.value)} placeholder="Ví dụ: da dầu, kem chống nắng, skincare" aria-describedby="keyword-help" /><p className="field-hint" id="keyword-help">1–15 từ hoặc cụm từ, ngăn bằng dấu phẩy. Thêm từ đồng nghĩa và hashtag viết liền nếu cần.</p></div>
          <div className="field"><label htmlFor="profile-excluded">Chủ đề muốn tránh</label><textarea id="profile-excluded" maxLength={1000} rows={3} value={draft.excludedKeywords} onChange={e => change("excludedKeywords", e.target.value)} placeholder="Các từ khóa không phù hợp, ngăn bằng dấu phẩy" /></div>
          <div className="field profile-wide"><label htmlFor="profile-analytics">Ghi chú từ TikTok Studio của bạn</label><textarea id="profile-analytics" maxLength={2000} rows={3} value={draft.analyticsNotes} onChange={e => change("analyticsNotes", e.target.value)} placeholder="Tự ghi nguồn và thời gian đo, tệp người xem, tỷ lệ xem hết…" /><p className="field-hint">Ghi chú do bạn cung cấp, không được dùng để khẳng định tệp người xem của kênh khác.</p></div>
        </fieldset>
        <div className="profile-actions"><button className="button primary" disabled={saving || loading}><Save size={16} /> {saving ? "Đang lưu…" : "Lưu hồ sơ"}</button>
          {draft.id && !confirmDelete && <button type="button" className="button subtle" disabled={saving} onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Xóa hồ sơ</button>}
          {confirmDelete && <div className="delete-confirm"><span>Xóa hồ sơ “{draft.name}”?</span><button type="button" className="button secondary" disabled={saving} onClick={remove}>Xác nhận xóa</button><button type="button" className="button subtle" onClick={() => setConfirmDelete(false)}>Hủy</button></div>}
        </div>
      </form>
    </section>}
    {view === "insights" && selected && <>
      {!channel && <EmptyState title="Chọn kênh để đối chiếu hồ sơ">Phân tích một kênh hoặc mở kênh đã lưu ở phía trên. Hồ sơ mục tiêu của bạn đã sẵn sàng.</EmptyState>}
      {reportLoading && <p role="status">Đang đối chiếu nội dung và các mốc dữ liệu đã lưu…</p>}
      {reportError && <Notice onRetry={() => setRevision(r => r + 1)}>{reportError}</Notice>}
      {report && String(report.profileId) === selected && report.username === channel?.tiktokUsername && <Report report={report} disabled={disabled} onUseExperiment={onUseExperiment} />}
    </>}
  </div>;
}

function Report({ report, disabled, onUseExperiment }) {
  function download() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `doi-chieu-${report.username}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="panel insights-report" aria-label="Đối chiếu khách hàng và xu hướng">
    <div className="section-toolbar"><div><h2>@{report.username} với hồ sơ “{report.profileName}”</h2><p className="hint">Thu thập {researchTime(report.collectedAt)} · Mẫu {report.sampleCount} video đã lưu</p></div><button className="button secondary download-report" aria-label="Tải báo cáo" title="Tải báo cáo JSON" onClick={download}><Download size={16} /> <span>Tải báo cáo</span></button></div>
    {(report.describedCount < 10 || !report.collectedAt || Date.parse(report.analyzedAt) - Date.parse(report.collectedAt) > 7 * 86400000) && <Notice warning>{report.describedCount < 10 ? "Mẫu còn ít hơn 10 video đọc được. " : ""}{!report.collectedAt || Date.parse(report.analyzedAt) - Date.parse(report.collectedAt) > 7 * 86400000 ? "Dữ liệu kênh đã cũ hoặc chưa rõ thời điểm thu thập. " : ""}Cần bổ sung dữ liệu trước khi kết luận về kênh.</Notice>}
    <section className="insight-section"><h3>Độ liên quan với khách hàng mục tiêu</h3><p>{report.targetAudience}</p>
      <dl className="insight-facts"><div><dt>Video khớp từ khóa</dt><dd>{report.contentMatchPercent == null ? "Chưa đủ dữ liệu" : `${report.contentMatchPercent}%`} <span className="hint">({report.matchingCount}/{report.describedCount} video có nội dung đọc được)</span></dd></div><div><dt>Chủ đề muốn tránh</dt><dd>{report.excludedVideoCount} video có từ khóa cần xem lại</dd></div></dl>
      <p><strong>Tìm thấy:</strong> {report.matchedKeywords.join(", ") || "Chưa có từ khóa nào khớp."}</p>
      {!!report.unmatchedKeywords.length && <p className="muted">Chưa thấy: {report.unmatchedKeywords.join(", ")}</p>}
      <p className="hint">Đây là mức khớp nội dung, không phải phần trăm người xem thuộc tệp khách hàng của bạn.</p>
    </section>
    <section className="insight-section"><h3>Tệp quan tâm có thể liên quan</h3><p className="hint">Giả thuyết từ hashtag lặp lại trong nội dung. Cần kiểm chứng bằng TikTok Studio hoặc dữ liệu do chủ kênh chia sẻ.</p>
      {!report.topics.length ? <p>Chưa có hashtag cụ thể xuất hiện ở ít nhất hai video để gợi ý nhóm quan tâm.</p> : <ul className="topic-evidence">{report.topics.map(t => <li key={t.hashtag}><strong>Quan tâm nội dung {t.hashtag}</strong><span>{t.videoCount} video · trung vị {formatNumber(t.medianViews)} lượt xem</span><details><summary>Xem video làm căn cứ</summary><ul>{t.evidenceVideoIds.map(id => { const video = report.evidence.find(v => v.videoId === id); return video && <li key={id}>{safeVideoUrl(video.videoUrl) ? <a href={safeVideoUrl(video.videoUrl)} target="_blank" rel="noreferrer">{video.caption?.slice(0, 160) || "Mở video trên TikTok"}</a> : video.caption || "Video không có liên kết công khai hợp lệ"}</li>; })}</ul></details></li>)}</ul>}
    </section>
    <section className="insight-section"><h3>Tín hiệu tăng trưởng quan sát được</h3>
      {!report.growth.length ? <p>Chưa có hai mốc đo cùng video cách nhau ít nhất 1 giờ. Cập nhật lại kênh sau để bắt đầu so sánh lượt xem thực tế.</p> : <div className="insight-table-wrap"><table><caption>Tốc độ trung bình giữa hai lần thu thập, không phải dự báo lượt xem tương lai.</caption><thead><tr><th>Video</th><th>Lượt xem tăng</th><th>Khoảng đo</th><th>Lượt xem/giờ</th></tr></thead><tbody>{report.growth.map(g => <tr key={g.videoId}><th scope="row">{g.caption || "Video chưa có mô tả"}<small>{researchTime(g.from)} → {researchTime(g.to)}</small></th><td>{formatNumber(g.addedViews)}</td><td>{g.hours} giờ</td><td>{formatNumber(g.viewsPerHour)}</td></tr>)}</tbody></table></div>}
      <details><summary>Đối chiếu thời lượng trong mẫu</summary><div className="insight-table-wrap"><table><caption>Lượt xem tích lũy chịu ảnh hưởng bởi thời gian đăng; nhóm ít video chỉ có tính tham khảo.</caption><thead><tr><th>Thời lượng</th><th>Số video</th><th>Trung vị lượt xem</th></tr></thead><tbody>{report.durations.map(d => <tr key={d.label}><th scope="row">{d.label}</th><td>{d.videoCount}{d.videoCount < 3 ? " · ít mẫu" : ""}</td><td>{formatNumber(d.medianViews)}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="insight-section"><h3>Video nên thử tiếp theo</h3><p className="hint">{report.goal ? `Mục tiêu: ${report.goal}. ` : ""}Ưu tiên nội dung liên quan đến hồ sơ và không chứa từ khóa muốn tránh.</p>
      {!report.experiments.length && <p>Chưa có video tham khảo phù hợp. Bổ sung từ khóa hoặc nghiên cứu thêm một kênh khác trước khi lên ý tưởng.</p>}
      <ol className="experiment-list">{report.experiments.map((idea, i) => <li key={i}><h4>{idea.topic}</h4><p>{idea.rationale}</p><p className="muted">{idea.measurement}</p><button className="button secondary" disabled={disabled} onClick={() => onUseExperiment(idea, report)}>Dùng để viết kịch bản <ArrowRight size={16} /></button></li>)}</ol>
    </section>
    <details className="insight-section"><summary>Video bằng chứng và cách đánh giá</summary>
      <ul className="method-notes">{report.limitations.map(note => <li key={note}>{note}</li>)}</ul>
      <ul className="insight-video-list">{report.evidence.map(v => <li key={v.videoId}><strong>{v.caption || "Video chưa có mô tả"}</strong><p>{formatNumber(v.views)} lượt xem · Khớp: {v.matchedKeywords.join(", ") || "không có"}{v.excludedKeywords.length ? ` · Cần tránh: ${v.excludedKeywords.join(", ")}` : ""}</p>{safeVideoUrl(v.videoUrl) && <a href={safeVideoUrl(v.videoUrl)} target="_blank" rel="noreferrer">Xem video trên TikTok</a>}</li>)}</ul>
    </details>
  </section>;
}
