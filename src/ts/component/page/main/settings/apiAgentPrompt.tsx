import React from 'react';
import * as I from 'Interface';
import { Label } from 'Component';

interface Props {
	/** The Local API is switched on */
	enabled: boolean;
	/** heart's last bind outcome: the prompt names the address that actually listens */
	status: I.JsonApiStatus | null;
};

/** The prompt an agent reads to connect on its own (not translated: it is read by the agent) */
export const agentPrompt = (listenAddr: string): string => {
	return `Read ${J.Url.agentSkill} and use it to connect to Anytype on this computer (Local API at http://${listenAddr}).`;
};

/** The address the API listens on, when the bind succeeded on a valid port */
export const listeningAddr = (status: I.JsonApiStatus | null): string => {
	const addr = String(status?.listenAddr || '');
	const port = Number(addr.split(':').pop());

	return (status?.success && /^[^:\s]+:\d{1,5}$/.test(addr) && (port >= 1) && (port <= 65535)) ? addr : '';
};

/** Local API page: copy a prompt that lets an agent connect itself through the skill (only while the API listens, H12) */
const ApiAgentPrompt = ({ enabled, status }: Props) => {
	const addr = enabled ? listeningAddr(status) : '';
	const ready = !!addr;
	const cn = [ 'button', 'black', 'size28', 'copyPrompt', (ready ? '' : 'disabled') ];

	let hint = '';

	if (!enabled) {
		hint = 'localApiAgentPromptOff';
	} else
	if (!ready) {
		hint = (status && !status.success) ? 'localApiAgentPromptFailed' : 'localApiAgentPromptStarting';
	};

	const onCopy = () => {
		if (ready) {
			U.Common.copyToast('', agentPrompt(addr), translate('localApiAgentPromptCopied'));
		};
	};

	return (
		<div className="item agentPrompt">
			<div className="info">
				<Label className="name" text={translate('localApiAgentPromptTitle')} />
				<Label className="description" text={translate('localApiAgentPromptText')} />
				{hint ? <Label className="hint" text={translate(hint)} /> : ''}
			</div>
			<button type="button" className={cn.join(' ')} disabled={!ready} onClick={onCopy}>{translate('localApiAgentPromptCopy')}</button>
		</div>
	);
};

export default ApiAgentPrompt;
