import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the app icon reads the theme store, which needs the Component barrel loaded first)
import 'Component';
import { withPopup, withThemeSync } from '../../../../../.storybook/decorators';
import AiConnectFinish from './finish';
import { noop, PLAN_CHATGPT, PLAN_CLAUDE_DESKTOP, PLAN_CURSOR, PLAN_LMSTUDIO } from './stories.data';

const meta: Meta<typeof AiConnectFinish> = {
	title: 'Popup/AiConnect/Finish',
	component: AiConnectFinish,
	decorators: [ withPopup('AiConnect'), withThemeSync(() => S.Common) ],
	args: {
		appName: 'Cursor',
		appId: 'cursor',
		phase: 'step',
		step: 'restart',
		instructions: PLAN_CURSOR.instructions,
		canRestart: true,
		busy: false,
		onCancel: noop,
		onQuitContinue: noop,
		onContinueSelf: noop,
		onOpenApp: noop,
		onRestart: noop,
		onDone: noop,
		onLater: noop,
		onManual: noop,
		onFileRoute: noop,
		onRevealBundle: noop,
		onClose: noop,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FinishDelivering: Story = { args: { phase: 'delivering', busy: true } };

/** Before any key exists: Claude must be closed for its settings file */
export const FinishNeedsQuit: Story = { args: { appName: 'Claude Desktop', appId: 'claude-desktop', phase: 'needsQuit', instructions: PLAN_CLAUDE_DESKTOP.instructions } };

export const FinishNeedsQuitSelf: Story = { args: { appName: 'Claude Desktop', appId: 'claude-desktop', phase: 'needsQuitSelf', instructions: PLAN_CLAUDE_DESKTOP.instructions } };

/** Claude's install dialog, from an unsigned build, with the settings-file route offered */
export const FinishConfirm: Story = {
	args: { appName: 'Claude Desktop', appId: 'claude-desktop', step: 'confirmInApp', instructions: PLAN_CLAUDE_DESKTOP.instructions, bundleSigned: false, fileRoute: 'claude' },
};

/** The bundle couldn't be opened: Reveal it */
export const FinishConfirmOpenFailed: Story = {
	args: { appName: 'Claude Desktop', appId: 'claude-desktop', step: 'confirmInApp', instructions: PLAN_CLAUDE_DESKTOP.instructions, bundleSigned: true, openFailed: true, fileRoute: 'claude' },
};

/** Cursor: added, one restart left, which Anytype offers */
export const FinishRestart: Story = {};

/** A restart that timed out (an unsaved file in Cursor): the user restarts it */
export const FinishRestartSelf: Story = { args: { restartFailed: true } };

export const FinishNewSession: Story = { args: { appName: 'Claude Code', appId: 'claude-code', step: 'newSession', instructions: { newSession: 'aiConnectStepNewSession' } } };

/** Added and checked: what to try first (ChatGPT's mode note) */
export const FinishAdded: Story = { args: { appName: 'ChatGPT', appId: 'chatgpt', phase: 'added', probeOk: true, instructions: PLAN_CHATGPT.instructions } };

export const FinishAfterRestart: Story = { args: { phase: 'afterRestart' } };

/** LM Studio's dialog wasn't confirmed in 2 minutes */
export const FinishStalled: Story = { args: { appName: 'LM Studio', appId: 'lmstudio', phase: 'stalled', instructions: PLAN_LMSTUDIO.instructions, fileRoute: 'lmstudio', canManual: true } };

/** A delivery that failed, with the new key ready for manual setup */
export const FinishError: Story = {
	args: { appName: 'Claude Code', appId: 'claude-code', phase: 'error', canManual: true, errorLines: [ 'The previous Anytype entry in Claude Code was removed and the new one wasn\'t added. Your earlier key still works: add it back by hand below.' ] },
};

export const FinishUnconfirmed: Story = { args: { appName: 'Claude Code', appId: 'claude-code', phase: 'unconfirmed' } };

/** Installed in the app, but Anytype couldn't save that: Retry saves only, before the install's own buttons (W14) */
export const FinishConfirmAckFailed: Story = {
	args: { appName: 'Claude Desktop', appId: 'claude-desktop', step: 'confirmInApp', instructions: PLAN_CLAUDE_DESKTOP.instructions, ackFailed: true, fileRoute: 'claude' },
};

/** The wait for Claude Code to save the key ran out: Check again (W12) */
export const FinishUnconfirmedStopped: Story = { args: { appName: 'Claude Code', appId: 'claude-code', phase: 'unconfirmed', pollStopped: true, onCheckAgain: noop } };
