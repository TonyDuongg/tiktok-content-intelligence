# HTTP API

Base path: `/api/v1`. Requests and responses use JSON. There is one workspace and no login, token or `/auth/*` API. Desktop instances have their own local database; web visitors share the deployment's workspace.

Responses use `{ "success": true, "message": "Success", "data": ..., "timestamp": "..." }`. Error responses set `success: false` and an English message. Validation errors may include a field/message map in `data`.

## Available endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/categories` | List categories |
| GET | `/workspace/status` | Provider configuration flags, without secrets |
| POST | `/channels/ingest?username=creator&categoryId=1&maxVideos=10` | Fetch and save a public channel and videos |
| GET | `/channels` | List saved channels |
| GET | `/channels/{username}` | Read a saved channel |
| GET | `/channels/{username}/top-videos?limit=10` | Read saved top videos |
| GET | `/channels/{username}/insights?profileId=1` | Compare saved content and observations with a profile |
| GET, POST | `/research-profiles` | List or create audience profiles |
| PUT, DELETE | `/research-profiles/{id}` | Update or delete a profile |
| POST | `/scripts/generate` | Generate and persist a script; HTTP 201 |
| GET | `/scripts/my-scripts` | List workspace scripts |
| GET | `/scripts/{id}` | Read a script and references |
| PATCH | `/scripts/{id}/status?status=FAVORITE` | Set `DRAFT`, `FAVORITE` or `ARCHIVED` |
| POST | `/jobs` | Dispatch an optional configured SQS job; HTTP 202 |
| GET | `/jobs/my-jobs` | List workspace jobs |
| GET | `/jobs/{jobId}` | Read job progress |

## Generate a script

```json
{
  "categoryId": 1,
  "topic": "Three things to check when choosing sunscreen",
  "targetAudience": "Students starting a skincare routine",
  "tone": "Authentic and relatable",
  "requestedDurationSeconds": 90,
  "referenceVideoIds": []
}
```

`topic` is required (maximum 1000 characters); audience allows 300 characters, tone 100, and references up to five IDs. Requested duration is an integer from 15 to 600 seconds, defaulting to 60 when omitted. A missing category is supported; a supplied ID must exist. The response includes title, target audience, `scriptStructure` (hook3s/bodyContent/callToAction), filming/sound cues, hashtags, requested duration, AI-estimated duration, model, status, dates and references. Newly generated text is requested in English; source content is preserved.

## Audience profile

```json
{
  "name": "Skincare for students",
  "ownUsername": "my_channel",
  "targetAudience": "Students with oily skin",
  "offering": "Practical skincare advice",
  "goal": "Saves and consultation requests",
  "keywords": "oily skin, sunscreen, skincare",
  "excludedKeywords": "tobacco",
  "analyticsNotes": "Owner-supplied notes and measurement dates"
}
```

Names and target audiences are required. Usernames accept an optional `@` and 2–24 letters/digits/dots/underscores. Keywords accept 1–15 comma-separated terms of 2–80 characters. See generated OpenAPI schemas for field bounds and optional job payloads. Deleting a profile preserves channel/script data. Insights describe content overlap and observed growth, not private demographics or guaranteed trends; see [methodology](../RESEARCH.md).

## Errors and optional infrastructure

Malformed input returns HTTP 400; missing records 404; unsupported methods 405; unsupported content types 415; upstream failures use the backend's upstream-service error response. Failed/incomplete generations are not stored as samples. Gemini permits 120 seconds before timeout; callers should wait at least 150 seconds and check the library before retrying a disconnected request.

SQS jobs and S3 archiving are optional and disabled by default. The direct generation/research flow does not require AWS. Queue behavior and unfinished filters are documented in [the guide](../CREATOR_STUDIO.md). Interactive OpenAPI documentation is available from the running backend's Swagger UI where enabled.
