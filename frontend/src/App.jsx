import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Bookmark,
  Copy,
  Check,
  Search,
  Zap,
  Film,
  Camera,
  MessageSquare,
  Hash,
  PlayCircle,
  HelpCircle,
  ChevronRight,
  Flame,
  ThumbsUp,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from './api';

// Danh mục mặc định sẵn sàng ngay lập tức không cần đợi backend
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Làm đẹp & Chăm sóc da (Skincare / Makeup)', slug: 'lam-dep-my-pham' },
  { id: 2, name: 'Thời trang & Phối đồ (OOTD / Phụ kiện)', slug: 'thoi-trang-phoi-do' },
  { id: 3, name: 'Ăn uống & Review món ngon (Food Tour)', slug: 'an-uong-review' },
  { id: 4, name: 'Công nghệ, Điện thoại & Mẹo vặt', slug: 'cong-nghe-tien-ich' },
  { id: 5, name: 'Đời sống, Tâm sự & Truyền cảm hứng', slug: 'doi-song-storytelling' }
];

// Gợi ý chủ đề nhanh để người dùng bấm thử 1-click
const QUICK_IDEAS = [
  '3 Sai lầm chết người khi thoa kem chống nắng khiến da nổi mụn',
  'Cách phối đồ hack chiều cao thêm 5cm cho người lùn',
  'Top 3 quán cà phê view ngắm hoàng hôn đẹp nhất không thể bỏ qua',
  'Mẹo ẩn trên điện thoại 90% người dùng chưa từng biết',
  'Cách quản lý chi tiêu tháng đầu đi làm không lo rỗng túi'
];

// Kênh mẫu để người dùng thử tính năng phân tích kênh đối thủ
const SAMPLE_CHANNELS = [
  { username: 'beauty_queen', label: 'Kênh Làm Đẹp' },
  { username: 'chubebe', label: 'Kênh Đời Sống' },
  { username: 'reviewcongnghe', label: 'Kênh Công Nghệ' },
  { username: 'foodlover_vn', label: 'Kênh Ẩm Thực' }
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
  const [scriptTone, setScriptTone] = useState('Cảnh báo, chuyên gia, lôi cuốn');
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

  // Nạp danh mục từ backend khi khởi động
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
      const res = await api.getMyScripts();
      if (res?.data) {
        setMyScripts(res.data);
      }
    } catch (_) {}
  };

  // Sinh kịch bản AI (Không yêu cầu đăng nhập)
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
        showToastMsg('✨ Kịch bản đã được sinh thành công!');
        loadMyScripts();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo kịch bản, vui lòng thử lại.');
    } finally {
      setStudioLoading(false);
    }
  };

  // Sao chép kịch bản 1-click
  const handleCopyScript = () => {
    if (!generatedScript) return;
    const structure = generatedScript.scriptStructure || {};
    const text = `🎬 TIÊU ĐỀ VIDEO: ${generatedScript.title}
🎯 ĐỐI TƯỢNG XEM: ${generatedScript.targetAudience}
⏱️ THỜI LƯỢNG ƯỚC TÍNH: ~${structure.estimatedDurationSeconds || 35} giây

==================================================
1. CÂU MỞ ĐẦU 3 GIÂY ĐẦU TIÊN (GIỮ CHÂN NGƯỜI XEM):
"${structure.hook3s || ''}"

2. NỘI DUNG CHÍNH (LỜI THOẠI CHI TIẾT):
${structure.bodyContent || ''}

3. HƯỚNG DẪN QUAY & ĐỘNG TÁC (GÓC MÁY / HÀNH ĐỘNG):
${generatedScript.visualAndSoundCues || ''}

4. CÂU KẾT THÚC (KÊU GỌI THẢ TIM, COMMENT, FOLLOW):
"${structure.callToAction || ''}"

5. HASHTAGS GỢI Ý:
${(generatedScript.suggestedHashtags || []).join(' ')}
==================================================
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToastMsg('Đã sao chép kịch bản! Bạn có thể dán vào ghi chú để quay video.');
    setTimeout(() => setCopied(false), 2500);
  };

  // Đánh dấu yêu thích
  const handleToggleFavorite = async (scriptId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'FAVORITE' ? 'DRAFT' : 'FAVORITE';
      const res = await api.updateScriptStatus(scriptId, newStatus);
      if (generatedScript && generatedScript.id === scriptId) {
        setGeneratedScript(res.data);
      }
      showToastMsg(newStatus === 'FAVORITE' ? 'Đã lưu vào danh sách yêu thích ⭐' : 'Đã bỏ yêu thích');
      loadMyScripts();
    } catch (err) {
      console.warn(err);
    }
  };

  // Khám phá kênh
  const handleSearchChannel = async (customUsername) => {
    const targetUser = (customUsername || searchUsername).replace('@', '').trim();
    if (!targetUser) return;

    setSearchUsername(targetUser);
    setChannelLoading(true);
    try {
      const res = await api.ingestChannel(targetUser, selectedCategoryId, 10);
      setChannelData(res.data);

      const topRes = await api.getTopVideos(targetUser, 8);
      setTopVideos(topRes.data || []);
      showToastMsg(`Đã phân tích xong kênh @${targetUser}`);
    } catch (err) {
      alert(err.message || 'Không thể cào dữ liệu kênh');
    } finally {
      setChannelLoading(false);
    }
  };

  // Chọn video viral làm cảm hứng
  const handleUseVideoInspiration = (video) => {
    setScriptTopic(`Mô phỏng trend: ${video.caption?.slice(0, 70) || 'Video viral triệu view'}`);
    setActiveTab('studio');
    showToastMsg('Đã nạp video vào Xưởng Kịch Bản! Bạn hãy bấm Sinh Kịch Bản.');
  };

  return (
    <div>
      {/* Toast thông báo */}
      {toast && (
        <div className="toast">
          <Zap size={18} color="var(--tiktok-cyan)" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header điều hướng */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-area">
            <div className="logo-icon">
              <Flame size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                TikTok <span className="gradient-text">Creator Studio</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Nghiên cứu đối thủ & Tự động viết kịch bản video viral bằng AI
              </p>
            </div>
          </div>

          {/* Các tab chức năng */}
          <nav className="nav-tabs">
            <button
              className={`tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('studio')}
            >
              <Sparkles size={16} />
              Viết Kịch Bản Nhanh (AI)
            </button>
            <button
              className={`tab-btn ${activeTab === 'channel' ? 'active' : ''}`}
              onClick={() => setActiveTab('channel')}
            >
              <TrendingUp size={16} />
              Khám Phá Kênh Đối Thủ
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('history');
                loadMyScripts();
              }}
            >
              <Bookmark size={16} />
              Kịch Bản Đã Lưu ({myScripts.length})
            </button>
          </nav>

          {/* Huy hiệu chế độ trực tiếp (Không cần đăng nhập) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                background: 'rgba(37, 244, 238, 0.1)',
                border: '1px solid rgba(37, 244, 238, 0.3)',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--tiktok-cyan)'
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#25f4ee' }}></span>
              Chế độ sử dụng tự do (Không cần tài khoản)
            </span>
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="main-container">
        {/* ============================================================== */}
        {/* TAB 1: VIẾT KỊCH BẢN NHANH */}
        {/* ============================================================== */}
        {activeTab === 'studio' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 440px) 1fr', gap: '2rem' }}>
            {/* Cột trái: Nhập thông tin */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Sparkles size={20} color="var(--tiktok-pink)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>1. Nhập Ý Tưởng Video</h2>
              </div>

              {/* Chọn chủ đề kênh */}
              <div className="form-group">
                <label className="form-label">Chủ đề kênh của bạn (Ngành hàng):</label>
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

              {/* Nhập nội dung muốn làm */}
              <div className="form-group">
                <label className="form-label">Chủ đề hoặc nội dung bạn muốn làm video:</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={scriptTopic}
                  onChange={(e) => setScriptTopic(e.target.value)}
                  placeholder="Ví dụ: 3 Sai lầm chăm da khiến mụn nhiều hơn..."
                />

                {/* Gợi ý chủ đề nhanh */}
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    💡 Bấm vào gợi ý để điền nhanh:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                    {QUICK_IDEAS.map((idea, idx) => (
                      <button
                        key={idx}
                        type="button"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onClick={() => setScriptTopic(idea)}
                      >
                        {idea.slice(0, 36)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Đối tượng xem */}
              <div className="form-group">
                <label className="form-label">Video này dành cho ai xem?</label>
                <input
                  type="text"
                  className="form-input"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ví dụ: Học sinh sinh viên, Gen Z, Dân văn phòng..."
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {['Gen Z da dầu mụn', 'Dân văn phòng', 'Người mới bắt đầu', 'Mẹ bỉm sữa'].map((aud, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.725rem',
                        background: 'rgba(37, 244, 238, 0.08)',
                        color: 'var(--tiktok-cyan)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setTargetAudience(aud)}
                    >
                      +{aud}
                    </span>
                  ))}
                </div>
              </div>

              {/* Phong cách nói chuyện */}
              <div className="form-group">
                <label className="form-label">Phong cách nói chuyện (Tone giọng):</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'Cảnh báo, giật tít', desc: 'Gây chú ý mạnh' },
                    { label: 'Hài hước, gần gũi', desc: 'Dễ viral chia sẻ' },
                    { label: 'Chuyên gia, uy tín', desc: 'Tạo độ tin cậy' },
                    { label: 'Tâm sự, kể chuyện', desc: 'Chạm cảm xúc' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: scriptTone === item.label ? '1px solid var(--tiktok-pink)' : '1px solid var(--border-subtle)',
                        background: scriptTone === item.label ? 'rgba(254, 44, 85, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: scriptTone === item.label ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onClick={() => setScriptTone(item.label)}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút bấm sinh kịch bản */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}
                onClick={handleGenerateScript}
                disabled={studioLoading}
              >
                {studioLoading ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    <span>AI đang phân tích và viết kịch bản...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Sinh Kịch Bản TikTok Viral 3 Hồi
                  </>
                )}
              </button>
            </div>

            {/* Cột phải: Kết quả kịch bản */}
            <div>
              {generatedScript ? (
                <div className="script-card">
                  {/* Tiêu đề & nút hành động */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span className="badge badge-model">Google Gemini 3.5 Flash</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ⏱️ Thời lượng ước tính: ~{generatedScript.scriptStructure?.estimatedDurationSeconds || 35} giây
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff' }}>
                        {generatedScript.title}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button className="btn btn-primary" onClick={handleCopyScript} style={{ padding: '0.55rem 1.1rem' }}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Đã sao chép!' : 'Sao chép kịch bản'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleToggleFavorite(generatedScript.id, generatedScript.status)}
                        title="Lưu yêu thích"
                      >
                        <Bookmark
                          size={16}
                          color={generatedScript.status === 'FAVORITE' ? 'var(--tiktok-pink)' : 'currentColor'}
                          fill={generatedScript.status === 'FAVORITE' ? 'var(--tiktok-pink)' : 'none'}
                        />
                      </button>
                    </div>
                  </div>

                  {/* PHẦN 1: 3 GIÂY ĐẦU (HOOK) */}
                  <div className="hook-box" style={{ marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--tiktok-pink)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <Flame size={16} />
                      1. CÂU MỞ ĐẦU 3 GIÂY ĐẦU TIÊN (GIỮ CHÂN NGƯỜI XEM KHÔNG LƯỚT QUA)
                    </div>
                    <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.5 }}>
                      "{generatedScript.scriptStructure?.hook3s}"
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                      👉 Mẹo: Nói câu này to, rõ, nét mặt biểu cảm ngay khi bấm nút quay!
                    </p>
                  </div>

                  {/* PHẦN 2: THÂN BÀI */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--tiktok-cyan)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Film size={16} />
                      2. NỘI DUNG CHÍNH (LỜI THOẠI CHI TIẾT TỪNG Ý)
                    </div>
                    <div style={{ whiteSpace: 'pre-line', fontSize: '0.975rem', lineHeight: 1.7, background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                      {generatedScript.scriptStructure?.bodyContent}
                    </div>
                  </div>

                  {/* PHẦN 3: HƯỚNG DẪN QUAY DỰNG */}
                  {generatedScript.visualAndSoundCues && (
                    <div className="cues-box">
                      <div style={{ fontWeight: 800, color: 'var(--tiktok-cyan)', fontSize: '0.825rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Camera size={15} />
                        3. HƯỚNG DẪN QUAY DỰNG & GÓC MÁY (VISUAL CUES)
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                        {generatedScript.visualAndSoundCues}
                      </p>
                    </div>
                  )}

                  {/* PHẦN 4: KÊU GỌI HÀNH ĐỘNG (CTA) */}
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', borderLeft: '4px solid #fff' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MessageSquare size={15} />
                      4. CÂU KẾT THÚC KÊU GỌI HÀNH ĐỘNG (CTA)
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                      "{generatedScript.scriptStructure?.callToAction}"
                    </p>
                  </div>

                  {/* PHẦN 5: HASHTAGS */}
                  {generatedScript.suggestedHashtags?.length > 0 && (
                    <div style={{ marginTop: '1.25rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Hash size={14} />
                        DANH SÁCH HASHTAGS ĐỀ XUẤT:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
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
                /* Hướng dẫn khi chưa có kịch bản */
                <div
                  className="glass-panel"
                  style={{
                    height: '100%',
                    minHeight: '450px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '2.5rem'
                  }}
                >
                  <Sparkles size={52} color="var(--tiktok-pink)" style={{ marginBottom: '1.25rem' }} />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Kịch Bản Của Bạn Sẽ Xuất Hiện Ở Đây
                  </h3>
                  <p style={{ maxWidth: '460px', fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Điền ý tưởng video ở cột bên trái và bấm <strong>"Sinh Kịch Bản TikTok Viral"</strong>. AI sẽ tự động chia kịch bản thành từng cảnh, viết lời thoại và hướng dẫn góc máy cho bạn!
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', textAlign: 'left', maxWidth: '480px' }}>
                    <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)', flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--tiktok-pink)' }}>🔥 Câu Hook 3 giây</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Giật tít để người xem dừng tay không lướt qua.</div>
                    </div>
                    <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)', flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--tiktok-cyan)' }}>🎬 Góc quay & Lời thoại</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Hướng dẫn cụ thể góc máy và động tác tay khi quay.</div>
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
            {/* Hộp tìm kiếm kênh */}
            <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                Nghiên Cứu Kênh Đối Thủ & Xem Video Triệu View
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Nhập tên tài khoản bất kỳ trên TikTok để phân tích xem họ làm video nào nhiều view nhất và xem tỷ lệ tương tác của họ.
              </p>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={20}
                    color="var(--text-dim)"
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="Nhập tên tài khoản TikTok (ví dụ: beauty_queen, chubebe...)"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchChannel()}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => handleSearchChannel()} disabled={channelLoading}>
                  {channelLoading ? 'Đang phân tích...' : 'Xem Video Nhiều View Nhất'}
                </button>
              </div>

              {/* Kênh mẫu bấm thử */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Kênh mẫu thử nhanh:</span>
                {SAMPLE_CHANNELS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--tiktok-cyan)',
                      fontSize: '0.775rem',
                      padding: '0.25rem 0.6rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSearchChannel(item.username)}
                  >
                    @{item.username} ({item.label})
                  </button>
                ))}
              </div>
            </div>

            {/* Thông tin kênh đối thủ */}
            {channelData && (
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--tiktok-pink), var(--tiktok-cyan))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800
                      }}
                    >
                      {channelData.tiktokUsername?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                        @{channelData.tiktokUsername}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {channelData.nickname || 'Creator TikTok'} • {channelData.bio || 'Chưa có tiểu sử'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                        {(channelData.followerCount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>NGƯỜI THEO DÕI</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tiktok-pink)' }}>
                        {(channelData.likeCount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>LƯỢT THÍCH</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tiktok-cyan)' }}>
                        {channelData.averageEngagementRate || '0.00'}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>TỶ LỆ TƯƠNG TÁC (ER)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danh sách video triệu view */}
            {topVideos.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={18} color="var(--tiktok-pink)" />
                  Video Có Tỷ Lệ Tương Tác Cao Nhất Của Kênh (Sắp xếp theo độ viral)
                </h3>

                <div className="video-grid">
                  {topVideos.map((vid) => (
                    <div key={vid.id} className="video-card">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span className="badge" style={{ background: 'rgba(37, 244, 238, 0.15)', color: 'var(--tiktok-cyan)' }}>
                            Độ tương tác: {vid.engagementRate || '0'}%
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Eye size={13} /> {(vid.viewCount || 0).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.925rem', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
                          {vid.caption || 'Video không có caption'}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                          ❤️ {(vid.likeCount || 0).toLocaleString()} • 💬 {(vid.commentCount || 0).toLocaleString()}
                        </span>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleUseVideoInspiration(vid)}
                        >
                          Dùng ý tưởng này
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
        {/* TAB 3: KỊCH BẢN ĐÃ LƯU */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Kho Kịch Bản Của Bạn</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Toàn bộ các kịch bản bạn đã sinh bằng AI trong các lần sử dụng
                </p>
              </div>
              <button className="btn btn-secondary" onClick={loadMyScripts} disabled={scriptsLoading}>
                {scriptsLoading ? 'Đang tải...' : 'Làm mới danh sách'}
              </button>
            </div>

            {myScripts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bookmark size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Chưa có kịch bản nào được lưu</h3>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Hãy chuyển sang tab <strong>Viết Kịch Bản Nhanh (AI)</strong> để tạo kịch bản đầu tiên cho video của bạn!
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => setActiveTab('studio')}
                >
                  Tạo Kịch Bản Ngay
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {myScripts.map((script) => (
                  <div key={script.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span className={`badge ${script.status === 'FAVORITE' ? 'badge-model' : ''}`}>
                          {script.status === 'FAVORITE' ? '⭐ Yêu thích' : 'Bản nháp'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          ~{script.scriptStructure?.estimatedDurationSeconds || 35} giây
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{script.title}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        Hook: "{script.scriptStructure?.hook3s}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                        onClick={() => {
                          setGeneratedScript(script);
                          setActiveTab('studio');
                        }}
                      >
                        Mở Xem Kịch Bản
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 0.9rem' }}
                        onClick={() => handleToggleFavorite(script.id, script.status)}
                        title="Đánh dấu yêu thích"
                      >
                        <Bookmark
                          size={16}
                          color={script.status === 'FAVORITE' ? 'var(--tiktok-pink)' : 'currentColor'}
                          fill={script.status === 'FAVORITE' ? 'var(--tiktok-pink)' : 'none'}
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
