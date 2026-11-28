import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// The app's modules in their usual order (the settings components need the Component barrel loaded first)
import 'Component';
import ApiKeyAiAppsLink from './apiKeyAiAppsLink';

const meta: Meta<typeof ApiKeyAiAppsLink> = {
	title: 'Page/Main/Settings/ApiKeyAiAppsLink',
	component: ApiKeyAiAppsLink,
	tags: ['autodocs'],
	args: { onClick: () => {} },
};

export { meta as default };
type Story = StoryObj<typeof meta>;

/** A key row on the API Keys page whose key a connection in Settings ▸ AI apps uses */
export const InKeyRow: Story = {
	render: (args) => (
		<div className="settingsPageContainer">
			<div className="settingsPage pageSettingsApi">
				<div className="items">
					<div className="row isHead">
						<div className="col colSpace">{translate('commonName')}</div>
						<div className="col colKey">{translate('popupSettingsApiKey')}</div>
						<div className="col colDate">{translate('popupSettingsApiCreated')}</div>
						<div className="col colExpire">{translate('apiKeyExpires')}</div>
						<div className="col colAccess">{translate('linkApprovalPermission')}</div>
						<div className="col colMore" />
					</div>
					<div className="row">
						<div className="col colObject">
							<div className="appDetails">
								<div className="name">Cursor</div>
								<div className="keyMeta">{translate('apiKeyVersion2')}</div>
								<ApiKeyAiAppsLink onClick={args.onClick || (() => {})} />
							</div>
						</div>
						<div className="col colKey">zhS…k3=</div>
						<div className="col colDate">Nov 27</div>
						<div className="col colExpire">{translate('apiKeyNeverExpires')}</div>
						<div className="col colAccess">
							<button type="button" className="apiKeyAccess">
								<span>{translate('linkApprovalReadWrite')}</span>
								<span className="keyMeta">{translate('apiKeyAllSpaces')}</span>
							</button>
						</div>
						<div className="col colMore" />
					</div>
				</div>
			</div>
		</div>
	),
};
