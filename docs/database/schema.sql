-- ==============================================================================
-- PROJECT: TikTok Content Intelligence & AI Script Generator
-- DATABASE: PostgreSQL (RDS / Aurora / Local)
-- AUTHOR: Antigravity & User
-- CREATED: 2026-11-23
-- ==============================================================================

-- Enable UUID extension for secure, non-enumerable IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & AUTHENTICATION
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER', -- ROLE_USER, ROLE_ADMIN
    credits_balance INT NOT NULL DEFAULT 50,       -- Số credit để chạy cào & sinh kịch bản AI
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. NICHES / CATEGORIES (Ngành hàng / Lĩnh vực: Mỹ phẩm, Thời trang, Công nghệ, v.v.)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,             -- Ví dụ: Mỹ phẩm & Skincare, Thời trang, Công nghệ
    slug VARCHAR(120) NOT NULL UNIQUE,             -- my-pham-skincare
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TIKTOK CHANNELS (Kênh TikTok được theo dõi/cào dữ liệu)
CREATE TABLE tiktok_channels (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    tiktok_username VARCHAR(100) NOT NULL UNIQUE,  -- e.g., 'beauty_tips_vn' (bỏ dấu @)
    sec_uid VARCHAR(255),                          -- TikTok unique security UID
    nickname VARCHAR(150),                         -- Tên hiển thị của kênh
    avatar_url TEXT,
    bio TEXT,
    followers_count BIGINT DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_videos INT DEFAULT 0,
    last_scraped_at TIMESTAMP WITH TIME ZONE,      -- Thời điểm gần nhất hệ thống cào dữ liệu kênh này
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channels_username ON tiktok_channels(tiktok_username);
CREATE INDEX idx_channels_category ON tiktok_channels(category_id);

-- 4. TIKTOK VIDEOS (Dữ liệu bài đăng cào về)
CREATE TABLE tiktok_videos (
    id BIGSERIAL PRIMARY KEY,
    channel_id BIGINT NOT NULL REFERENCES tiktok_channels(id) ON DELETE CASCADE,
    tiktok_video_id VARCHAR(100) NOT NULL UNIQUE,  -- ID video do TikTok cấp
    video_url TEXT NOT NULL,
    cover_image_url TEXT,
    caption TEXT,                                  -- Tiêu đề và caption kèm hashtag
    hashtags TEXT[],                               -- Array các hashtag (vd: ['#reviewmypham', '#skincare'])
    
    -- Engagement Metrics
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    engagement_rate DECIMAL(6, 3) DEFAULT 0.000,   -- ((likes + comments + shares) / views) * 100
    
    -- Audio & Transcript for AI analysis
    duration_seconds INT,
    sound_title VARCHAR(255),
    transcript TEXT,                               -- Lời thoại bóc tách từ video (dùng cho LLM)
    
    video_published_at TIMESTAMP WITH TIME ZONE,   -- Thời gian video được đăng trên TikTok
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_videos_channel ON tiktok_videos(channel_id);
CREATE INDEX idx_videos_engagement ON tiktok_videos(engagement_rate DESC);
CREATE INDEX idx_videos_published_at ON tiktok_videos(video_published_at DESC);

-- 5. ASYNC JOBS (Quản lý các tác vụ bất đồng bộ giao cho SQS & Worker)
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,                 -- 'SCRAPE_CHANNEL', 'ANALYZE_NICHE', 'GENERATE_SCRIPT'
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'QUEUED_SQS', 'PROCESSING', 'COMPLETED', 'FAILED'
    
    -- Input params (Bộ lọc người dùng chọn: niche, keyword, channels, min_views, date_range...)
    filter_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Kết quả lưu trữ Cloud
    s3_raw_data_url TEXT,                          -- S3 URI lưu file raw JSON cào về (ví dụ: s3://my-bucket/jobs/uuid/raw.json)
    error_message TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_user ON analysis_jobs(user_id);
CREATE INDEX idx_jobs_status ON analysis_jobs(status);

-- 6. AI SCRIPTS (Kịch bản video do AI phân tích & sáng tạo)
CREATE TABLE ai_scripts (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID REFERENCES analysis_jobs(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    
    title VARCHAR(255) NOT NULL,                   -- Tiêu đề dự kiến của video
    target_audience VARCHAR(255),                  -- Đối tượng mục tiêu (VD: Phụ nữ 18-25 da dầu mụn)
    
    -- Cấu trúc video chuẩn TikTok viral
    hook_3s TEXT NOT NULL,                         -- 3 giây đầu giữ chân người xem
    body_content TEXT NOT NULL,                    -- Nội dung chính (vấn đề + giải pháp)
    call_to_action TEXT NOT NULL,                  -- Lời kêu gọi (Follow, mua sản phẩm, comment)
    
    visual_and_sound_cues TEXT,                    -- Hướng dẫn góc quay, hiệu ứng chữ, âm thanh nền
    suggested_hashtags TEXT[],
    estimated_duration_seconds INT DEFAULT 30,
    
    ai_model_name VARCHAR(100) DEFAULT 'claude-3-5-sonnet', -- Model LLM đã tạo ra kịch bản
    status VARCHAR(30) DEFAULT 'DRAFT',            -- 'DRAFT', 'FAVORITE', 'EXPORTED'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scripts_user ON ai_scripts(user_id);
CREATE INDEX idx_scripts_category ON ai_scripts(category_id);

-- 7. SCRIPT REFERENCE VIDEOS (Quan hệ N-N: Video mẫu được AI phân tích để tạo kịch bản này)
CREATE TABLE script_reference_videos (
    id BIGSERIAL PRIMARY KEY,
    script_id BIGINT NOT NULL REFERENCES ai_scripts(id) ON DELETE CASCADE,
    video_id BIGINT NOT NULL REFERENCES tiktok_videos(id) ON DELETE CASCADE,
    insight_note TEXT,                             -- Ghi chú lý do học hỏi (VD: "Học theo hook mở đầu đánh vào tâm lý sợ mua hàng giả")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_script_video UNIQUE(script_id, video_id)
);
