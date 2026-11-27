/**
 * The adapter for each card. Unsupported cards have none (the renderer shows their offers).
 */
import type { Adapter, AiAppId } from '../types';
import { claudeDesktop } from './claudeDesktop';
import { claudeCode } from './claudeCode';
import { codex } from './codex';
import { cursor } from './cursor';
import { copilot } from './copilot';
import { lmstudio } from './lmstudio';
import { other } from './other';
import { geminiCli } from './geminiCli';
import { antigravity } from './antigravity';
import { opencode } from './opencode';
import { hermes } from './hermes';

export const ADAPTERS: Adapter[] = [ claudeDesktop, claudeCode, codex, cursor, copilot, lmstudio, geminiCli, antigravity, opencode, hermes, other ];

export const adapterFor = (appId: AiAppId): Adapter | null => ADAPTERS.find(a => a.ids.includes(appId)) || null;
