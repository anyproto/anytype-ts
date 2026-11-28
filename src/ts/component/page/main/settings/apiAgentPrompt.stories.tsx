import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the settings components need the Component barrel loaded first)
import 'Component';
import ApiAgentPrompt from './apiAgentPrompt';

const meta: Meta<typeof ApiAgentPrompt> = {
	title: 'Page/Main/Settings/ApiAgentPrompt',
	component: ApiAgentPrompt,
	tags: ['autodocs'],
	args: { enabled: true, status: { success: true, listenAddr: '127.0.0.1:31009', error: '' } },
	render: (args) => (
		<div className="settingsPageContainer">
			<div className="settingsPage pageSettingsApi">
				<div className="actionItems">
					<ApiAgentPrompt {...args} />
				</div>
			</div>
		</div>
	),
};

export { meta as default };
type Story = StoryObj<typeof meta>;

/** The Local API is on: Copy prompt copies the skill prompt with the live port */
export const Enabled: Story = {};

/** The Local API is off: the button is disabled, with the hint */
export const ApiOff: Story = { args: { enabled: false } };

/** On, but the bind failed (another process owns the port): disabled, with the reason to look above (H12) */
export const BindFailed: Story = { args: { status: { success: false, listenAddr: '', error: 'address in use' } } };
