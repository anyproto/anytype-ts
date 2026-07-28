import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { approvalLabel, approvalName } from 'Lib/linkApproval';
import * as I from 'Interface';
import defaultLang from 'json/text.json';

import 'scss/linkApproval.scss';

/**
 * Local-link pairing approval window: a separate always-on-top window, so a pairing request can be
 * answered while the app itself is hidden. It has no middleware session of its own — the decision
 * goes to the main process, which relays it to a renderer that owns one, and the minted code comes
 * back the same way.
 */

const electron = (window as any).Electron || {};
const langModules = import.meta.glob('../../dist/lib/json/lang/*.json', { eager: true }) as Record<string, any>;

interface Payload {
	key: string;
	clientInfo: I.LinkClientInfo;
	scope: number;
	theme?: string;
	lang?: string;
};

const LinkApproval = () => {
	const [ payload, setPayload ] = useState<Payload>(null);
	const [ challenge, setChallenge ] = useState('');
	const [ isSent, setIsSent ] = useState(false);

	// The store is not booted in this window, so translations are read straight from the bundled
	// json instead of going through Lib/translate, which depends on it
	const t = (key: string): string => {
		const lang = payload?.lang || '';
		const mod = langModules[`../../dist/lib/json/lang/${lang}.json`];
		const data = (mod?.default || mod || {}) as Record<string, string>;

		return data[key] || (defaultLang as Record<string, string>)[key] || key;
	};

	useEffect(() => {
		electron.on?.('linkApproval', (e: any, data: Payload) => {
			setPayload(data);
			setChallenge('');
			setIsSent(false);

			if (data.theme) {
				document.documentElement.className = data.theme;
			};
		});

		electron.on?.('linkApprovalCode', (e: any, data: { challenge: string }) => {
			setChallenge(String(data.challenge || ''));
		});
	}, []);

	const fill = (text: string, value: string): string => text.replace('%s', value);

	if (!payload) {
		return null;
	};

	const { clientInfo, scope } = payload;
	const name = approvalName(clientInfo);
	const label = approvalLabel(clientInfo) || t('linkApprovalUnknownApp');
	const scopeText = scope == I.LocalApiScope.Limited ? t('linkApprovalScopeLimited') : t('linkApprovalScopeJson');

	const onDecide = (allow: boolean) => {
		if (isSent) {
			return;
		};

		setIsSent(true);
		electron.send?.('linkApprovalDecision', {
			processPath: clientInfo.processPath,
			origin: clientInfo.origin,
			allow,
		});
	};

	if (challenge) {
		const numbers = String(challenge).split('');

		return (
			<div className="linkApproval code">
				<div className="title">{t('linkApprovalCodeTitle')}</div>
				<div className="description">{fill(t('linkApprovalCodeDescription'), label)}</div>
				<div className="challenge">
					{numbers.map((n, i) => <span key={i} className="number">{n}</span>)}
				</div>
			</div>
		);
	};

	// origin and processName/processPath are set by the browser or resolved from the OS, so they are
	// the only attributable parts; name is whatever the caller sent
	const attribution = [ clientInfo.processName, clientInfo.processPath, clientInfo.origin ].filter(it => !!it);

	return (
		<div className="linkApproval request">
			<div className="title">{t('linkApprovalTitle')}</div>

			{name ? <div className="name">{fill(t('linkApprovalName'), name)}</div> : ''}

			<div className="attribution">
				{attribution.length ? attribution.map((it, i) => <div key={i} className="line">{it}</div>) : (
					<div className="line">{t('linkApprovalUnknownApp')}</div>
				)}
			</div>

			<div className="scope">{scopeText}</div>

			<div className="buttons">
				<div className="button blank" onClick={() => onDecide(false)}>{t('linkApprovalDeny')}</div>
				<div className="button black" onClick={() => onDecide(true)}>{t('linkApprovalAllow')}</div>
			</div>

			<div className="note">{t('linkApprovalDenyNote')}</div>
		</div>
	);
};

createRoot(document.getElementById('root')).render(<LinkApproval />);
