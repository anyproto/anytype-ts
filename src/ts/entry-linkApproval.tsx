import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import LinkApproval from 'Component/util/linkApproval';
import { approvalThemeClass } from 'Lib/linkApproval';
import type * as I from 'Interface';
import defaultLang from 'json/text.json';

import 'scss/linkApproval.scss';

/** Standalone window: the session renderer owns the account catalog and approval RPC. */
const electron = (window as any).Electron || {};
const langModules = import.meta.glob('../../dist/lib/json/lang/*.json', { eager: true }) as Record<string, any>;

const LinkApprovalWindow = () => {
	const [ payload, setPayload ] = useState<I.LinkApprovalPayload>(null);
	const [ challenge, setChallenge ] = useState('');
	const [ isSent, setIsSent ] = useState(false);
	const [ error, setError ] = useState(false);
	const keyRef = useRef('');
	const sentRef = useRef(false);

	const t = (key: string): string => {
		const mod = langModules[`../../dist/lib/json/lang/${payload?.lang || ''}.json`];
		return (mod?.default || mod || {})[key] || (defaultLang as Record<string, string>)[key] || key;
	};

	useEffect(() => {
		electron.on?.('linkApproval', (e: any, data: I.LinkApprovalPayload) => {
			if (keyRef.current != data.key) {
				keyRef.current = data.key;
				sentRef.current = false;
				setChallenge('');
				setIsSent(false);
				setError(false);
			};
			setPayload(data);
			document.documentElement.className = approvalThemeClass(data.theme);
		});
		electron.on?.('linkApprovalSpaces', (e: any, data: { key: string; spaces: I.LinkApprovalSpace[] }) => {
			setPayload(current => current?.key == data.key ? { ...current, spaces: data.spaces } : current);
		});
		electron.on?.('linkApprovalCode', (e: any, data: { key: string; challenge: string }) => {
			if (data.key == keyRef.current) {
				setChallenge(String(data.challenge || ''));
			};
		});
		electron.on?.('linkApprovalError', (e: any, data: { key: string }) => {
			if (data.key == keyRef.current) {
				sentRef.current = false;
				setIsSent(false);
				setError(true);
			};
		});
		electron.send?.('linkApprovalReady');
		return () => {
			[ 'linkApproval', 'linkApprovalSpaces', 'linkApprovalCode', 'linkApprovalError' ].forEach(event => electron.removeAllListeners?.(event));
		};
	}, []);

	if (!payload) {
		return null;
	};

	const onDecide = (allow: boolean, grant?: I.LinkAppGrant) => {
		if (sentRef.current) {
			return;
		};
		sentRef.current = true;
		setIsSent(true);
		setError(false);
		electron.send?.('linkApprovalDecision', {
			processPath: payload.clientInfo.processPath,
			origin: payload.clientInfo.origin,
			allow,
			grant,
		});
	};

	return <LinkApproval key={payload.key} payload={payload} challenge={challenge} isSent={isSent} error={error} t={t} onDecide={onDecide} />;
};

createRoot(document.getElementById('root')).render(<LinkApprovalWindow />);
