/**
 * Connect to AI apps: the tab's `close-session` handler (app.tsx). A key minted in this tab and not delivered
 * yet is revoked while the tab's session can still do it, then the session closes and main is told the tab
 * is ready to go (X5). Bounded by `flowConfig.closeTimeout`; a committed key is never touched.
 */
import { beforeSessionClose } from './flow';

export const closeTabSession = (tabId: string, currentTabId: string): Promise<void> => beforeSessionClose(() => {
	U.Data.closeSession(() => {
		Renderer.sendIpc('tab-session-closed', tabId || currentTabId);
	});
});
