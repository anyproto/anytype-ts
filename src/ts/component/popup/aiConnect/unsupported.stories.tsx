import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the app icon reads the theme store, which needs the Component barrel loaded first)
import 'Component';
import { withPopup, withThemeSync } from '../../../../../.storybook/decorators';
import AiConnectUnsupported from './unsupported';
import { noop } from './stories.data';

const meta: Meta<typeof AiConnectUnsupported> = {
	title: 'Popup/AiConnect/Unsupported',
	component: AiConnectUnsupported,
	decorators: [ withPopup('AiConnect'), withThemeSync(() => S.Common) ],
	args: {
		appId: 'chatgpt-web',
		appName: 'ChatGPT on the web',
		offers: [ { appId: 'chatgpt', name: 'ChatGPT', installed: false, getUrl: 'https://openai.com/chatgpt/download/' } ],
		onConnect: noop,
		onGet: noop,
		onClose: noop,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/** ChatGPT on the web, the desktop app not installed: Get ChatGPT */
export const Unsupported: Story = {};

/** The desktop app is installed: Connect it instead */
export const UnsupportedInstalled: Story = { args: { offers: [ { appId: 'chatgpt', name: 'ChatGPT', installed: true } ] } };

/** The Gemini app (listed only when installed): Gemini CLI is here, Antigravity isn't */
export const Gemini: Story = {
	args: {
		appId: 'gemini',
		appName: 'Gemini',
		offers: [
			{ appId: 'gemini-cli', name: 'Gemini CLI', installed: true, getUrl: 'https://github.com/google-gemini/gemini-cli' },
			{ appId: 'antigravity', name: 'Antigravity', installed: false, getUrl: 'https://antigravity.google' },
		],
	},
};
