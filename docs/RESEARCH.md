# Research methodology and limits

## Reusable profiles

Under **Channel research → My profiles**, save your channel username, target audience, offering, goal, topic keywords, excluded keywords and notes from your own TikTok Studio. Profiles are local in the Windows app and shared within a web deployment. Deleting a profile preserves channels and scripts. Notes remain user-supplied observations and are not evidence of another channel's demographics.

## Content comparison

The report samples up to 50 saved videos, ordered by known publication date with unknown dates last. Captions, hashtags and available transcripts form the searchable text. The scraper's captions are not treated as spoken transcripts.

Keywords use case-insensitive and accent-insensitive literal matching with word boundaries. Phrases remain phrases; synonyms are not inferred. Add relevant synonyms and unspaced hashtag variants explicitly. Supply 1–15 comma-separated keywords, each 2–80 characters. Excluded keywords mark videos for review and remove them from suggested experiments.

Content match is `matching videos / videos with readable content × 100`, reported only with at least three readable videos. It measures textual relevance, not the percentage of viewers who belong to your customer segment. A sample below ten readable videos or data older than seven days produces a warning.

## Interest hypotheses and duration groups

Specific hashtags repeated in at least two videos suggest possible interests, with supporting video IDs and median lifetime views. Generic distribution tags such as `fyp`, `viral` and `xuhuong` are excluded. These groups require validation using owner-provided analytics; they do not identify viewer age, gender, location, income or buying intent.

Duration groups cover up to 30 seconds, 31–60 seconds and over 60 seconds. Groups below three videos are marked as small samples. Lifetime views are affected by video age, distribution and selection bias; the report does not establish causal effects of duration or hashtags.

## Measured growth

Each channel refresh records video view counts and collection times. Growth requires two observations of the same video at least one hour apart within the last 30 days. Average views/hour equals the nonnegative count change divided by elapsed hours. Counter resets and insufficient windows are excluded. A single lifetime count is never treated as measured velocity.

Experiments prioritize relevant videos with observed growth, then lifetime views, and offer up to three distinct keyword-led ideas. They are hypotheses to test, not a probability of trending or a platform-wide trend forecast. Compare hooks with the same topic/duration and equal observation periods, using retention, completion and goal actions in your own TikTok Studio.

## Data availability

Public video metrics do not expose another channel's private audience analytics. The app has no retention, completion, conversion or complete TikTok-wide trend dataset. Original captions and profile text retain their source language; report labels, methodology and generated experiment guidance use English. Exported JSON includes evidence, sample details and limitations.

References: [TikTok video object](https://developers.tiktok.com/doc/tiktok-api-v2-video-object/), [TikTok Studio](https://support.tiktok.com/en/using-tiktok/creating-videos/tiktok-studio), and [how TikTok recommends content](https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content).
