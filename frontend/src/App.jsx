import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Video,
  Copy,
  Check,
  Bookmark,
  Search,
  Zap,
  Clock,
  Film,
  User,
  LogOut,
  LogIn,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api, getAuthToken, setAuthToken } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAuthToken());
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState('creator@example.com');
  const [authPassword, setAuthPassword] = useState('SecurePassword123@');
  const [authFullName, setAuthFullName] = useState('Creator Pro');
  const [authLoading, setAuthLoading] = useState(false);

  // Channel Research State
  const [searchUsername, setSearchUsername] = useState('beauty_queen');
  const [channelData, setChannelData] = useState(null);
  const [topVideos, setTopVideos] = useState([]);
  const [channelLoading, setChannelLoading] = useState(false);

  // Script Studio State
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [scriptTopic, setScriptTopic] = useState('3 Sai lầm chết người khi thoa kem chống nắng');
  const [targetAudience, setTargetAudience] = useState('Gen Z da dầu mụn, học sinh sinh viên');
  const [scriptTone, setScriptTone] = useState('Cảnh báo, chuyên gia, lôi cuốn');
  const [referenceVideoIds, setReferenceVideoIds] = useState([]);
  const [generatedScript, setGeneratedScript] = useState(null);
  const [studioLoading, setStudioLoading] = useState(false);

  // My Scripts State
  const [myScripts, setMyScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Initial Data Load
  useEffect(() => {
    loadCategories();
    if (token) {
      loadUserProfile();
    }
  }, [token]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res?.data) {
        setCategories(res.data);
        if (res.data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(res.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải danh mục:', err);
    }
  };

  const loadUserProfile = async () => {
    try {
      const res = await api.getMe();
      if (res?.data) {
        setUser(res.data);
      }
    } catch (err) {
      // Token might be expired
      setAuthToken('');
      setToken('');
      setUser(null);
    }
  };

  // Handle Auth
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      let res;
      if (isLoginMode) {
        res = await api.login(authEmail, authPassword);
      } else {
        res = await api.register(authEmail, authPassword, authFullName);
      }

      if (res?.data?.accessToken) {
        setAuthToken(res.data.accessToken);
        setToken(res.data.accessToken);
        setShowAuthModal(false);
        showToastMsg(isLoginMode ? 'Đăng nhập thành công!' : 'Đăng ký tài khoản thành công!');
        await loadUserProfile();
      }
    } catch (err) {
      alert(err.message || 'Lỗi xác thực');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setToken('');
    setUser(null);
    showToastMsg('Đã đăng xuất tài khoản');
  };

  // Handle Channel Ingestion & Search
  const handleInspectChannel = async () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    if (!searchUsername.trim()) return;

    setChannelLoading(true);
    try {
      const cleanUser = searchUsername.replace('@', '').trim();
      const res = await api.ingestChannel(cleanUser, selectedCategoryId || null, 10);
      setChannelData(res.data);

      // Load top viral videos
      const videoRes = await api.getTopVideos(cleanUser, 10);
      setTopVideos(videoRes.data || []);
      showToastMsg(`Đã thu thập dữ liệu kênh @${cleanUser}`);
      await loadUserProfile(); // Refresh credit
    } catch (err) {
      alert(err.message || 'Không thể cào dữ liệu kênh');
    } finally {
      setChannelLoading(false);
    }
  };

  // Handle Script Generation
  const handleGenerateScript = async () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    if (!scriptTopic.trim()) {
      alert('Vui lòng nhập chủ đề kịch bản muốn làm');
      return;
    }

    setStudioLoading(true);
    try {
      const payload = {
        categoryId: selectedCategoryId ? Number(selectedCategoryId) : null,
        topic: scriptTopic.trim(),
        targetAudience: targetAudience.trim() || 'Người dùng TikTok Việt Nam',
        tone: scriptTone.trim() || 'Hài hước, lôi cuốn',
        referenceVideoIds: referenceVideoIds
      };

      const res = await api.generateDirectScript(payload);
      setGeneratedScript(res.data);
      showToastMsg('✨ AI đã tạo kịch bản viral thành công!');
      await loadUserProfile(); // Refresh credit
    } catch (err) {
      alert(err.message || 'Lỗi khi sinh kịch bản');
    } finally {
      setStudioLoading(false);
    }
  };

  // Copy Full Script to Clipboard
  const handleCopyScript = () => {
    if (!generatedScript) return;
    const fullText = `🎬 TIÊU ĐỀ: ${generatedScript.title}
🎯 ĐỐI TƯỢNG: ${generatedScript.targetAudience}
⏱️ THỜI LƯỢNG ƯỚC TÍNH: ~${generatedScript.scriptStructure?.estimatedDurationSeconds || 30}s

[1] HOOK 3S ĐẦU (GIỮ CHÂN NGƯỜI XEM):
${generatedScript.scriptStructure?.hook3s}

[2] NỘI DUNG THÂN BÀI (BODY):
${generatedScript.scriptStructure?.bodyContent}

[3] CHỈ DẪN QUAY & VISUAL CUES:
${generatedScript.visualAndSoundCues}

[4] KÊU GỌI HÀNH ĐỘNG (CTA):
${generatedScript.scriptStructure?.callToAction}

[5] HASHTAGS XU HƯỚNG:
${(generatedScript.suggestedHashtags || []).join(' ')}
    `;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    showToastMsg('Đã sao chép toàn bộ kịch bản vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Toggle Favorite Status
  const handleToggleFavorite = async (scriptId, currentStatus) => {
    if (!token) return;
    try {
      const newStatus = currentStatus === 'FAVORITE' ? 'DRAFT' : 'FAVORITE';
      const res = await api.updateScriptStatus(scriptId, newStatus);
      if (generatedScript && generatedScript.id === scriptId) {
        setGeneratedScript(res.data);
      }
      showToastMsg(newStatus === 'FAVORITE' ? 'Đã thêm vào Kịch bản yêu thích ⭐' : 'Đã bỏ yêu thích');
      if (activeTab === 'history') {
        loadMyScripts();
      }
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  // Load User Scripts
  const loadMyScripts = async () => {
    if (!token) return;
    setScriptsLoading(true);
    try {
      const res = await api.getMyScripts();
      setMyScripts(res.data || []);
    } catch (err) {
      console.warn('Lỗi tải kịch bản:', err);
    } finally {
      setScriptsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && token) {
      loadMyScripts();
    }
  }, [activeTab, token]);

  // Use a viral video as inspiration for script
  const handleInspireFromVideo = (video) => {
    setScriptTopic(`Mô phỏng trend: ${video.caption?.slice(0, 70) || 'Video triệu view'}`);
    setReferenceVideoIds([video.id]);
    setActiveTab('studio');
    showToastMsg('Đã nạp video viral vào Xưởng Kịch Bản!');
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <Zap size={18} color="var(--tiktok-cyan)" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <a href="#" className="logo-area">
            <div className="logo-icon">
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                TikTok <span className="gradient-text">Intelligence AI</span>
              </h1>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Nghiên cứu đối thủ & Xưởng kịch bản viral 3 hồi
              </p>
            </div>
          </a>

          {/* Nav Tabs */}
          <nav className="nav-tabs">
            <button
              className={`tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('studio')}
            >
              <Sparkles size={16} />
              Xưởng Kịch Bản AI
            </button>
            <button
              className={`tab-btn ${activeTab === 'channel' ? 'active' : ''}`}
              onClick={() => setActiveTab('channel')}
            >
              <TrendingUp size={16} />
              Nghiên cứu Kênh
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Bookmark size={16} />
              Kho Kịch Bản ({myScripts.length})
            </button>
          </nav>

          {/* User Auth Info */}
          <div className="user-badge">
            {user ? (
              <>
                <div className="credit-pill">
                  <Zap size={14} />
                  <span>{user.creditBalance} Credits</span>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.fullName}</span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem', borderRadius: '50%' }}
                    onClick={handleLogout}
                    title="Đăng xuất"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
                <LogIn size={16} />
                Đăng Nhập / Đăng Ký
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-container">
        {/* TAB 1: SCRIPT STUDIO */}
        {activeTab === 'studio' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '2rem' }}>
            {/* Form Left */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Sparkles size={20} color="var(--tiktok-pink)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Thiết Lập Kịch Bản</h2>
              </div>

              <div className="form-group">
                <label className="form-label">Ngành hàng / Niche TikTok</label>
                <select
                  className="form-select"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Chủ đề video / Ý tưởng muốn làm *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={scriptTopic}
                  onChange={(e) => setScriptTopic(e.target.value)}
                  placeholder="VD: 3 Lỗi dùng kem chống nắng khiến da nổi mụn nhiều hơn..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Đối tượng mục tiêu (Target Audience)</label>
                <input
                  type="text"
                  className="form-input"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="VD: Gen Z, Dân văn phòng, Người mới bắt đầu..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tone giọng truyền tải (Tone of Voice)</label>
                <input
                  type="text"
                  className="form-input"
                  value={scriptTone}
                  onChange={(e) => setScriptTone(e.target.value)}
                  placeholder="VD: Chuyên gia, Hài hước, Cảnh báo giật gân, Kể chuyện..."
                />
              </div>

              {referenceVideoIds.length > 0 && (
                <div style={{ padding: '0.75rem', background: 'rgba(37, 244, 238, 0.1)', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
                  <span>🎯 Đã gắn <strong>{referenceVideoIds.length}</strong> video viral làm mẫu tham khảo.</span>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--tiktok-pink)', marginLeft: '8px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => setReferenceVideoIds([])}
                  >
                    Xóa
                  </button>
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
                onClick={handleGenerateScript}
                disabled={studioLoading}
              >
                {studioLoading ? (
                  <span>Đang triệu hồi AI viết kịch bản...</span>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Sinh Kịch Bản Viral 3 Hồi
                  </>
                )}
              </button>

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <Zap size={14} color="var(--tiktok-cyan)" />
                <span>Mỗi kịch bản sử dụng mô hình Google Gemini 1.5 Flash (hoặc Bedrock).</span>
              </div>
            </div>

            {/* Script Result Right */}
            <div>
              {generatedScript ? (
                <div className="script-card">
                  {/* Script Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span className="badge badge-model">{generatedScript.aiModelUsed || 'Google Gemini'}</span>
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                          Ước tính: ~{generatedScript.scriptStructure?.estimatedDurationSeconds || 30}s
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                        {generatedScript.title}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={handleCopyScript}
                        style={{ padding: '0.5rem 0.9rem' }}
                      >
                        {copied ? <Check size={16} color="var(--tiktok-cyan)" /> : <Copy size={16} />}
                        {copied ? 'Đã sao chép!' : 'Copy Kịch Bản'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleToggleFavorite(generatedScript.id, generatedScript.status)}
                        style={{ padding: '0.5rem 0.9rem' }}
                        title="Đánh dấu yêu thích"
                      >
                        <Bookmark
                          size={16}
                          color={generatedScript.status === 'FAVORITE' ? 'var(--tiktok-pink)' : 'currentColor'}
                          fill={generatedScript.status === 'FAVORITE' ? 'var(--tiktok-pink)' : 'none'}
                        />
                        {generatedScript.status === 'FAVORITE' ? 'Đã thích' : 'Lưu'}
                      </button>
                    </div>
                  </div>

                  {/* Hook 3s Section */}
                  <div className="hook-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--tiktok-pink)', fontWeight: 700, fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                      <Zap size={16} />
                      PHẦN 1: HOOK 3 GIÂY ĐẦU (GIỮ CHÂN NGƯỜI XEM)
                    </div>
                    <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', fontStyle: 'italic' }}>
                      "{generatedScript.scriptStructure?.hook3s}"
                    </p>
                  </div>

                  {/* Body Section */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--tiktok-cyan)', fontSize: '0.85rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Film size={16} />
                      PHẦN 2: NỘI DUNG THÂN BÀI (BODY CONTENT)
                    </div>
                    <div style={{ whiteSpace: 'pre-line', fontSize: '0.975rem', lineHeight: 1.7, background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '10px' }}>
                      {generatedScript.scriptStructure?.bodyContent}
                    </div>
                  </div>

                  {/* Visual Cues */}
                  {generatedScript.visualAndSoundCues && (
                    <div className="cues-box">
                      <div style={{ fontWeight: 700, color: 'var(--tiktok-cyan)', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                        🎬 CHỈ DẪN QUAY & VISUAL CUES (GÓC MÁY / HÀNH ĐỘNG / ÂM THANH):
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {generatedScript.visualAndSoundCues}
                      </p>
                    </div>
                  )}

                  {/* Call to Action */}
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', borderLeft: '3px solid #fff' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      PHẦN 3: KÊU GỌI HÀNH ĐỘNG (CALL TO ACTION)
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {generatedScript.scriptStructure?.callToAction}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {generatedScript.suggestedHashtags?.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem', fontWeight: 600 }}>
                        GỢI Ý HASHTAGS XU HƯỚNG:
                      </div>
                      <div>
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
                <div
                  className="glass-panel"
                  style={{
                    height: '100%',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Sparkles size={48} color="rgba(254, 44, 85, 0.4)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Xưởng Kịch Bản Đang Chờ Bạn
                  </h3>
                  <p style={{ maxWidth: '450px', fontSize: '0.925rem' }}>
                    Điền chủ đề và ấn <strong>"Sinh Kịch Bản Viral 3 Hồi"</strong> để AI phân tích cấu trúc video ngắn và viết kịch bản chi tiết kèm góc máy cho bạn!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CHANNEL & VIDEO RESEARCH */}
        {activeTab === 'channel' && (
          <div>
            {/* Search Box */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
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
                    placeholder="Nhập username kênh TikTok đối thủ (VD: beauty_queen, chubebe...)"
                    onKeyDown={(e) => e.key === 'Enter' && handleInspectChannel()}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleInspectChannel}
                  disabled={channelLoading}
                >
                  {channelLoading ? 'Đang phân tích...' : 'Cào & Phân Tích Kênh'}
                </button>
              </div>
            </div>

            {/* Channel Info Card */}
            {channelData && (
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
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
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                        {(channelData.followerCount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>FOLLOWERS</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tiktok-pink)' }}>
                        {(channelData.likeCount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>LƯỢT THÍCH</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tiktok-cyan)' }}>
                        {channelData.averageEngagementRate || '0.00'}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>ENGAGEMENT RATE</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Viral Videos */}
            {topVideos.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Video size={18} color="var(--tiktok-pink)" />
                  Top Video Viral Nhất Của Kênh (Sắp xếp theo Engagement Rate)
                </h3>

                <div className="video-grid">
                  {topVideos.map((vid) => (
                    <div key={vid.id} className="video-card">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span className="badge" style={{ background: 'rgba(37, 244, 238, 0.15)', color: 'var(--tiktok-cyan)' }}>
                            ER: {vid.engagementRate || '0'}%
                          </span>
                          <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                            👁️ {(vid.viewCount || 0).toLocaleString()} views
                          </span>
                        </div>
                        <p style={{ fontSize: '0.925rem', fontWeight: 600, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {vid.caption || 'Video không có caption'}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ❤️ {(vid.likeCount || 0).toLocaleString()} • 💬 {(vid.commentCount || 0).toLocaleString()}
                        </span>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleInspireFromVideo(vid)}
                        >
                          Lấy ý tưởng
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

        {/* TAB 3: MY SCRIPTS */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Kho Kịch Bản Của Tôi</h2>
              <button className="btn btn-secondary" onClick={loadMyScripts} disabled={scriptsLoading}>
                {scriptsLoading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>

            {myScripts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bookmark size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Chưa có kịch bản nào được lưu</h3>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Hãy vào tab <strong>Xưởng Kịch Bản AI</strong> để bắt đầu tạo kịch bản đầu tiên cho kênh của bạn!
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {myScripts.map((script) => (
                  <div key={script.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span className={`badge ${script.status === 'FAVORITE' ? 'badge-model' : ''}`}>
                          {script.status}
                        </span>
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                          ~{script.scriptStructure?.estimatedDurationSeconds || 30}s
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{script.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                        Hook: "{script.scriptStructure?.hook3s}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setGeneratedScript(script);
                          setActiveTab('studio');
                        }}
                      >
                        Mở Xem Chi Tiết
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleToggleFavorite(script.id, script.status)}
                        title="Yêu thích"
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

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
              {isLoginMode ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản Mới'}
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>
              {isLoginMode
                ? 'Đăng nhập để sử dụng tính năng cào kênh và sinh kịch bản'
                : 'Đăng ký ngay để nhận miễn phí 50 Credits khởi đầu'}
            </p>

            <form onSubmit={handleAuthSubmit}>
              {!isLoginMode && (
                <div className="form-group">
                  <label className="form-label">Họ và tên</label>
                  <input
                    type="text"
                    className="form-input"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input
                  type="password"
                  className="form-input"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
                disabled={authLoading}
              >
                {authLoading ? 'Đang xử lý...' : isLoginMode ? 'Đăng Nhập' : 'Tạo Tài Khoản & Nhận 50 Credits'}
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem' }}>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--tiktok-cyan)', cursor: 'pointer' }}
                onClick={() => setIsLoginMode(!isLoginMode)}
              >
                {isLoginMode ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
              </button>
            </div>

            <button
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
              onClick={() => setShowAuthModal(false)}
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
