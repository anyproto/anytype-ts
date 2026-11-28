import React from 'react';

/** "Created by AI apps" under an API key a connection in Settings ▸ AI apps uses: opens that connection's Manage */
const ApiKeyAiAppsLink = ({ onClick }: { onClick: () => void }) => (
	<div className="keyMeta">
		<button type="button" className="apiKeyAccess" onClick={onClick}>{translate('apiKeyCreatedByAiApps')}</button>
	</div>
);

export default ApiKeyAiAppsLink;
