# Creator Studio interface

This is a working tool for researching TikTok channels, preparing a video brief and reading a generated script. The user selected a light interface with clear dark text and few accents.

## Typography

One family: Be Vietnam Pro, self-hosted as WOFF2 in `frontend/public/fonts`, weights 400, 500 and 600. Its OFL license ships alongside the files. Interface copy is 16px, secondary text 14px, field labels 15px and script prose 17px with 1.9 line height. Headings use 20–28px. Small type has no negative tracking. All values are expressed in rem through role tokens.

## Layout

The page uses a pale neutral canvas and white working surfaces. A 400px brief column supports a flexible reading column; both stack below 900px. The reading surface leads once a script exists. Optional references are collapsed until needed. The library uses rows rather than repeated cards. Spacing follows 4/8/12/16/20/24/32/40/48px.

Duration is a native select with common presets; custom seconds/minutes are revealed only when needed. Generated speech is broken into timed paragraphs. Filming and audio notes use a disclosure so long scripts keep speech as the primary reading task. The requested duration and the AI estimate remain distinct in the preview, library and text export.

## Color and interaction

Primary text is `#20242c`, secondary `#4b5360`, canvas `#f6f7f8`, surface white. The rose accent `#9f1f3b` is reserved for primary actions and selection. Navigation and content sections use neutral colors. Status always includes readable text. Focus uses a blue outline; touch targets are at least 44px. No decorative gradients, glows, promotional badges or emoji icons.

## Product truth

Normal operation uses Gemini or Bedrock and RapidAPI. Failed generation must display an error and must never substitute template text. Empty states describe the next action; they contain no fabricated results. Shared-library behavior remains explicit. Runtime configuration details stay in operational documentation, except actionable errors.

The product is a tool with one shared workspace and no registration, login, user session or account UI. Browser tokens must not be read or sent, and legacy Authorization headers must not block tool workflows or select a different library. Provider API keys remain backend configuration.
