import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Bookmark,
  Copy,
  Check,
  Search,
  Film,
  Camera,
  MessageSquare,
  Hash,
  ChevronRight,
  Flame,
  ThumbsUp,
  Eye,
  RefreshCw,
  Lightbulb,
  Clock,
  Target
} from 'lucide-react';
import { api } from './api';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Làm đẹp & Chăm sóc da (Skincare / Makeup)', slug: 'lam-dep-my-pham' },
  { id: 2, name: 'Thời trang & Phối đồ (OOTD / Phụ kiện)', slug: 'thoi-trang-phoi-do' },
  { id: 3, name: 'Ăn uống & Review món ngon (Food Tour)', slug: 'an-uong-review' },
  { id: 4, name: 'Công nghệ, Điện thoại & Mẹo vặt', slug: 'cong-nghe-tien-ich' },
  { id: 5, name: 'Đời sống, Tâm sự & Truyền cảm hứng', slug: 'doi-song-storytelling' }
];

const QUICK_IDEAS = [
  '3 Sai lầm chết người khi thoa kem chống nắng khiến da nổi mụn',
  'Cách phối đồ hack chiều cao thêm 5cm cho người lùn',
  'Top 3 quán cà phê view ngắm hoàng hôn đẹp nhất không thể bỏ qua',
  'Mẹo ẩn trên điện thoại 90% người dùng chưa từng biết',
  'Cách quản lý chi tiêu tháng đầu đi làm không lo rỗng túi'
];

const SAMPLE_CHANNELS = [
  { username: 'beauty_queen', label: 'Kênh Làm Đẹp' },
  { username: 'chubebe', label: 'Kênh Đời Sống' },
  { username: 'reviewcongnghe', label: 'Kênh Công Nghệ' },
  { username: 'foodlover_vn', label: 'Kênh Ẩm Thực' }
];

const TONE_OPTIONS = [
  { label: 'Cảnh báo, giật tít', desc: 'Gây chú ý mạnh mẽ' },
  { label: 'Hài hước, gần gũi', desc: 'Dễ tạo viral chia sẻ' },
  { label: 'Chuyên gia, uy tín', desc: 'Xây dựng độ tin cậy cao' },
  { label: 'Tâm sự, kể chuyện', desc: 'Chạm cảm xúc người xem' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

  // Form viết kịch bản
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);
  const [scriptTopic, setScriptTopic] = useState('3 Sai lầm chết người khi thoa kem chống nắng khiến da nổi mụn');
  const [targetAudience, setTargetAudience] = useState('Gen Z da dầu mụn, học sinh sinh viên');
  const [scriptTone, setScriptTone] = useState('Cảnh báo, giật tít');
  const [generatedScript, setGeneratedScript] = useState(null);
  const [studioLoading, setStudioLoading] = useState(false);

  // Khám phá kênh đối thủ
  const [searchUsername, setSearchUsername] = useState('beauty_queen');
  const [channelData, setChannelData] = useState(null);
  const [topVideos, setTopVideos] = useState([]);
  const [channelLoading, setChannelLoading] = useState(false);

  // Kịch bản đã lưu
  const [myScripts, setMyScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    loadCategories();
    loadMyScripts();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res?.data && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (_) {
      // Giữ DEFAULT_CATEGORIES nếu backend đang khởi động
    }
  };

  const loadMyScripts = async () => {
    try {
      setScriptsLoading(true);
      const res = await api.getMyScripts();
      if (res?.data) {
        setMyScripts(res.data);
      }
    } catch (_) {
    } finally {
      setScriptsLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) {
      alert('Vui lòng nhập chủ đề video bạn muốn làm!');
      return;
    }

    setStudioLoading(true);
    try {
      const payload = {
        categoryId: Number(selectedCategoryId) || 1,
        topic: scriptTopic.trim(),
        targetAudience: targetAudience.trim() || 'Người dùng TikTok Việt Nam',
        tone: scriptTone.trim() || 'Lôi cuốn, thực tế',
        referenceVideoIds: []
      };

      const res = await api.generateDirectScript(payload);
      if (res?.data) {
        setGeneratedScript(res.data);
        showToastMsg('Kịch bản video đã được khởi tạo thành công');
        loadMyScripts();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo kịch bản, vui lòng thử lại.');
    } finally {
      setStudioLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (!generatedScript) return;
    const structure = generatedScript.scriptStructure || {};
    const text = `TIÊU ĐỀ VIDEO: ${generatedScript.title}
ĐỐI TƯỢNG XEM: ${generatedScript.targetAudience}
THỜI LƯỢNG ƯỚC TÍNH: ~${structure.estimatedDurationSeconds || 35} giây

==================================================
1. CÂU MỞ ĐẦU 3 GIÂY ĐẦU TIÊN (HOOK):
"${structure.hook3s || ''}"

2. NỘI DUNG CHÍNH (LỜI THOẠI CHI TIẾT):
${structure.bodyContent || ''}

3. HƯỚNG DẪN QUAY & GÓC MÁY (VISUAL CUES):
${generatedScript.visualAndSoundCues || ''}

4. KÊU GỌI HÀNH ĐỘNG (CTA):
"${structure.callToAction || ''}"

5. HASHTAGS GỢI Ý:
${(generatedScript.suggestedHashtags || []).join(' ')}
==================================================
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToastMsg('Đã sao chép nội dung kịch bản vào clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleFavorite = async (scriptId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'FAVORITE' ? 'DRAFT' : 'FAVORITE';
      const res = await api.updateScriptStatus(scriptId, newStatus);
      if (generatedScript && generatedScript.id === scriptId) {
        setGeneratedScript(res.data);
      }
      showToastMsg(newStatus === 'FAVORITE' ? 'Đã lưu vào danh sách yêu thích' : 'Đã bỏ yêu thích');
      loadMyScripts();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSearchChannel = async (customUsername) => {
    const targetUser = (customUsername || searchUsername).replace('@', '').trim();
    if (!targetUser) return;

    setSearchUsername(targetUser);
    setChannelLoading(true);
    try {
      const res = await api.ingestChannel(targetUser, selectedCategoryId, 10);
      setChannelData(res.data);

      try {
        const topRes = await api.getTopVideos(targetUser, 8);
        setTopVideos(topRes.data || []);
      } catch (videoErr) {
        console.warn('Top videos warning:', videoErr);
      }

      showToastMsg(`Đã phân tích xong dữ liệu kênh @${targetUser}`);
    } catch (err) {
      alert(err.message || 'Không thể phân tích dữ liệu kênh, vui lòng thử lại');
    } finally {
      setChannelLoading(false);
    }
  };

  const handleUseVideoInspiration = (video) => {
    setScriptTopic(`Mô phỏng trend: ${video.caption?.slice(0, 70) || 'Video viral triệu view'}`);
    setActiveTab('studio');
    showToastMsg('Đã nạp video vào xưởng kịch bản');
  };

  return (
    <div>
      {/* Toast thông báo */}
      {toast && (
        <div className="toast">
          <Sparkles size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header điều hướng */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-area">
            <div className="logo-icon">
              <Flame size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                TikTok Creator Studio
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Nghiên cứu đối thủ và sinh kịch bản video viral
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button
              className={`tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('studio')}
            >
              <Sparkles size={15} />
              Xưởng Kịch Bản
            </button>
            <button
              className={`tab-btn ${activeTab === 'channel' ? 'active' : ''}`}
              onClick={() => setActiveTab('channel')}
            >
              <TrendingUp size={15} />
              Kênh Đối Thủ
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('history');
                loadMyScripts();
              }}
            >
              <Bookmark size={15} />
              Kho Kịch Bản ({myScripts.length})
            </button>
          </nav>

          {/* Status Pill */}
          <div className="status-pill">
            <span className="status-dot"></span>
            Chế độ tự do (Không cần tài khoản)
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-container">
        {/* ============================================================== */}
        {/* TAB 1: XƯỞNG KỊCH BẢN */}
        {/* ============================================================== */}
        {activeTab === 'studio' && (
          <div className="grid-studio">
            {/* Cột trái: Form nhập liệu */}
            <div className="card-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Sparkles size={18} color="var(--brand-primary)" />
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Thiết Lập Kịch Bản</h2>
              </div>

              {/* Ngành hàng */}
              <div className="form-group">
                <label className="form-label">Ngành hàng / Lĩnh vực:</label>
                <select
                  className="form-select"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chủ đề video */}
              <div className="form-group">
                <label className="form-label">Chủ đề hoặc nội dung cần làm video:</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={scriptTopic}
                  onChange={(e) => setScriptTopic(e.target.value)}
                  placeholder="Ví dụ: 3 Sai lầm chăm da khiến mụn nhiều hơn…"
                />

                {/* Gợi ý chủ đề nhanh */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '8px' }}>
                    <Lightbulb size={13} />
                    Gợi ý chủ đề nhanh:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {QUICK_IDEAS.map((idea, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="quick-topic-btn"
                        onClick={() => setScriptTopic(idea)}
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Đối tượng mục tiêu */}
              <div className="form-group">
                <label className="form-label">Đối tượng khán giả mục tiêu:</label>
                <input
                  type="text"
                  className="form-input"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ví dụ: Học sinh sinh viên, Gen Z da dầu mụn…"
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {['Gen Z da dầu mụn', 'Dân văn phòng', 'Người mới bắt đầu', 'Mẹ bỉm sữa'].map((aud, i) => (
                    <button
                      key={i}
                      type="button"
                      className="badge"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setTargetAudience(aud)}
                    >
                      + {aud}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone giọng truyền tải */}
              <div className="form-group">
                <label className="form-label">Phong cách truyền tải (Tone giọng):</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TONE_OPTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`choice-pill ${scriptTone === item.label ? 'selected' : ''}`}
                      onClick={() => setScriptTone(item.label)}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút hành động */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                onClick={handleGenerateScript}
                disabled={studioLoading}
              >
                {studioLoading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Đang phân tích và viết kịch bản…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Sinh Kịch Bản Viral 3 Hồi
                  </>
                )}
              </button>
            </div>

            {/* Cột phải: Hiển thị kịch bản */}
            <div>
              {generatedScript ? (
                <div className="card-panel">
                  {/* Tiêu đề & Hành động */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="badge">Google Gemini 3.5 Flash</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} />
                          Thời lượng ước tính: ~{generatedScript.scriptStructure?.estimatedDurationSeconds || 35} giây
                        </span>
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                        {generatedScript.title}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" onClick={handleCopyScript} style={{ padding: '8px 16px' }}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Đã sao chép' : 'Sao chép kịch bản'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleToggleFavorite(generatedScript.id, generatedScript.status)}
                        title="Lưu yêu thích"
                        style={{ padding: '8px 12px' }}
                      >
                        <Bookmark
                          size={16}
                          color={generatedScript.status === 'FAVORITE' ? 'var(--brand-primary)' : 'currentColor'}
                          fill={generatedScript.status === 'FAVORITE' ? 'var(--brand-primary)' : 'none'}
                        />
                      </button>
                    </div>
                  </div>

                  {/* PHẦN 1: HOOK 3S */}
                  <div className="script-section primary-highlight">
                    <div className="section-label primary">
                      <Flame size={16} />
                      1. CÂU MỞ ĐẦU 3 GIÂY ĐẦU TIÊN (GIỮ CHÂN NGƯỜI XEM)
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      "{generatedScript.scriptStructure?.hook3s}"
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                      Lưu ý khi quay: Truyền tải dứt khoát, biểu cảm tự tin ngay khi video bắt đầu.
                    </p>
                  </div>

                  {/* PHẦN 2: THÂN BÀI */}
                  <div className="script-section">
                    <div className="section-label accent">
                      <Film size={15} />
                      2. NỘI DUNG CHÍNH (LỜI THOẠI CHI TIẾT)
                    </div>
                    <div style={{ whiteSpace: 'pre-line', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)' }}>
                      {generatedScript.scriptStructure?.bodyContent}
                    </div>
                  </div>

                  {/* PHẦN 3: GÓC MÁY */}
                  {generatedScript.visualAndSoundCues && (
                    <div className="script-section">
                      <div className="section-label accent">
                        <Camera size={15} />
                        3. HƯỚNG DẪN QUAY DỰNG & GÓC MÁY (VISUAL CUES)
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {generatedScript.visualAndSoundCues}
                      </p>
                    </div>
                  )}

                  {/* PHẦN 4: CTA */}
                  <div className="script-section">
                    <div className="section-label">
                      <MessageSquare size={15} />
                      4. KÊU GỌI HÀNH ĐỘNG (CTA)
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                      "{generatedScript.scriptStructure?.callToAction}"
                    </p>
                  </div>

                  {/* HASHTAGS */}
                  {generatedScript.suggestedHashtags?.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '8px' }}>
                        <Hash size={13} />
                        Hashtags đề xuất:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {generatedScript.suggestedHashtags.map((tag, idx) => (
                          <span key={idx} className="badge badge-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty state */
                <div
                  className="card-panel"
                  style={{
                    height: '100%',
                    minHeight: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '32px'
                  }}
                >
                  <Sparkles size={40} color="var(--brand-primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    Kịch Bản Sẽ Xuất Hiện Tại Đây
                  </h3>
                  <p style={{ maxWidth: '440px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                    Điền ý tưởng video ở cột bên trái và bấm <strong>"Sinh Kịch Bản Viral 3 Hồi"</strong>. Hệ thống sẽ cấu trúc kịch bản thành từng phân đoạn cụ thể kèm hướng dẫn góc máy.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '30rem', width: '100%', textAlign: 'left' }}>
                    <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={14} />
                        Câu Hook 3 giây
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Mở đầu lôi cuốn để giữ chân người xem không lướt qua.
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Film size={14} />
                        Góc quay & Lời thoại
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Hướng dẫn cụ thể góc máy và động tác tay khi quay.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: KHÁM PHÁ KÊNH ĐỐI THỦ */}
        {/* ============================================================== */}
        {activeTab === 'channel' && (
          <div>
            <div className="card-panel" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Phân Tích Kênh Đối Thủ & Video Triệu View
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Nhập tên tài khoản bất kỳ trên TikTok để phân tích hiệu suất video và tỷ lệ tương tác (Engagement Rate).
              </p>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={16}
                    color="var(--text-tertiary)"
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '44px' }}
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="Nhập tên tài khoản TikTok (ví dụ: beauty_queen, chubebe…)"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchChannel()}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => handleSearchChannel()} disabled={channelLoading}>
                  {channelLoading ? 'Đang phân tích…' : 'Xem Video Nhiều View Nhất'}
                </button>
              </div>

              {/* Kênh mẫu thử nhanh */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Kênh mẫu thử nhanh:</span>
                {SAMPLE_CHANNELS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="badge"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSearchChannel(item.username)}
                  >
                    @{item.username} ({item.label})
                  </button>
                ))}
              </div>
            </div>

            {/* Thông tin kênh đối thủ */}
            {channelData && (
              <div className="card-panel" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {channelData.avatarUrl ? (
                      <img
                        src={channelData.avatarUrl}
                        alt={channelData.nickname || channelData.tiktokUsername}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--border-subtle)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--surface-raised)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: 700
                        }}
                      >
                        {channelData.tiktokUsername?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                        @{channelData.tiktokUsername}
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {channelData.nickname || 'Creator TikTok'} • {channelData.bio || 'Chưa có tiểu sử'}
                      </p>
                    </div>
                  </div>

                  <div className="stat-box">
                    <div>
                      <div className="stat-value">
                        {(channelData.followersCount ?? channelData.followerCount ?? 0).toLocaleString()}
                      </div>
                      <div className="stat-label">NGƯỜI THEO DÕI</div>
                    </div>
                    <div>
                      <div className="stat-value">
                        {(channelData.totalLikes ?? channelData.likeCount ?? 0).toLocaleString()}
                      </div>
                      <div className="stat-label">LƯỢT THÍCH</div>
                    </div>
                    <div>
                      <div className="stat-value" style={{ color: 'var(--brand-accent)' }}>
                        {channelData.averageEngagementRate || '0.00'}%
                      </div>
                      <div className="stat-label">TỶ LỆ TƯƠNG TÁC (ER)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danh sách video */}
            {topVideos.length > 0 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={16} color="var(--brand-primary)" />
                  Video Có Tỷ Lệ Tương Tác Cao Nhất (Xếp theo độ viral)
                </h3>

                <div className="video-grid">
                  {topVideos.map((vid) => (
                    <div key={vid.id} className="video-card">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span className="badge" style={{ color: 'var(--brand-accent)' }}>
                            ER: {vid.engagementRate || '0'}%
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={13} /> <span className="tabular">{(vid.viewCount || 0).toLocaleString()}</span>
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px', lineHeight: 1.5 }}>
                          {vid.caption || 'Video không có caption'}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ThumbsUp size={12} /> <span className="tabular">{(vid.likeCount || 0).toLocaleString()}</span>
                          <span style={{ margin: '0 4px' }}>•</span>
                          <MessageSquare size={12} /> <span className="tabular">{(vid.commentCount || 0).toLocaleString()}</span>
                        </span>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                          onClick={() => handleUseVideoInspiration(vid)}
                        >
                          Dùng ý tưởng
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: KHO KỊCH BẢN */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Kho Kịch Bản Của Bạn</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Toàn bộ các kịch bản bạn đã sinh bằng AI trong các phiên làm việc
                </p>
              </div>
              <button className="btn btn-secondary" onClick={loadMyScripts} disabled={scriptsLoading}>
                {scriptsLoading ? 'Đang tải…' : 'Làm mới danh sách'}
              </button>
            </div>

            {myScripts.length === 0 ? (
              <div className="card-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Bookmark size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>Chưa có kịch bản nào được lưu</h3>
                <p style={{ marginTop: '8px', fontSize: '13px' }}>
                  Hãy chuyển sang tab <strong>Xưởng Kịch Bản</strong> để tạo kịch bản đầu tiên cho video của bạn.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                  onClick={() => setActiveTab('studio')}
                >
                  Tạo Kịch Bản Ngay
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {myScripts.map((script) => (
                  <div key={script.id} className="card-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge">
                          {script.status === 'FAVORITE' ? 'Yêu thích' : 'Bản nháp'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          ~{script.scriptStructure?.estimatedDurationSeconds || 35} giây
                        </span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{script.title}</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Hook: "{script.scriptStructure?.hook3s}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        onClick={() => {
                          setGeneratedScript(script);
                          setActiveTab('studio');
                        }}
                      >
                        Mở Xem Kịch Bản
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px' }}
                        onClick={() => handleToggleFavorite(script.id, script.status)}
                        title="Lưu yêu thích"
                      >
                        <Bookmark
                          size={14}
                          color={script.status === 'FAVORITE' ? 'var(--brand-primary)' : 'currentColor'}
                          fill={script.status === 'FAVORITE' ? 'var(--brand-primary)' : 'none'}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
