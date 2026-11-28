import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the app icon reads the theme store, which needs the Component barrel loaded first)
import 'Component';
import { withPopup, withThemeSync } from '../../../../../.storybook/decorators';
import AiConnectHermesGuide, { AiConnectHermesRemote } from './hermes';
import { noop } from './stories.data';

const meta: Meta<typeof AiConnectHermesGuide> = {
	title: 'Popup/AiConnect/Hermes',
	component: AiConnectHermesGuide,
	decorators: [ withPopup('AiConnect'), withThemeSync(() => S.Common) ],
	argTypes: { onCopy: { action: 'copy' }, onLink: { action: 'link' } },
	args: { sections: [ 'gateway', 'remote' ], onCopy: noop, onLink: noop },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Under the Hermes sheet: both guides collapsed */
export const Collapsed: Story = {};

/** "Chat with Hermes in Anytype" open: the checklist with its commands and the agent prompt */
export const GatewayOpen: Story = { args: { open: [ 'gateway' ] } };

/** "Hermes on another machine", from the gallery's "Set up on another machine" (Hermes not needed here) */
export const Remote: StoryObj<typeof AiConnectHermesRemote> = {
	render: () => <AiConnectHermesRemote appName="Hermes" onCopy={noop} onLink={noop} onClose={noop} />,
};
