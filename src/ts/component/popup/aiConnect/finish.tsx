import React from 'react';
import * as I from 'Interface';
import { Loader } from 'Component';
import AiAppIcon from 'Component/util/aiAppIcon';
import type { AiFinishPhase } from 'Lib/aiConnect/controller';
import { tr } from './text';

export type { AiFinishPhase };

export interface AiConnectFinishProps {
	appName: string;
	/** The card, for its bundled mark */
	appId?: string;
	/** The app whose restart loads the settings (ChatGPT for the shared Codex file, V19) */
	restartName?: string;
	icon?: string;
	phase: AiFinishPhase;
	/** The outstanding step, in phase `step` */
	step?: I.AiNextStep;
	/** The adapter's text keys for this app on this computer */
	instructions: I.AiPlan['instructions'];
	canRestart: boolean;
	/** Anytype can open the app on this platform (not on Linux, V25) */
	canOpen?: boolean;
	/** The step was done but Anytype couldn't save that: Try again saves it only (V18) */
	ackFailed?: boolean;
	/** Delivered, but Anytype couldn't save its list yet (V18) */
	unsaved?: boolean;
	/** The wait for an unconfirmed CLI write ran out: Check again (W12) */
	pollStopped?: boolean;
	/** Restart timed out or was refused: the user restarts it; Anytype only re-checks */
	restartFailed?: boolean;
	/** Claude Desktop: the bundle isn't signed in this build */
	bundleSigned?: boolean;
	/** The app (or the bundle) couldn't be opened */
	openFailed?: boolean;
	/** The settings-file route this app offers instead of its own install dialog */
	fileRoute?: 'claude' | 'lmstudio' | null;
	/** The probe after the delivery passed */
	probeOk?: boolean;
	/** Translated error lines (phase `error`) */
	errorLines?: string[];
	/** Manual setup can continue from here (a failed delivery, a stalled one) */
	canManual?: boolean;
	busy: boolean;
	onCancel: () => void;
	onQuitContinue: () => void;
	onContinueSelf: () => void;
	onOpenApp: () => void;
	onRestart: () => void;
	onDone: () => void;
	onLater: () => void;
	onManual: () => void;
	onFileRoute: () => void;
	onRevealBundle: () => void;
	onSaveRetry?: () => void;
	onCheckAgain?: () => void;
	onClose: () => void;
};

/** One remaining step, named, with one primary action (§5.4) */
const AiConnectFinish = (props: AiConnectFinishProps) => {
	const {
		appName, appId, restartName, icon, phase, step, instructions, canRestart, canOpen = true, ackFailed, unsaved, pollStopped, restartFailed, bundleSigned, openFailed, fileRoute,
		probeOk, errorLines, canManual, busy, onCancel, onQuitContinue, onContinueSelf, onOpenApp, onRestart, onDone, onLater, onManual, onFileRoute, onRevealBundle, onSaveRetry,
		onCheckAgain, onClose,
	} = props;
	const restartApp = restartName || appName;

	const instruction = (key: string) => key ? <p className="description">{tr(key, appName)}</p> : null;
	const added = (
		<div className="statusLine">
			<span className="localApiStatus isSuccess" aria-hidden="true" />
			<span>{tr('aiConnectAdded', appName)}</span>
		</div>
	);
	const btn = (text: string, onClick: () => void, color: 'black' | 'blank', primary = false, disabled = false) => {
		const cn = [ 'button', color, (disabled ? 'disabled' : '') ];

		return <button type="button" className={cn.join(' ')} disabled={disabled || busy} data-primary={primary ? 'true' : undefined} onClick={onClick}>{text}</button>;
	};
	const fileRouteButton = fileRoute ? (
		<button type="button" className="linkButton" disabled={busy} onClick={onFileRoute}>
			{translate((fileRoute == 'claude') ? 'aiConnectUseConfigInstead' : 'aiConnectUseFileInsteadLmstudio')}
		</button>
	) : null;
	const manualButton = canManual ? <button type="button" className="linkButton" disabled={busy} onClick={onManual}>{translate('aiConnectSetUpManually')}</button> : null;

	let body: React.ReactNode = null;
	let buttons: React.ReactNode = null;
	let aside: React.ReactNode = null;

	switch (phase) {
		case 'delivering': {
			body = (
				<div className="delivering" role="status">
					<Loader type={I.LoaderType.Loader} className="inline" />
					<p className="description">{tr('aiConnectDelivering', appName)}</p>
				</div>
			);
			break;
		};

		case 'needsQuit': {
			body = instruction('aiConnectNeedsQuit');
			buttons = <>{btn(translate('commonCancel'), onCancel, 'blank')}{btn(tr('aiConnectQuitContinue', appName), onQuitContinue, 'black', true)}</>;
			break;
		};

		case 'needsQuitSelf': {
			body = instruction('aiConnectNeedsQuitSelf');
			buttons = <>{btn(translate('commonCancel'), onCancel, 'blank')}{btn(translate('aiAppsContinue'), onContinueSelf, 'black', true)}</>;
			break;
		};

		case 'installExtension':
		case 'step': {
			const current = (phase == 'installExtension') ? 'confirmInApp' : step;

			if (ackFailed) {
				// Done in the app, not saved here: saving again, never another restart or install (before any step's own controls, W14)
				body = <>{added}<div className="apiKeyError" role="alert"><p>{translate('aiConnectErrorStepSave')}</p></div></>;
				buttons = <>{btn(translate('commonLater'), onLater, 'blank')}{btn(translate('commonRetry'), onDone, 'black', true)}</>;
				break;
			};

			if (current == 'confirmInApp') {
				body = (
					<>
						{instruction(instructions.confirmInApp || 'aiConnectStepConfirm')}
						{(bundleSigned === false) ? <p className="accessNotice">{tr('aiConnectUnsignedNote', appName)}</p> : null}
						{openFailed ? (
							<div className="accessNotice">
								<p>{tr('aiConnectOpenFailed', appName)}</p>
								<button type="button" className="linkButton" disabled={busy} onClick={onRevealBundle}>{translate('aiConnectReveal')}</button>
							</div>
						) : null}
					</>
				);
				aside = fileRouteButton;
				buttons = canOpen
					? <>{btn(translate('commonLater'), onLater, 'blank')}{btn(tr('aiConnectOpenApp', appName), onOpenApp, 'black', true)}</>
					: btn(translate('commonLater'), onLater, 'black', true);
				break;
			};

			if (current == 'restart') {
				const self = !canRestart || restartFailed;
				const key = self ? 'aiConnectStepRestartSelf' : (instructions.restart || 'aiConnectStepRestart');

				body = (
					<>
						{added}
						<p className="description">{tr(key, restartApp)}</p>
						{openFailed ? <p className="accessNotice">{tr('aiConnectErrorReopen', restartApp)}</p> : null}
					</>
				);
				if (!canRestart) {
					buttons = btn(translate('commonDone'), onDone, 'black', true);
				} else
				if (restartFailed) {
					buttons = <>{btn(translate('commonLater'), onLater, 'blank')}{btn(translate('aiConnectRestartedSelf'), onDone, 'black', true)}</>;
				} else {
					buttons = <>{btn(translate('commonLater'), onLater, 'blank')}{btn(tr('aiConnectRestartApp', restartApp), onRestart, 'black', true)}</>;
				};
				break;
			};

			// newSession, reloadServer, toggle
			body = <>{added}{instruction(instructions[current] || '')}</>;
			buttons = btn(translate('commonDone'), onDone, 'black', true);
			break;
		};

		case 'afterRestart': {
			body = <>{added}{instruction(instructions.afterRestart || '')}</>;
			buttons = btn(translate('commonDone'), onClose, 'black', true);
			break;
		};

		case 'added': {
			body = (
				<>
					{added}
					{probeOk ? <p className="description">{translate('aiConnectProbeOk')}</p> : null}
					{instruction(instructions.added || '')}
					<p className="description">{tr('aiConnectTryPrompt', appName)}</p>
				</>
			);
			buttons = <>{canOpen ? btn(tr('aiConnectOpenApp', appName), onOpenApp, 'blank') : null}{btn(translate('commonDone'), onClose, 'black', true)}</>;
			break;
		};

		case 'connected': {
			body = (
				<>
					<div className="statusLine">
						<span className="localApiStatus isSuccess" aria-hidden="true" />
						<span>{translate('aiConnectConnected')}</span>
					</div>
					<p className="description">{tr('aiConnectFirstRequest', appName)}</p>
				</>
			);
			buttons = <>{canOpen ? btn(tr('aiConnectOpenApp', appName), onOpenApp, 'blank') : null}{btn(translate('commonDone'), onClose, 'black', true)}</>;
			break;
		};

		case 'stalled': {
			body = <>{instruction('aiConnectStalled')}{instruction(instructions.stalled || '')}</>;
			aside = <>{manualButton}{fileRouteButton}</>;
			buttons = btn(translate('commonDone'), onClose, 'black', true);
			break;
		};

		case 'unconfirmed': {
			if (pollStopped) {
				// Still not known whether the CLI saved it: the user checks again later (W12)
				body = <p className="description" role="status">{tr('aiConnectUnconfirmedStopped', appName)}</p>;
				buttons = <>{btn(translate('commonClose'), onClose, 'blank')}{btn(translate('aiConnectManualRecheck'), onCheckAgain, 'black', true)}</>;
				break;
			};
			body = (
				<div className="delivering" role="status">
					<Loader type={I.LoaderType.Loader} className="inline" />
					<p className="description">{tr('aiConnectUnconfirmed', appName)}</p>
				</div>
			);
			buttons = btn(translate('commonClose'), onClose, 'black', true);
			break;
		};

		case 'error': {
			body = (
				<div className="apiKeyError" role="alert">
					{(errorLines || []).map((line, i) => <p key={i}>{line}</p>)}
				</div>
			);
			aside = fileRouteButton;
			buttons = canManual
				? <>{btn(translate('commonClose'), onClose, 'blank')}{btn(translate('aiConnectSetUpManually'), onManual, 'black', true)}</>
				: btn(translate('commonClose'), onClose, 'black', true);
			break;
		};
	};

	return (
		<div className="apiKeyEditor aiConnectFinish" aria-busy={busy || (phase == 'delivering')}>
			<div className="aiConnectHead">
				<AiAppIcon appId={appId} name={appName} icon={icon} />
				<h2 className="title">{tr('aiConnectTitle', appName)}</h2>
			</div>
			{body}
			{unsaved ? (
				<div className="accessNotice">
					<p>{translate('aiConnectUnsavedNotice')}</p>
					<div className="noticeActions">
						<button type="button" className="linkButton" disabled={busy} onClick={onSaveRetry}>{translate('aiConnectSaveAgain')}</button>
					</div>
				</div>
			) : null}
			{aside ? <div className="finishLinks">{aside}</div> : null}
			{buttons ? <div className="apiKeyButtons">{buttons}</div> : null}
		</div>
	);
};

export default AiConnectFinish;
