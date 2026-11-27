import React, { useId, useState } from 'react';
import * as I from 'Interface';
import AppGrantFields from 'Component/form/appGrantFields';
import AiAppIcon from 'Component/util/aiAppIcon';
import ChevronDown from 'Component/util/icons/arrow/chevronDown';
import { canCopyStep, fillStep, keyText, stepsNeedKey } from 'Lib/aiConnect/steps';
import { apiKeyCreateError } from 'Lib/apiKey';
import { linkApprovalGrant } from 'Lib/linkApprovalGrant';
import { spaceSummary, tr } from './text';

import type { AiManualMode } from 'Lib/aiConnect/controller';

export type { AiManualMode };

export interface AiConnectManualProps {
	appName: string;
	/** The card, for its bundled mark */
	appId?: string;
	icon?: string;
	mode: AiManualMode;
	steps: I.AiStep[];
	planLoading: boolean;
	/** Why there are no steps (a package that can't be started, a place Anytype refuses) */
	reason?: string;
	/** Full over stdio: the local file tools note, beside the command steps (H15) */
	tierHint?: string;
	/** The key of this view: the new one (pending or recorded) */
	apiKey?: string;
	/** restoreOld: the previous key */
	oldKey?: string;
	/** Other app: a name of the user's own */
	withName: boolean;
	name: string;
	grant: I.LinkAppGrant;
	spaces: I.LinkApprovalSpace[];
	notice?: string;
	error?: string;
	/** Claude Desktop: a key of someone else's is stored for it; Create key replaces exactly the one shown (W8) */
	replace?: boolean;
	/** Other app, before a connection exists: the setups this computer offers and the one chosen */
	setups?: ('url' | 'command')[];
	setup?: 'url' | 'command';
	onSetup?: (setup: 'url' | 'command') => void;
	/** Recorded, but Anytype couldn't save its list yet: Save again (W14) */
	unsaved?: boolean;
	/** Recorded, but the check with the new key failed: Retry check (W14) */
	probeFailed?: boolean;
	/** The API isn't listening on the steps' address: the key is withheld, the steps stay redacted (X4) */
	keyHidden?: boolean;
	busy: boolean;
	apiListening: boolean;
	initialSpaces?: boolean;
	onName: (name: string) => void;
	onGrant: (grant: I.LinkAppGrant) => void;
	onCreateKey: () => void;
	onConfirm: () => void;
	/** prerequisite: the instructions again (after installing or updating a CLI) */
	onRecheck?: () => void;
	/** "I've updated" only once the current instructions are on screen (V8) */
	canConfirm?: boolean;
	/** Reveal only for a file main reveals as it is (V25); any other path can be copied */
	canReveal?: (step: I.AiStep) => boolean;
	onSaveRetry?: () => void;
	onRetryCheck?: () => void;
	/** restoreOld: the previous entry is back; the new key is not used (X8) */
	onRestored?: () => void;
	onDone: () => void;
	onCancel: () => void;
	onCopy: (value: string, label: string) => void;
	onReveal: (step: I.AiStep) => void;
};

/** Steps the user follows in the app, the key masked until asked for (§5.6) */
const AiConnectManual = (props: AiConnectManualProps) => {
	const {
		appName, appId, icon, mode, steps, planLoading, reason, tierHint, apiKey, oldKey, withName, name, grant, spaces, notice, error, replace, unsaved, probeFailed, keyHidden, busy,
		setups = [], setup = 'url', onSetup,
		apiListening, initialSpaces, onName, onGrant, onCreateKey, onConfirm, onRecheck, canConfirm = true, canReveal, onSaveRetry, onRetryCheck, onRestored, onDone,
		onCancel, onCopy, onReveal,
	} = props;
	// Each key shows on its own: the previous and the new one (V29)
	const [ visible, setVisible ] = useState<Record<string, boolean>>({});
	// Nothing chosen yet (a new connection): the picker is open, so the choice is one click away
	const [ spacesOpen, setSpacesOpen ] = useState(!!initialSpaces || (!grant.allSpaces && !grant.spaceIds.length));
	const ids = { perm: useId(), name: useId(), spaces: useId(), setup: useId() };
	// Two ways to set up an app Anytype doesn't know: offered while nothing was created yet
	const withSetup = (setups.length > 1) && ((mode == 'create') || (mode == 'prerequisite')) && !!onSetup;
	const needsKey = stepsNeedKey(steps);
	const invalid = apiKeyCreateError(name, grant, 0);
	const canCreate = !busy && !planLoading && !invalid && apiListening && (!!steps.length || !reason);

	const stepText = (step: I.AiStep) => tr(step.textKey, ...(step.args || []));

	const isVisible = (prefix: string) => !!visible[prefix];
	const toggle = (prefix: string) => setVisible({ ...visible, [prefix]: !visible[prefix] });

	const renderSteps = (key: string, prefix: string) => (
		<ol className="steps">
			{steps.map((step, i) => {
				const shown = fillStep(step, key, !isVisible(prefix));
				const revealable = !!step.path && (!canReveal || canReveal(step));
				const copyCn = [ 'linkButton', (canCopyStep(step, key) ? '' : 'disabled') ];

				return (
					<li key={`${prefix}-${i}`} className="step">
						<div className="stepHead">
							<span className="stepText">{stepText(step)}</span>
							{revealable ? <button type="button" className="linkButton" disabled={busy} onClick={() => onReveal(step)}>{translate('aiConnectReveal')}</button> : null}
							{(step.path && !revealable) ? <button type="button" className="linkButton" onClick={() => onCopy(step.path, translate('aiConnectManualPath'))}>{translate('aiConnectManualCopyPath')}</button> : null}
							{step.snippet ? (
								<button
									type="button"
									className={copyCn.join(' ')}
									disabled={!canCopyStep(step, key)}
									onClick={() => onCopy(fillStep(step, key, false), translate('aiConnectManualSnippet'))}
								>
									{translate('commonCopy')}
								</button>
							) : null}
						</div>
						{step.snippet ? (
							<div className="snippet">
								<pre aria-label={stepText(step)} tabIndex={0}><code>{shown}</code></pre>
							</div>
						) : null}
					</li>
				);
			})}
		</ol>
	);

	const keyRow = (key: string, prefix: string) => (needsKey && key) ? (
		<div className="keyRow">
			<span className="keyLabel">{translate('aiConnectManualKey')}</span>
			<code className="keyValue">{keyText(key, isVisible(prefix))}</code>
			<button type="button" className="linkButton" aria-pressed={isVisible(prefix)} onClick={() => toggle(prefix)}>{translate(isVisible(prefix) ? 'aiConnectManualHide' : 'aiConnectManualShow')}</button>
			<button type="button" className="linkButton" onClick={() => onCopy(key, translate('aiConnectManualKey'))}>{translate('commonCopy')}</button>
		</div>
	) : null;

	let primary: React.ReactNode = null;

	switch (mode) {
		case 'create': {
			const cn = [ 'button', 'black', (canCreate ? '' : 'disabled') ];

			const text = busy ? 'aiConnectConnecting' : (replace ? 'aiConnectManualReplaceKey' : 'aiConnectManualCreateKey');

			primary = <button type="button" className={cn.join(' ')} disabled={!canCreate} data-primary="true" onClick={onCreateKey}>{translate(text)}</button>;
			break;
		};
		case 'confirm':
		case 'restoreOld': {
			primary = <button type="button" className="button black" disabled={busy || !apiKey || !canConfirm} data-primary="true" onClick={onConfirm}>{tr('aiConnectManualUpdated', appName)}</button>;
			break;
		};
		case 'prerequisite': {
			primary = <button type="button" className="button black" disabled={busy || planLoading} data-primary="true" onClick={onRecheck}>{translate('aiConnectManualRecheck')}</button>;
			break;
		};
		case 'waiting': {
			// The key may be saved; Anytype is checking. No second Create key until that is known
			primary = <button type="button" className="button black" disabled={busy || !onRecheck} data-primary="true" onClick={onRecheck}>{translate('aiConnectManualRecheck')}</button>;
			break;
		};
		case 'done': {
			primary = <button type="button" className="button black" disabled={busy} data-primary="true" onClick={onDone}>{translate('commonDone')}</button>;
			break;
		};
	};

	const spacesCn = [ 'spaceSummary', (spacesOpen ? 'isOpen' : '') ];

	return (
		<div className="apiKeyEditor aiConnectManual" aria-busy={busy}>
			<div className="aiConnectHead">
				<AiAppIcon appId={appId} name={appName} icon={icon} />
				<h2 className="title">{tr('aiConnectManualTitle', appName)}</h2>
			</div>

			{(mode == 'create') ? (
				<>
					{withName ? (
						<div className="nameField">
							<label htmlFor={ids.name}>{translate('aiConnectName')}</label>
							<input id={ids.name} value={name} disabled={busy} autoComplete="off" onChange={e => onName(e.target.value)} />
						</div>
					) : null}
					<div className="sentenceRow">
						<label htmlFor={ids.perm}>{tr('aiConnectSentenceCan', withName ? (name || appName) : appName)}</label>
						<div className="expirySelect">
							<select id={ids.perm} value={grant.perm} disabled={busy} onChange={e => onGrant({ ...grant, perm: Number(e.target.value) })}>
								<option value={I.LocalApiPermission.ReadWrite}>{translate('aiConnectPermReadWrite')}</option>
								<option value={I.LocalApiPermission.Read}>{translate('aiConnectPermRead')}</option>
							</select>
							<ChevronDown aria-hidden="true" focusable="false" />
						</div>
						<span>{translate('aiConnectSentenceIn')}</span>
						<button type="button" className={spacesCn.join(' ')} aria-expanded={spacesOpen} aria-controls={ids.spaces} disabled={busy} onClick={() => setSpacesOpen(!spacesOpen)}>
							<span>{spaceSummary(grant, spaces)}</span>
							<ChevronDown aria-hidden="true" focusable="false" />
						</button>
					</div>
					{spacesOpen ? (
						<div id={ids.spaces} className="spacesWrap">
							<AppGrantFields spaces={spaces} value={grant} disabled={busy} withPermission={false} t={translate} onChange={v => onGrant(linkApprovalGrant(v.spaceIds, v.allSpaces, grant.perm))} />
						</div>
					) : null}
				</>
			) : null}

			{withSetup ? (
				<>
					<div className="sentenceRow">
						<label htmlFor={ids.setup}>{translate('aiConnectSetupLabel')}</label>
						<div className="expirySelect">
							<select id={ids.setup} value={setup} disabled={busy || planLoading} onChange={e => onSetup((e.target.value == 'command') ? 'command' : 'url')}>
								{setups.map(it => <option key={it} value={it}>{translate((it == 'command') ? 'aiConnectSetupCommand' : 'aiConnectSetupUrl')}</option>)}
							</select>
							<ChevronDown aria-hidden="true" focusable="false" />
						</div>
					</div>
					<p className="description tierHint">{translate((setup == 'command') ? 'aiConnectSetupCommandHint' : 'aiConnectSetupUrlHint')}</p>
				</>
			) : null}

			{reason ? <p className="accessNotice">{reason}</p> : null}
			{(tierHint && steps.length) ? <p className="description tierHint">{tierHint}</p> : null}
			{(replace && (mode == 'create')) ? <p className="accessNotice">{tr('aiConnectReplaceNotice', appName)}</p> : null}

			{(mode == 'restoreOld') ? (
				<>
					<h3 className="blockTitle">{translate('aiConnectManualRestoreOld')}</h3>
					{renderSteps(oldKey || '', 'old')}
					{keyRow(oldKey || '', 'old')}
					{onRestored ? (
						<div className="restoreActions">
							<button type="button" className="button blank size28" disabled={busy} onClick={onRestored}>{translate('aiConnectManualRestored')}</button>
						</div>
					) : null}
					<h3 className="blockTitle">{translate('aiConnectManualUseNew')}</h3>
					{renderSteps(apiKey || '', 'new')}
					{keyRow(apiKey || '', 'new')}
				</>
			) : (
				<>
					{steps.length ? renderSteps(apiKey || '', 'step') : null}
					{keyRow(apiKey || '', 'step')}
				</>
			)}

			{keyHidden ? <p className="accessNotice" role="status">{translate('aiConnectManualApiOff')}</p> : null}
			{notice ? <p className="accessNotice" role="status">{notice}</p> : null}
			{unsaved ? (
				<div className="accessNotice">
					<p>{translate('aiConnectUnsavedNotice')}</p>
					<div className="noticeActions">
						<button type="button" className="linkButton" disabled={busy} onClick={onSaveRetry}>{translate('aiConnectSaveAgain')}</button>
					</div>
				</div>
			) : null}
			{probeFailed ? (
				<div className="accessNotice">
					<p>{translate('aiConnectErrorProbe')}</p>
					<div className="noticeActions">
						<button type="button" className="linkButton" disabled={busy || !apiListening} onClick={onRetryCheck}>{translate('aiAppsRetryCheck')}</button>
					</div>
				</div>
			) : null}
			{(error || (withName && (invalid == 'apiKeyNameTooLong'))) ? <div className="apiKeyError" role="alert">{error || translate(invalid)}</div> : null}

			<div className="apiKeyButtons">
				{(mode != 'done') ? <button type="button" className="button blank" disabled={busy} onClick={onCancel}>{translate('commonCancel')}</button> : null}
				{primary}
			</div>
		</div>
	);
};

export default AiConnectManual;
