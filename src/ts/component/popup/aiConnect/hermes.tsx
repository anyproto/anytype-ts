import React, { useState } from 'react';
import ChevronDown from 'Component/util/icons/arrow/chevronDown';
import AiAppIcon from 'Component/util/aiAppIcon';
import { HERMES_AGENT_PROMPT, HERMES_GATEWAY_STEPS, HERMES_GATEWAY_URL } from 'Lib/aiConnect/hermes';

export type HermesGuideSection = 'gateway' | 'remote';

export interface AiConnectHermesGuideProps {
	/** Sections shown, in order */
	sections: HermesGuideSection[];
	/** Sections open from the start */
	open?: HermesGuideSection[];
	/** This computer runs Windows: the gateway can't run here, so the local checklist says so instead (H14) */
	windows?: boolean;
	/** One section on its own (the "another machine" view): its body without a disclosure button (H16) */
	standalone?: boolean;
	onCopy: (value: string, label: string) => void;
	onLink: (url: string) => void;
};

const TITLE: Record<HermesGuideSection, string> = {
	gateway: 'aiConnectHermesGatewayTitle',
	remote: 'aiConnectHermesRemoteTitle',
};

/** Hermes' optional guides: copyable commands and the gateway's agent prompt; nothing is written locally */
const AiConnectHermesGuide = ({ sections, open = [], windows, standalone, onCopy, onLink }: AiConnectHermesGuideProps) => {
	const [ opened, setOpened ] = useState<HermesGuideSection[]>(open);

	const toggle = (id: HermesGuideSection) => setOpened(opened.includes(id) ? opened.filter(it => it != id) : opened.concat(id));

	const block = (key: string, text: string, label: string, snippet: string) => (
		<li key={key} className="step">
			<div className="stepHead">
				<span className="stepText">{text}</span>
				<button type="button" className="linkButton" onClick={() => onCopy(snippet, label)}>{translate('commonCopy')}</button>
			</div>
			<div className="snippet">
				<pre aria-label={text} tabIndex={0}><code>{snippet}</code></pre>
			</div>
		</li>
	);

	const steps = () => HERMES_GATEWAY_STEPS.map(step => step.snippet ? block(step.textKey, translate(step.textKey), translate('aiConnectHermesCommand'), step.snippet) : (
		<li key={step.textKey} className="step">
			<div className="stepHead"><span className="stepText">{translate(step.textKey)}</span></div>
		</li>
	));

	const body = (id: HermesGuideSection) => {
		const local = (id == 'gateway');

		return (
			<div id={`aiConnectHermes-${id}`} className="hermesBody">
				<p className="description">{translate(local ? 'aiConnectHermesGatewayText' : 'aiConnectHermesRemoteText')}</p>
				{(local && windows) ? <p className="description">{translate('aiConnectHermesWindows')}</p> : (
					<>
						<p className="description">{translate('aiConnectHermesUnix')}</p>
						<ol className="steps">
							{steps()}
							{block('prompt', translate('aiConnectHermesPromptLabel'), translate('aiConnectHermesPrompt'), HERMES_AGENT_PROMPT)}
						</ol>
						<p className="hermesNote">{translate('aiConnectHermesValidated')}</p>
					</>
				)}
				<button type="button" className="linkButton" onClick={() => onLink(HERMES_GATEWAY_URL)}>{translate('commonLearnMore')}</button>
			</div>
		);
	};

	return (
		<div className="hermesGuide">
			{sections.map(id => {
				const isOpen = standalone || opened.includes(id);
				const cn = [ 'linkButton', 'advancedToggle', (isOpen ? 'isOpen' : '') ];

				return (
					<div key={id} className="hermesSection">
						{standalone ? null : (
							<button type="button" className={cn.join(' ')} aria-expanded={isOpen} aria-controls={`aiConnectHermes-${id}`} onClick={() => toggle(id)}>
								{translate(TITLE[id])}
								<ChevronDown aria-hidden="true" focusable="false" />
							</button>
						)}
						{isOpen ? body(id) : null}
					</div>
				);
			})}
		</div>
	);
};

export default AiConnectHermesGuide;

export interface AiConnectHermesRemoteProps {
	appName: string;
	icon?: string;
	onCopy: (value: string, label: string) => void;
	onLink: (url: string) => void;
	onClose: () => void;
};

/** "Hermes on another machine": the steps and the prompt for that machine; works without Hermes here */
export const AiConnectHermesRemote = ({ appName, icon, onCopy, onLink, onClose }: AiConnectHermesRemoteProps) => (
	<div className="apiKeyEditor aiConnectHermesRemote">
		<div className="aiConnectHead">
			<AiAppIcon appId="hermes" name={appName} icon={icon} />
			<h2 className="title">{translate('aiConnectHermesRemoteTitle')}</h2>
		</div>
		<AiConnectHermesGuide sections={[ 'remote' ]} standalone={true} onCopy={onCopy} onLink={onLink} />
		<div className="apiKeyButtons">
			<button type="button" className="button black" data-primary="true" onClick={onClose}>{translate('commonDone')}</button>
		</div>
	</div>
);
