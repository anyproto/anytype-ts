import React, { forwardRef, useEffect, useRef } from 'react';
import ApiKeyEditor from 'Component/form/apiKeyEditor';
import { approvalSpaces } from 'Lib/linkApproval';
import * as I from 'Interface';

const PopupApiCreate = forwardRef<{}, I.Popup>(({ param = {}, close, position }, ref) => {
	const nodeRef = useRef<HTMLDivElement>(null);
	const app: I.AppInfo = param.data?.app;
	const spaces = approvalSpaces(U.Menu.getVaultItems(), S.Auth.account?.info?.techSpaceId || '');

	useEffect(() => {
		const observer = new ResizeObserver(() => position?.());
		observer.observe(nodeRef.current);
		return () => observer.disconnect();
	}, [ position ]);

	return (
		<div ref={nodeRef}>
			<ApiKeyEditor key={app?.hash || 'new'} app={app} spaces={spaces} t={translate}
				formatDate={timestamp => U.Date.dateWithFormat(S.Common.dateFormat, timestamp)}
				onCreate={C.AccountLocalLinkCreateApp} onUpdate={C.AccountLocalLinkUpdateApp}
				onCopy={key => U.Common.copyToast(translate('popupSettingsApiKey'), key)} onClose={() => close()} />
		</div>
	);
});

export default PopupApiCreate;
