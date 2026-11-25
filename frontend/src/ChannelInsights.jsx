import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download, Plus, Save, Trash2 } from "lucide-react";
import { api } from "./api";
import { EmptyState, Notice } from "./components";
import { formatNumber, normalizeUsername, safeVideoUrl } from "./studio";

const blankProfile = () => ({ name: "", ownUsername: "", targetAudience: "", offering: "", goal: "", keywords: "", excludedKeywords: "", analyticsNotes: "" });
const PROFILE_KEY = "creator-studio-research-profile";
const readSelection = () => { try { return localStorage.getItem(PROFILE_KEY) || ""; } catch { return ""; } };
const researchTime = value => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : "Unknown time";

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
    if (ownUsername === null) { setError("Enter a valid TikTok username or profile URL."); return; }
    saveLock.current = true; setSaving(true); setError(""); setMessage("");
    try {
      const { data } = await api.saveResearchProfile({ ...draft, ownUsername });
      setProfiles(previous => [data, ...previous.filter(p => p.id !== data.id)]);
      setSelected(String(data.id)); setDraft(data); setRevision(r => r + 1);
      setMessage("Profile saved. Reuse it to compare other channels.");
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
      setDraft(next || blankProfile()); setConfirmDelete(false); setMessage("Profile deleted. Channels and scripts are preserved.");
    } catch (err) { setError(err.message); }
    finally { saveLock.current = false; setSaving(false); }
  }

  return <div className="research-insights" data-view={view}>
    <div className="profile-picker">
      <div className="field">
        <label htmlFor="research-profile">Target audience profile</label>
        <select id="research-profile" value={selected} disabled={loading || saving} onChange={e => choose(e.target.value)}>
          <option value="">Create a profile</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <button className="button secondary" disabled={loading || saving} onClick={() => choose("")}><Plus size={16} /> New profile</button>
    </div>
    {loading && <p role="status">Loading saved profiles…</p>}
    {error && <Notice>{error}</Notice>}
    {message && <p role="status" className="save-message">{message}</p>}
    {(view === "profiles" || (!selected && !loading)) && <section className="panel profile-editor" aria-labelledby="profile-heading">
      <h2 id="profile-heading">{draft.id ? "Edit profile" : "Save your channel and audience profile"}</h2>
      <p className="hint">Define your goals once and reuse them to assess channels. {window.creatorDesktop ? "Profiles are saved on this computer." : "Profiles are saved in this website's shared workspace."}</p>
      {draft.id && draft.ownUsername && <button type="button" className="button secondary own-channel-action" disabled={saving || disabled} onClick={() => onOpenOwnChannel(draft.ownUsername)}>Research @{draft.ownUsername} <ArrowRight size={16} /></button>}
      <form onSubmit={save}>
        <fieldset disabled={saving || loading} className="profile-fields">
          <div className="field"><label htmlFor="profile-name">Profile name *</label><input id="profile-name" required maxLength={100} value={draft.name} onChange={e => change("name", e.target.value)} placeholder="Example: Skincare for students" /></div>
          <div className="field"><label htmlFor="profile-username">Your TikTok channel</label><input id="profile-username" maxLength={200} value={draft.ownUsername} onChange={e => change("ownUsername", e.target.value)} placeholder="@creator or profile URL" /></div>
          <div className="field profile-wide"><label htmlFor="profile-audience">Audience you want to reach *</label><textarea id="profile-audience" required maxLength={300} rows={2} value={draft.targetAudience} onChange={e => change("targetAudience", e.target.value)} placeholder="Their needs, circumstances and problems to solve" /></div>
          <div className="field"><label htmlFor="profile-offering">Your product or offering</label><input id="profile-offering" maxLength={500} value={draft.offering} onChange={e => change("offering", e.target.value)} /></div>
          <div className="field"><label htmlFor="profile-goal">Channel goal</label><input id="profile-goal" maxLength={500} value={draft.goal} onChange={e => change("goal", e.target.value)} placeholder="Example: saves or consultation requests" /></div>
          <div className="field"><label htmlFor="profile-keywords">Needs and topic keywords *</label><textarea id="profile-keywords" required maxLength={1000} rows={3} value={draft.keywords} onChange={e => change("keywords", e.target.value)} placeholder="Example: oily skin, sunscreen, skincare" aria-describedby="keyword-help" /><p className="field-hint" id="keyword-help">1–15 comma-separated words or phrases. Include synonyms and unspaced hashtags where relevant.</p></div>
          <div className="field"><label htmlFor="profile-excluded">Topics to avoid</label><textarea id="profile-excluded" maxLength={1000} rows={3} value={draft.excludedKeywords} onChange={e => change("excludedKeywords", e.target.value)} placeholder="Comma-separated keywords to exclude" /></div>
          <div className="field profile-wide"><label htmlFor="profile-analytics">Notes from your TikTok Studio</label><textarea id="profile-analytics" maxLength={2000} rows={3} value={draft.analyticsNotes} onChange={e => change("analyticsNotes", e.target.value)} placeholder="Record the source, measurement date, audience and completion rate…" /><p className="field-hint">Your notes cannot establish another channel's audience demographics.</p></div>
        </fieldset>
        <div className="profile-actions"><button className="button primary" disabled={saving || loading}><Save size={16} /> {saving ? "Saving…" : "Save profile"}</button>
          {draft.id && !confirmDelete && <button type="button" className="button subtle" disabled={saving} onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Delete profile</button>}
          {confirmDelete && <div className="delete-confirm"><span>Delete profile “{draft.name}”?</span><button type="button" className="button secondary" disabled={saving} onClick={remove}>Confirm deletion</button><button type="button" className="button subtle" onClick={() => setConfirmDelete(false)}>Cancel</button></div>}
        </div>
      </form>
    </section>}
    {view === "insights" && selected && <>
      {!channel && <EmptyState title="Choose a channel to compare">Analyze a channel or open a saved channel above to compare it with your profile.</EmptyState>}
      {reportLoading && <p role="status">Comparing content and saved measurements…</p>}
      {reportError && <Notice onRetry={() => setRevision(r => r + 1)}>{reportError}</Notice>}
      {report && String(report.profileId) === selected && report.username === channel?.tiktokUsername && <Report report={report} disabled={disabled} onUseExperiment={onUseExperiment} />}
    </>}
  </div>;
}

function Report({ report, disabled, onUseExperiment }) {
  function download() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `comparison-${report.username}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="panel insights-report" aria-label="Audience and trend comparison">
    <div className="section-toolbar"><div><h2>@{report.username} compared with “{report.profileName}”</h2><p className="hint">Collected {researchTime(report.collectedAt)} · Sample: {report.sampleCount} saved videos</p></div><button className="button secondary download-report" aria-label="Download report" title="Download JSON report" onClick={download}><Download size={16} /> <span>Download report</span></button></div>
    {(report.describedCount < 10 || !report.collectedAt || Date.parse(report.analyzedAt) - Date.parse(report.collectedAt) > 7 * 86400000) && <Notice warning>{report.describedCount < 10 ? "Fewer than 10 videos have readable content. " : ""}{!report.collectedAt || Date.parse(report.analyzedAt) - Date.parse(report.collectedAt) > 7 * 86400000 ? "Channel data is stale or its collection time is unknown. " : ""}Collect more data before drawing conclusions.</Notice>}
    <section className="insight-section"><h3>Relevance to your target audience</h3><p>{report.targetAudience}</p>
      <dl className="insight-facts"><div><dt>Keyword matches</dt><dd>{report.contentMatchPercent == null ? "Insufficient data" : `${report.contentMatchPercent}%`} <span className="hint">({report.matchingCount}/{report.describedCount} videos with readable content)</span></dd></div><div><dt>Topics to avoid</dt><dd>{report.excludedVideoCount} videos with keywords to review</dd></div></dl>
      <p><strong>Found:</strong> {report.matchedKeywords.join(", ") || "No matching keywords."}</p>
      {!!report.unmatchedKeywords.length && <p className="muted">Not found: {report.unmatchedKeywords.join(", ")}</p>}
      <p className="hint">This measures content overlap, not the share of viewers who match your target audience.</p>
    </section>
    <section className="insight-section"><h3>Potential interest groups</h3><p className="hint">Hypotheses based on repeated hashtags. Validate them with TikTok Studio or data shared by the channel owner.</p>
      {!report.topics.length ? <p>No specific hashtag appears in at least two videos to suggest an interest group.</p> : <ul className="topic-evidence">{report.topics.map(t => <li key={t.hashtag}><strong>Interest in {t.hashtag}</strong><span>{t.videoCount} videos · median {formatNumber(t.medianViews)} views</span><details><summary>View supporting videos</summary><ul>{t.evidenceVideoIds.map(id => { const video = report.evidence.find(v => v.videoId === id); return video && <li key={id}>{safeVideoUrl(video.videoUrl) ? <a href={safeVideoUrl(video.videoUrl)} target="_blank" rel="noreferrer">{video.caption?.slice(0, 160) || "Open video on TikTok"}</a> : video.caption || "Video has no valid public link"}</li>; })}</ul></details></li>)}</ul>}
    </section>
    <section className="insight-section"><h3>Observed growth signals</h3>
      {!report.growth.length ? <p>No video has two measurements at least 1 hour apart. Refresh the channel later to compare actual view growth.</p> : <div className="insight-table-wrap"><table><caption>Average growth between two measurements; this does not predict future views.</caption><thead><tr><th>Video</th><th>Added views</th><th>Measurement interval</th><th>Views/hour</th></tr></thead><tbody>{report.growth.map(g => <tr key={g.videoId}><th scope="row">{g.caption || "Untitled video"}<small>{researchTime(g.from)} → {researchTime(g.to)}</small></th><td>{formatNumber(g.addedViews)}</td><td>{g.hours} hours</td><td>{formatNumber(g.viewsPerHour)}</td></tr>)}</tbody></table></div>}
      <details><summary>Compare durations in this sample</summary><div className="insight-table-wrap"><table><caption>Lifetime views depend on video age. Small groups offer limited evidence.</caption><thead><tr><th>Duration</th><th>Video count</th><th>Median views</th></tr></thead><tbody>{report.durations.map(d => <tr key={d.label}><th scope="row">{d.label}</th><td>{d.videoCount}{d.videoCount < 3 ? " · small sample" : ""}</td><td>{formatNumber(d.medianViews)}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="insight-section"><h3>Videos to test next</h3><p className="hint">{report.goal ? `Goal: ${report.goal}. ` : ""}Prioritize content relevant to your profile without excluded keywords.</p>
      {!report.experiments.length && <p>No suitable reference videos. Add keywords or research another channel to develop ideas.</p>}
      <ol className="experiment-list">{report.experiments.map((idea, i) => <li key={i}><h4>{idea.topic}</h4><p>{idea.rationale}</p><p className="muted">{idea.measurement}</p><button className="button secondary" disabled={disabled} onClick={() => onUseExperiment(idea, report)}>Use in script studio <ArrowRight size={16} /></button></li>)}</ol>
    </section>
    <details className="insight-section"><summary>Evidence videos and methodology</summary>
      <ul className="method-notes">{report.limitations.map(note => <li key={note}>{note}</li>)}</ul>
      <ul className="insight-video-list">{report.evidence.map(v => <li key={v.videoId}><strong>{v.caption || "Untitled video"}</strong><p>{formatNumber(v.views)} views · Matches: {v.matchedKeywords.join(", ") || "none"}{v.excludedKeywords.length ? ` · Excluded: ${v.excludedKeywords.join(", ")}` : ""}</p>{safeVideoUrl(v.videoUrl) && <a href={safeVideoUrl(v.videoUrl)} target="_blank" rel="noreferrer">View video on TikTok</a>}</li>)}</ul>
    </details>
  </section>;
}
