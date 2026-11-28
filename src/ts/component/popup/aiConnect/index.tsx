import React, { forwardRef, useEffect, useRef, useSyncExternalStore } from 'react';
import { observer } from 'mobx-react-lite';
import * as I from 'Interface';
import { getCatalogItem } from 'Lib/aiConnect/catalog';
import { AiConnectController, isErrorMsg, type AiConnectPopupData, type AiMsg } from 'Lib/aiConnect/controller';
import * as flow from 'Lib/aiConnect/flow';
import { movedConnection } from 'Lib/aiConnect/gallery';
import { canOpenApp } from 'Lib/aiConnect/steps';
import { approvalSpaces } from 'Lib/linkApproval';
import AiConnectForm from './form';
import AiConnectFinish from './finish';
import AiConnectManage, { AiConnectResult } from './manage';
import AiConnectManual from './manual';
import AiConnectUnsupported from './unsupported';
import AiConnectHermesGuide, { AiConnectHermesRemote } from './hermes';
import { cardName, connectionName, errorText, manualReason, planReason, tierNote, tr } from './text';

export type { AiConnectPopupData };

const POPUP_ID = 'aiConnect';
const FOCUSABLE = 'button:not(:disabled), select:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]';

const formatDate = (t: number): string => U.Date.dateWithFormat(S.Common.dateFormat, t);

/**
 * One connect / manage / manual flow, driven by its controller. Remounted when the popup is pointed at
 * another card or record, so every flow ends in one unmount, where its pending key is released (§5.2).
 */
const PopupAiConnectFlow = observer(({ data, close, position }: { data: AiConnectPopupData; close: () => void; position?: () => void }) => {
	const appId = data.appId;
	const item = getCatalogItem(appId);
	const appName = cardName(appId);
	const nodeRef = useRef<HTMLDivElement>(null);
	const invoker = useRef<Element | null>((typeof document != 'undefined') ? document.activeElement : null);
	const ctrlRef = useRef<AiConnectController>(null);

	if (!ctrlRef.current) {
		ctrlRef.current = new AiConnectController(data, {
			close: () => close(),
			toast: (msg: AiMsg) => Preview.toastShow({ text: msgText(msg) }),
		}, appName);
	};

	const ctrl = ctrlRef.current;
	const state = useSyncExternalStore(ctrl.subscribe, ctrl.get);
	const connection = state.connectionId ? S.AiConnect.getById(state.connectionId) : null;
	const displayName = connection ? connectionName(connection) : appName;
	const icon = S.AiConnect.icon(appId);
	const spaces = approvalSpaces(U.Menu.getVaultItems(), S.Auth.account?.info?.techSpaceId || '');
	const listening = (flow.apiState() == 'listening');
	const moved = movedConnection(appId, S.AiConnect.detectionMap, S.AiConnect.connectionList);

	function msgText (m: AiMsg): string {
		if (!m) {
			return '';
		};
		return isErrorMsg(m) ? errorText(m.error, displayName, m.target) : tr(m.key, ...(m.args || []));
	};

	// ---------------------- lifecycle ---------------------- //

	useEffect(() => {
		const observer = new ResizeObserver(() => position?.());

		if (nodeRef.current) {
			observer.observe(nodeRef.current);
		};
		// Every close of the popup stops the flow at once, before its close animation and unmount (W11)
		S.Popup.update(POPUP_ID, { onClose: () => ctrl.cancel() });
		ctrl.init();

		return () => {
			observer.disconnect();
			// The one place every close path reaches: Cancel, Esc, navigation, Close, another card
			ctrl.dispose();

			const prev = invoker.current as HTMLElement;

			if (prev?.isConnected && prev.focus) {
				prev.focus({ preventScroll: true });
			};
		};
	}, []);

	// Esc does nothing while a call is in flight
	useEffect(() => {
		S.Popup.update(POPUP_ID, { preventCloseByEscape: state.busy });
	}, [ state.busy ]);

	// The API moved to another port while manual steps are open: they are made again for it (W13, X4)
	const livePort = flow.getPort();

	useEffect(() => {
		const m = state.manual;

		if ((state.view == 'manual') && m.plan && !m.loading && m.planPort && livePort && (livePort != m.planPort)) {
			ctrl.portCurrent();
		};
	}, [ state.view, livePort, state.manual.planPort, state.manual.loading ]);

	// Focus: the dialog itself while delivering, else the screen's primary action
	useEffect(() => {
		const id = window.setTimeout(() => {
			const node = nodeRef.current;

			if (!node) {
				return;
			};
			if ((state.view == 'finish') && (state.phase == 'delivering')) {
				node.focus({ preventScroll: true });
				return;
			};
			if (node.contains(document.activeElement) && (document.activeElement != node)) {
				return;
			};

			const target = (U.Dom.select('[data-primary="true"]:not(:disabled)', node) || U.Dom.select(FOCUSABLE, node) || node) as HTMLElement;

			target.focus({ preventScroll: true });
		}, 0);

		return () => window.clearTimeout(id);
	}, [ state.view, state.phase, state.manual.mode, state.busy, !!state.result ]);

	/**
	 * Tab and Shift+Tab stay inside the dialog while it is the topmost popup (V26), on the document, so focus
	 * that left it (a removed control, a click outside) comes back (W18)
	 */
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.key != 'Tab') || (S.Popup.getLast()?.id != POPUP_ID)) {
				return;
			};

			const node = nodeRef.current;
			const list = node ? Array.from(U.Dom.selectAll(FOCUSABLE, node)) as HTMLElement[] : [];
			const active = document.activeElement;

			if (!node) {
				return;
			};
			if (!list.length) {
				e.preventDefault();
				node.focus();
				return;
			};

			const first = list[0];
			const last = list[list.length - 1];

			if (!node.contains(active)) {
				e.preventDefault();
				(e.shiftKey ? last : first).focus();
			} else
			if (e.shiftKey && ((active == first) || (active == node))) {
				e.preventDefault();
				last.focus();
			} else
			if (!e.shiftKey && (active == last)) {
				e.preventDefault();
				first.focus();
			};
		};

		document.addEventListener('keydown', onKeyDown, true);
		return () => document.removeEventListener('keydown', onKeyDown, true);
	}, []);

	// ---------------------- manage actions with a confirm ---------------------- //

	const onDisconnect = () => {
		const target = connection;

		if (!target) {
			return;
		};

		// The confirm stands for this record with this key: a replacement made meanwhile is never removed (W21)
		const shown = { id: target.id, appHash: target.appHash };

		const siblings = S.AiConnect.siblings(target).map(cardName);
		const shared = (target.appId == 'vscode') ? translate('aiConnectDisconnectSharedVscode') : (siblings.length ? tr('aiConnectDisconnectShared', siblings.join(', ')) : '');
		// Claude's extension stays installed: the user removes it in Claude (§3.3)
		const extension = (target.method == 'package') ? tr('aiConnectDisconnectExtension', displayName) : '';
		const text = [ tr('aiConnectDisconnectText', displayName), shared, extension ].filter(it => it).join(' ');

		// The confirm closes first; the disconnect starts from its close callback, so no close can bring it back (V27)
		S.Popup.open('confirm', {
			data: {
				title: tr('aiConnectDisconnectTitle', displayName),
				text,
				textConfirm: tr('aiConnectDisconnect', displayName),
				colorConfirm: 'red',
				noCloseOnConfirm: true,
				onConfirm: () => S.Popup.close('confirm', () => ctrl.disconnect(false, shown)),
			},
		});
	};

	/** Reconnect; on Claude's extension route the old key goes at once, so the user confirms first (§3.3) */
	const onReconnect = () => {
		const target = connection;

		if (!target || (target.method != 'package') || !target.appHash) {
			ctrl.reconnect();
			return;
		};

		// The confirm stands for this record with this key: a replacement made meanwhile (another window) is never retired (D1C-08)
		const confirmed = { accountId: String(S.Auth.account?.id || ''), id: target.id, appHash: target.appHash };

		S.Popup.open('confirm', {
			data: {
				title: tr('aiConnectBundleReconnectTitle', displayName),
				text: tr('aiConnectBundleReconnectText', displayName),
				textConfirm: translate('aiConnectReconnect'),
				noCloseOnConfirm: true,
				onConfirm: () => S.Popup.close('confirm', () => ctrl.reconnect({ confirmed })),
			},
		});
	};

	const onConnectOffer = (offer: I.AiAppId) => {
		const next: AiConnectPopupData = { appId: offer, view: undefined, connectionId: undefined, prefill: undefined };

		S.Popup.update(POPUP_ID, { data: next });
	};

	const onGuideCopy = (value: string, label: string) => U.Common.copyToast(label, value);

	// ---------------------- render ---------------------- //

	let content: React.ReactNode = null;
	let title = tr('aiConnectTitle', displayName);

	switch (state.view) {
		case 'connect': {
			const plan = state.plan;
			const showMoved = !!moved && !state.reconnect && !S.AiConnect.getByApp(appId);

			content = (
				<AiConnectForm
					appName={appName}
					restartName={ctrl.restartName(plan?.nextStep || 'none')}
					locked={state.formLocked}
					appId={appId}
					icon={icon}
					routes={item?.routes || []}
					route={plan?.route || state.form.route}
					tier={state.form.tier}
					savedTier={state.reconnect?.connection?.tier || data.prefill?.tier}
					grant={state.form.grant}
					spaces={spaces}
					name={state.form.name}
					days={state.form.days}
					fixedExpireAt={state.form.fixedExpireAt}
					plan={plan}
					planLoading={state.planLoading}
					movedPath={showMoved ? (plan?.displayTarget || '') : (state.movedTo || undefined)}
					movedFrom={showMoved ? undefined : (state.movedFrom || undefined)}
					notice={state.formNotice}
					errors={state.formErrors.map(msgText)}
					busy={state.busy}
					apiListening={listening}
					fullOnly={ctrl.bundlePlan()}
					onConfigRoute={(appId == 'claude-desktop') ? () => ctrl.useConfigRoute() : undefined}
					formatDate={formatDate}
					onGrant={grant => ctrl.setForm({ grant })}
					onName={name => ctrl.setForm({ name })}
					onDays={days => ctrl.setForm({ days })}
					onTier={tier => ctrl.setForm({ tier })}
					onRoute={route => ctrl.setForm({ route })}
					onSubmit={() => ctrl.submit()}
					onManual={() => ctrl.enterManual('create')}
					onCancel={() => close()}
				/>
			);
			break;
		};

		case 'finish': {
			const restartId = ctrl.restartTarget();

			content = (
				<AiConnectFinish
					appName={displayName}
					restartName={cardName(restartId) || displayName}
					appId={appId}
					icon={icon}
					phase={state.phase}
					step={state.step}
					instructions={state.plan?.instructions || {}}
					canRestart={!!S.AiConnect.detection(restartId)?.canRestart}
					canOpen={canOpenApp(S.AiConnect.detection(appId))}
					restartFailed={state.restartFailed}
					bundleSigned={state.plan?.bundleSigned}
					openFailed={state.openFailed}
					fileRoute={ctrl.fileRouteKind() || (state.fileRouteFromError ? 'lmstudio' : null)}
					bundle={state.bundle ? { ...state.bundle, state: connection?.bundleState || 'finish', bothRoutes: !!connection?.bothRoutes } : null}
					probeOk={state.probeOk}
					errorLines={state.errors.map(msgText)}
					canManual={state.canManual || (state.phase == 'stalled')}
					ackFailed={state.ackFailed}
					unsaved={state.unsaved}
					pollStopped={state.pollStopped}
					busy={state.busy}
					onCancel={() => close()}
					onQuitContinue={() => ctrl.consent('allowQuit')}
					onContinueSelf={() => ctrl.consent('quitConfirmed')}
					onOpenApp={() => ctrl.openApp()}
					onRestart={() => ctrl.restart()}
					onDone={() => ctrl.stepDone()}
					onLater={() => close()}
					onManual={() => ctrl.enterManual('create')}
					onFileRoute={() => ctrl.useFileRoute()}
					onRevealBundle={() => ctrl.revealBundle()}
					onSaveRetry={() => ctrl.retrySave()}
					onCheckAgain={() => ctrl.checkAgain()}
					onCopyKey={() => ctrl.copyKey()}
					onOpenBundle={() => ctrl.openBundle()}
					onCancelSetup={() => ctrl.cancelSetup()}
					onCheckBundle={() => ctrl.checkBundleAgain()}
					onClose={() => close()}
				/>
			);
			break;
		};

		case 'manage': {
			title = displayName;
			if (state.result) {
				const path = state.result.path;

content = (
	<AiConnectResult
		appName={displayName}
		appId={appId}
		icon={icon}
		lines={state.result.lines.map(msgText)}
		reveal={state.result.reveal}
		path={path}
		onReveal={() => ctrl.revealLeftover()}
		onCopyPath={() => U.Common.copyToast(translate('aiConnectManualPath'), path)}
		onClose={() => close()}
	/>
);
				break;
			};

			content = connection ? (
				<AiConnectManage
					appName={displayName}
					appId={appId}
					icon={icon}
					connection={connection}
					access={state.access}
					override={state.override}
					lookupFailed={!!state.access && !state.access.ok}
					spaces={spaces}
					siblings={S.AiConnect.siblings(connection).map(cardName)}
					notice={msgText(state.manageNotice)}
					busy={state.busy}
					apiListening={listening}
					moved={!!moved && (moved.id == connection.id)}
					formatDate={formatDate}
					onSaveAccess={grant => ctrl.saveAccess(grant)}
					onSaveTier={tier => ctrl.saveTier(tier)}
					onReveal={() => ctrl.revealConnection()}
					onReconnect={onReconnect}
					onReplace={() => ctrl.replace()}
					onDisconnect={onDisconnect}
					onForget={() => ctrl.disconnect(true)}
					onRetry={() => ctrl.retryRevoke()}
					onRetryCheck={() => ctrl.retryCheck()}
					onRetryLookup={() => ctrl.retryLookup()}
					onManual={() => ctrl.enterManual('done', connection)}
					onContinue={() => S.Popup.update(POPUP_ID, { data: { appId, connectionId: connection.id, view: 'finish' } })}
					onClose={() => close()}
				/>
			) : null;
			break;
		};

		case 'manual': {
			const m = state.manual;
			const reason = manualReason(m.plan, m.steps, appName);
			// A key only while the API listens on the steps' address; otherwise they stay redacted (X4)
			const live = ctrl.keyLive();
			const name = (appId == 'other') ? (m.existing?.name || appName) : appName;

			title = tr('aiConnectManualTitle', name);
			content = (
				<AiConnectManual
					appName={name}
					appId={appId}
					icon={icon}
					mode={m.mode}
					steps={m.steps}
					planLoading={m.loading}
					reason={reason}
					tierHint={tierNote(state.form.tier, m.plan?.route || state.form.route)}
					hasKey={live && !!m.keyHash}
					hasOldKey={live && !!m.oldHash}
					keyHidden={!live && !!m.plan && !!(m.keyHash || m.oldHash)}
					withName={(appId == 'other') && !m.existing}
					name={state.form.name}
					grant={state.form.grant}
					spaces={spaces}
					notice={msgText(m.notice)}
					error={msgText(m.error)}
					setups={m.existing ? [] : m.setups}
					setup={m.setup}
					onSetup={setup => ctrl.setSetup(setup)}
					unsaved={state.unsaved}
					probeFailed={m.probeFailed}
					busy={state.busy}
					apiListening={listening}
					canConfirm={!!m.plan && !m.loading && flow.manualUsable(m.plan) && live}
					canReveal={step => ctrl.canReveal(step)}
					onName={value => ctrl.setForm({ name: value })}
					onGrant={grant => ctrl.setForm({ grant })}
					onCreateKey={() => ctrl.createKey()}
					onConfirm={() => ctrl.confirmManual()}
					onRecheck={() => ctrl.recheck()}
					onSaveRetry={() => ctrl.retrySave()}
					onRetryCheck={() => ctrl.retryCheck()}
					onRestored={() => ctrl.restoredOld()}
					onDone={() => close()}
					onCancel={() => close()}
					onCopy={(value, label) => U.Common.copyToast(label, value)}
					onCopySecret={(template, which) => ctrl.copyStep(template, which)}
					onReveal={step => ctrl.revealStep(step)}
				/>
			);
			break;
		};

		case 'unsupported': {
			const offers = (item?.offer || []).map(id => ({ appId: id, name: cardName(id), installed: S.AiConnect.isInstalled(id), getUrl: getCatalogItem(id)?.getUrl }));

			title = appName;
			content = (
				<AiConnectUnsupported
					appId={appId}
					appName={appName}
					icon={icon}
					offers={offers}
					onConnect={onConnectOffer}
					onGet={url => Action.openUrl(url)}
					onClose={() => close()}
				/>
			);
			break;
		};

		case 'remote': {
			title = translate('aiConnectHermesRemoteTitle');
			content = <AiConnectHermesRemote appName={appName} icon={icon} onCopy={onGuideCopy} onLink={url => Action.openUrl(url)} onClose={() => close()} />;
			break;
		};
	};

	// Hermes' optional guides, collapsed, under its sheet
	const guide = item?.remoteSetup && [ 'connect', 'manage', 'manual' ].includes(state.view) ? (
		<AiConnectHermesGuide sections={[ 'gateway', 'remote' ]} windows={U.Common.isPlatformWindows()} onCopy={onGuideCopy} onLink={url => Action.openUrl(url)} />
	) : null;

	return (
		<div ref={nodeRef} className="aiConnectPopup" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
			{content}
			{guide}
		</div>
	);
});

const PopupAiConnect = forwardRef<{}, I.Popup>(({ param, close, position }, ref) => {
	const data: AiConnectPopupData = param?.data || {};
	const key = [ data.appId, data.connectionId || '', data.view || '' ].join(':');

	return <PopupAiConnectFlow key={key} data={data} close={() => close()} position={position} />;
});

export default PopupAiConnect;
