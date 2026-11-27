# AI app icons: sources and licenses

Product names, logos and brands are property of their respective owners. They are used only to identify apps Anytype can connect to and do not imply endorsement.

The cards using each file are listed in `src/ts/lib/aiConnect/icons.ts` (`AI_APP_ICONS`). Dark-theme variants live in `src/img/theme/dark/icon/aiApp/`. All files were downloaded on 2026-11-27.

What was changed: the shipped files keep only the drawing (the `<svg>` root with its viewBox, the paths and their fills). Titles, ids, editor comments, XML prologs and sizing attributes were removed. An embedded `<style>` or `currentColor` fill became a `fill` attribute. Shapes, proportions and brand colors are unchanged. A monochrome mark's dark variant is the same drawing in white.

| File | Cards | Source | License |
| --- | --- | --- | --- |
| `claude.svg` | Claude Desktop; Claude on the web and mobile | Simple Icons `claude`: https://github.com/simple-icons/simple-icons/blob/7a6199a2ac7d20b529f863b6aceb20d2c6529207/icons/claude.svg (color #D97757 from `data/simple-icons.json`) | CC0 1.0 |
| `claudeCode.svg` | Claude Code | Simple Icons `claudecode`: https://github.com/simple-icons/simple-icons/blob/fd14b05fa2a533f1f0cfa7f297971d82947beeb9/icons/claudecode.svg (color #D97757 from `data/simple-icons.json`) | CC0 1.0 |
| `openai.svg`, dark `openai.svg` | ChatGPT; ChatGPT Classic; ChatGPT on the web | Lobe Icons `openai` (mono): https://github.com/lobehub/lobe-icons/blob/a88f09a2892016a74f4c20f096c167c88f6c19c1/packages/static-svg/icons/openai.svg | MIT (below) |
| `codex.svg`, dark `codex.svg` | Codex | Lobe Icons `codex` (mono): https://github.com/lobehub/lobe-icons/blob/63c800e3db6427b3f156f7b88d426ccb3f7277a1/packages/static-svg/icons/codex.svg | MIT (below) |
| `cursor.svg`, dark `cursor.svg` | Cursor | Official brand asset, https://cursor.com/brand ("Download brand assets", `cursor-brand-assets.zip`): `General Logos/Cube/SVG/CUBE_2D_LIGHT.svg` and `CUBE_2D_DARK.svg` | Official brand asset |
| `copilot.svg`, dark `copilot.svg` | VS Code + GitHub Copilot | GitHub Primer Octicons `copilot-24`: https://github.com/primer/octicons/blob/ab786838f7ec93523b82c2905e37b9e0c8639e43/icons/copilot-24.svg | MIT (below) |
| `lmstudio.svg` | LM Studio | Official brand asset, https://lmstudio.ai/brand ("Logos", app icon in color): https://lmstudio.ai/assets/marketing/brand/download/logos/lm-studio-icon-color.svg. Used under LM Studio's brand usage terms. The file is byte-identical to the download. | Official brand asset |
| `gemini.svg` | Gemini (desktop app) | Simple Icons `googlegemini`: https://github.com/simple-icons/simple-icons/blob/14b69da08cf060ea071138a32a86840a887717ba/icons/googlegemini.svg (color #8E75B2 from `data/simple-icons.json`) | CC0 1.0 |
| `geminiCli.svg`, dark `geminiCli.svg` | Gemini CLI | Lobe Icons `geminicli` (mono): https://github.com/lobehub/lobe-icons/blob/2a1a484e39e3a8423a2746baaf4e0fe64c9d69e9/packages/static-svg/icons/geminicli.svg | MIT (below) |
| `antigravity.svg`, dark `antigravity.svg` | Antigravity | Lobe Icons `antigravity` (mono): https://github.com/lobehub/lobe-icons/blob/63c800e3db6427b3f156f7b88d426ccb3f7277a1/packages/static-svg/icons/antigravity.svg | MIT (below) |
| `opencode.svg`, dark `opencode.svg` | OpenCode | Simple Icons `opencode`: https://github.com/simple-icons/simple-icons/blob/3237c86aca8e54fdf55b6a33de8b64014b1ff47a/icons/opencode.svg | CC0 1.0 |
| `hermes.svg`, dark `hermes.svg` | Hermes | Lobe Icons `hermesagent` (mono): https://github.com/lobehub/lobe-icons/blob/baec1d058d6ef7704ab5f3120f36a17ccdccb6d7/packages/static-svg/icons/hermesagent.svg | MIT (below) |
| `mcp.svg`, dark `mcp.svg` | Other app | Simple Icons `modelcontextprotocol`: https://github.com/simple-icons/simple-icons/blob/f79aa3ef28a87f2334acda835293b7d27dcb92d9/icons/modelcontextprotocol.svg | CC0 1.0 |

Simple Icons is released under CC0 1.0 Universal: https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md

## Lobe Icons (`openai.svg`, `codex.svg`, `geminiCli.svg`, `antigravity.svg`, `hermes.svg`)

https://github.com/lobehub/lobe-icons/blob/master/LICENSE

```
MIT License

Copyright (c) 2023 LobeHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## GitHub Primer Octicons (`copilot.svg`)

https://github.com/primer/octicons/blob/main/LICENSE

```
MIT License

Copyright (c) 2026 GitHub Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
