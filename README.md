# TikTok Content Intelligence & AI Script Generator 🚀

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![AWS SDK](https://img.shields.io/badge/AWS%20SDK%20v2-2.29.19-blue.svg)](https://aws.amazon.com/sdk-for-java/)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%20%7C%20Bedrock-blueviolet.svg)](https://aistudio.google.com/)
[![Security](https://img.shields.io/badge/Firewall-agent--redact-purple.svg)](https://github.com/TonyDuongg/agent-redact)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade cloud-native platform built with **Java 21, Spring Boot 3, and AWS** to analyze TikTok competitor channels, identify viral video trends by niche, and automatically produce high-retention 3-part viral video scripts (Hook 3s, Body with visual cues, CTA) using **Generative AI (Google Gemini 3.5 Flash / AWS Bedrock Claude 3.5 Sonnet)**.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TIKTOK CREATOR STUDIO (WEB UI)                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST APIs (Optional JWT)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT 3 ENTERPRISE BACKEND                         │
│                                                                             │
│  [ Spring Security 6 ] ──► [ Auth & User Service (BCrypt + JWT) ]           │
│                                      │                                      │
│  [ Scraper Strategy ]  ──► [ Data Ingestion Service ]                       │
│    (RapidAPI / Mock)                 │                                      │
│                                      ├──► [ AWS S3 Storage ] (Raw Payloads) │
│                                      └──► [ PostgreSQL DB ] (Metrics/Videos)│
│                                                                             │
│  [ Job Dispatcher ]    ──► [ AWS SQS Message Queue ]                        │
│                                      │ (Async Polling)                      │
│                                      ▼                                      │
│                            [ SQS Consumer Worker ]                          │
│                                      │                                      │
│                                      ▼                                      │
│                        [ AI Script Generator Engine ]                       │
│                        (Google Gemini 3.5 Flash / Bedrock)                  │
│                                      │                                      │
│                                      ▼                                      │
│                        [ AiScript & Reference Videos ]                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌──────────────┐              ┌────────────────┐              ┌──────────────┐
│  PostgreSQL  │              │     Redis      │              │  LocalStack  │
│  Port: 5432  │              │   Port: 6379   │              │ (S3 & SQS)   │
│              │              │                │              │  Port: 4566  │
└──────────────┘              └────────────────┘              └──────────────┘
```

---

## 🌟 Key Features

* **Competitor Channel Intelligence:** Ingests TikTok channel profiles and video metrics, automatically calculating standardized **Engagement Rates (ER)** to isolate the top 5% viral benchmark videos.
* **Generative AI Script Engine:** Transforms few-shot viral transcripts into structured 3-part short-video scripts:
  * **3-Second Hook:** High-impact verbal hook designed to maximize initial retention and stop user scrolling.
  * **Body Content:** Scene-by-scene script lines addressing core viewer pain points and solutions.
  * **Visual & Sound Cues:** Practical camera angle recommendations, facial expressions, and B-roll sound guidance.
  * **Call to Action (CTA):** Clear closing engagement drivers (likes, comments, bookmarks, follows).
  * **Trending Hashtags:** Auto-extracted niche-relevant hashtag bundles.
* **Dual-Engine AI Strategy:** Native integration with **Google Gemini (3.5 Flash)** for zero-cost rapid local generation, plus **AWS Bedrock Runtime SDK** (Anthropic Claude 3.5 Sonnet / Amazon Titan) for enterprise deployments.
* **Distributed Cloud Architecture:** AWS SQS asynchronous message queue with Dead Letter Queue (DLQ), automatic user credit refunds on failure, and durable raw scraping JSON storage in Amazon S3.
* **Security & Secret Firewall:** Enforced via [agent-redact](https://github.com/TonyDuongg/agent-redact) across Git pre-commit hooks and GitHub Actions CI pipelines, preventing PII and cloud credentials from ever leaking to remote repositories.
* **Zero-Friction Creator Web Studio:** Modern React + Vite Single Page Application offering instant access with no mandatory login wall required.

---

## 📂 Repository Structure

```
tiktok-content-intelligence/
├── .agentredactrc.json          # Security firewall rules for agent-redact
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI: Scan Secrets, Java 21 Build & Test
├── docker/
│   └── docker-compose.yml       # Local Infra: PostgreSQL, Redis, LocalStack
├── docs/
│   ├── database/
│   │   ├── schema.sql           # Complete PostgreSQL DDL Script with Indexes & Seeds
│   │   └── ERD.md               # Mermaid Entity Relationship Diagram specification
├── backend/
│   ├── pom.xml                  # Maven POM (Spring Boot 3.3.5, AWS SDK v2, JJWT)
│   ├── mvnw / mvnw.cmd          # Cross-platform Maven Wrapper
│   └── src/
│       ├── main/java/com/tiktok/intelligence/
│       │   ├── config/          # Security, OpenAPI, AWS, and DataSeeder configurations
│       │   ├── controller/      # REST API Controllers (Auth, Categories, Channels, Jobs, Scripts)
│       │   ├── domain/          # JPA Entities and Enums
│       │   ├── dto/             # Immutable Java 21 Records (Requests/Responses)
│       │   ├── exception/       # GlobalExceptionHandler and custom exceptions
│       │   ├── repository/      # Spring Data JPA Repositories
│       │   └── service/         # Business Services (Auth, Scraper, S3, SQS Worker, AI Engines)
│       └── test/                # Unit & Integration Test Suite (18/18 Passing)
├── frontend/                    # TikTok Creator Studio Web App (React 19, Vite 8, Lucide)
├── start.bat                    # One-Click Windows launcher script
├── start.ps1                    # One-Click PowerShell launcher script
├── stop.bat                     # Shutdown script
└── package.json                 # Security and build tooling
```

---

## ⚡ Quick Start

### 1. Prerequisites
* **Java 21 LTS** (`java -version`)
* **Node.js 18+** (`node -v`)
* **Docker & Docker Desktop** (Optional: the application supports an auto-fallback in-memory mode if Docker is not active)

### 2. Configure Google Gemini API Key
Obtain a free API key from [Google AI Studio](https://aistudio.google.com/), then add it to your local environment. Create a `.env` file in the project root:
```ini
GEMINI_API_KEY=AIzaSy_your_api_key_here
```
*(Note: `.env` is already configured in `.gitignore` to protect your key from being pushed).*

### 3. One-Click Launch

**On Windows:**
Double-click `start.bat` (or execute via PowerShell: `.\start.ps1`).

The script automatically:
1. Detects Docker status (starts PostgreSQL/Redis/LocalStack if Docker is running, or falls back gracefully to in-memory H2 database).
2. Boots the Spring Boot backend on port `8080`.
3. Boots the React Creator Studio on port `3000`.
4. Opens your default web browser to `http://localhost:3000`.

---

## 📖 API Documentation & Monitoring

* **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **OpenAPI 3 Spec (JSON):** [http://localhost:8080/api-docs](http://localhost:8080/api-docs)
* **Actuator Health Check:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

## 🧪 End-to-End API Walkthrough (cURL)

### 1. User Registration (Optional - Grants 50 Initial Credits)
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "SecurePassword123@",
    "fullName": "Creator Pro"
  }'
```

### 2. User Authentication (Get JWT Bearer Token)
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "SecurePassword123@"
  }'
```

### 3. List Supported Categories / Niches
```bash
curl -X GET http://localhost:8080/api/v1/categories
```

### 4. Ingest Competitor Channel & Compute Viral Engagement Rates
```bash
curl -X POST "http://localhost:8080/api/v1/channels/ingest?username=beauty_queen&categoryId=1&maxVideos=10"
```

### 5. Fetch Channel's Top Performing Viral Videos
```bash
curl -X GET "http://localhost:8080/api/v1/channels/beauty_queen/top-videos?limit=5"
```

### 6. Generate High-Retention AI Video Script Directly
```bash
curl -X POST http://localhost:8080/api/v1/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "topic": "3 Deadly sunscreen mistakes that trigger acne breakouts",
    "targetAudience": "Gen Z oily skin, students and beginners",
    "tone": "Urgent warning, expert authority, compelling",
    "referenceVideoIds": []
  }'
```

### 7. Retrieve Full Script Detail with Visual Cues
```bash
curl -X GET http://localhost:8080/api/v1/scripts/{scriptId}
```

### 8. Mark Script as Favorite
```bash
curl -X PATCH "http://localhost:8080/api/v1/scripts/{scriptId}/status?status=FAVORITE"
```

---

## ⚙️ Configuration & Environment Variables

| Variable Name | Default Value | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/tiktok_intelligence` | PostgreSQL JDBC Connection URL |
| `SPRING_DATASOURCE_USERNAME`| `dev_user` | Database Username |
| `SPRING_DATASOURCE_PASSWORD`| `dev_password` | Database Password |
| `JWT_SECRET_KEY` | Hex 256-bit key | Secret key for signing stateless JWT tokens |
| `AWS_REGION` | `ap-southeast-1` | Target AWS Region |
| `AWS_ENDPOINT` | `http://localhost:4566` | LocalStack Endpoint (Local) or AWS Cloud |
| `AWS_S3_BUCKET` | `tiktok-intelligence-bucket` | S3 bucket storing raw scraped JSON payloads |
| `AWS_SQS_QUEUE_NAME` | `tiktok-job-queue` | Inbound SQS queue for async analysis tasks |
| `AWS_SQS_DLQ_NAME` | `tiktok-job-dlq` | Dead Letter Queue for failed job retries |
| `AI_PROVIDER` | `gemini` | Active AI Engine: `gemini`, `bedrock`, or `mock` |
| `GEMINI_API_KEY` | `""` | Google Gemini API Key from Google AI Studio |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Gemini model name |
| `AI_MODEL_ID` | `anthropic.claude-3-5-sonnet-20240620-v1:0` | AWS Bedrock model identifier |

---

## 🛡️ Security Audit & Pre-Commit Firewall

This project enforces a zero-secrets leak guarantee via `agent-redact`:
```bash
npm run scan:secrets
```
* **Git Pre-commit Hook:** Automatically scans staged files before any commit is finalized.
* **CI Integration:** GitHub Actions runs independent security audits on all PRs and pushes to `main`.

---

## 👥 Authors & License

* **Author:** haiduong2102 ([@TonyDuongg](https://github.com/TonyDuongg))
* **Repository:** [TonyDuongg/tiktok-content-intelligence](https://github.com/TonyDuongg/tiktok-content-intelligence)
* **License:** MIT
