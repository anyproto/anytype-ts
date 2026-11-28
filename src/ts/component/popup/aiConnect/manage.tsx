import React, { useEffect, useId, useRef, useState } from 'react';
import * as I from 'Interface';
import AppGrantFields from 'Component/form/appGrantFields';
import AiAppIcon from 'Component/util/aiAppIcon';
import ChevronDown from 'Component/util/icons/arrow/chevronDown';
import { BUNDLE_STATUS, connectionState, revocationPending } from 'Lib/aiConnect/gallery';
import { isValidLinkGrant, linkApprovalGrant } from 'Lib/linkApprovalGrant';
import { accessSummary, spaceSummary, tierLabel, tierNote, tierOptions, tr } from './text';

export interface AiConnectManageProps {
	appName: string;
	/** The card, for its bundled mark */
	appId?: string;
	icon?: string;
	connection: AiConnection;
	/** heart's grant and expiry for the key now; `present: false` when the key is gone (the record's values are shown) */
	access: { grant: I.LinkAppGrant; expireAt: number; present: boolean } | null;
	spaces: I.LinkApprovalSpace[];
	/** Names of other installed cards on the same record */
	siblings: string[];
	/** A notice after an action: the tool set saved with its next step, a conflict, a failure */
	notice?: string;
	busy: boolean;
	apiListening: boolean;
	/** The record maps to no card any more (a moved home): Reconnect opens the card's sheet instead */
	moved?: boolean;
	/** What Anytype learned while Manage is open: the key is gone, or the entry belongs to someone else (V22) */
	override?: 'accessEnded' | 'conflict' | null;
	/** The key lookup failed: Try again; Replace and Reconnect wait for a lookup that worked (W2) */
	lookupFailed?: boolean;
	/** Stories: open an edit from the start */
	initialEditing?: 'access' | 'tier' | null;
	formatDate: (t: number) => string;
	onSaveAccess: (grant: I.LinkAppGrant) => void;
	onSaveTier: (tier: I.AiTier) => void;
	onReveal: () => void;
	onReconnect: () => void;
	onReplace: () => void;
	onDisconnect: () => void;
	onForget: () => void;
	onRetry: () => void;
	onRetryCheck: () => void;
	onRetryLookup?: () => void;
	onManual: () => void;
	/** Claude's extension, not "Connected" yet: its Finish view again */
	onContinue?: () => void;
	onClose: () => void;
};

type AiConnection = I.AiConnection;

const EDIT_FOCUSABLE = 'select:not(:disabled), input:not(:disabled), button:not(:disabled)';

/** A connection's details and the few things that can change (§5.5) */
const AiConnectManage = (props: AiConnectManageProps) => {
	const {
		appName, appId, icon, connection, access, spaces, siblings, notice, busy, apiListening, moved, override, lookupFailed, initialEditing, formatDate,
		onSaveAccess, onSaveTier, onReveal, onReconnect, onReplace, onDisconnect, onForget, onRetry, onRetryCheck, onRetryLookup, onManual, onContinue, onClose,
	} = props;
	const [ editing, setEditing ] = useState<'access' | 'tier' | null>(initialEditing || null);
	const [ draft, setDraft ] = useState<I.LinkAppGrant>(access?.grant || connection.grant);
	const [ tierDraft, setTierDraft ] = useState<I.AiTier>(connection.tier);
	const ids = { perm: useId(), tier: useId() };

	const isManual = (connection.method == 'manual');
	// Claude's extension: always the Full tool set, never changed in place (§3.3)
	const isBundle = (connection.method == 'package');
	const grant = access?.grant || connection.grant;
	const expireAt = access ? access.expireAt : connection.expireAt;
	const state = override || connectionState(connection);
	// Spaces this key can use that aren't in the picker now: kept unless the user removes them (V28)
	const unavailable = (draft.spaceIds || []).filter(id => !spaces.some(space => space.id == id));
	const removed = connection.removed;
	const changeable = !removed && !override;
	const probeFailed = (state == 'probeFailed');
	// Claude has Anytype twice: the settings-file entry and the extension (status `conflict`); the user removes one (D1C-14)
	const bothRoutes = (state == 'conflict') && !!connection.bothRoutes;

	useEffect(() => {
		if (!editing) {
			setDraft(grant);
			setTierDraft(connection.tier);
		};
	}, [ editing, grant, connection.tier ]);

	// Focus follows the edit (W18): into the editor when it opens, back to its Change when it closes
	const editRef = useRef<HTMLDivElement>(null);
	const changeRef = { access: useRef<HTMLButtonElement>(null), tier: useRef<HTMLButtonElement>(null) };
	const lastEditing = useRef<'access' | 'tier' | null>(null);

	useEffect(() => {
		const last = lastEditing.current;

		lastEditing.current = editing;
		if (editing) {
			(U.Dom.select(EDIT_FOCUSABLE, editRef.current) as HTMLElement)?.focus({ preventScroll: true });
		} else
		if (last) {
			changeRef[last].current?.focus({ preventScroll: true });
		};
	}, [ editing ]);

	// Leaves an edit when a save finished (the record changed under it); not on the first render
	const firstRender = useRef(true);

	useEffect(() => {
		if (firstRender.current) {
			firstRender.current = false;
			return;
		};
		setEditing(null);
	}, [ connection.tier, access?.grant ]);

	const status = (() => {
		switch (state) {
			case 'added': return { key: 'aiAppsStatusAdded', dot: 'isSuccess' };
			case 'connected': return { key: 'aiAppsStatusConnected', dot: 'isSuccess' };
			case 'finish': return { key: 'aiAppsStatusFinish', dot: '' };
			case 'pending': return { key: 'aiAppsStatusPending', dot: '' };
			case 'checking': return { key: 'aiAppsStatusChecking', dot: '' };
			case 'probeFailed': return { key: 'aiAppsStatusProbeFailed', dot: 'isError' };
			case 'removed': return { key: 'aiAppsStatusRemoved', dot: 'isError' };
			case 'accessEnded': return { key: 'aiAppsStatusAccessEnded', dot: 'isError' };
			case 'unreadable': return { key: 'aiAppsStatusUnreadable', dot: 'isError' };
			case 'reconnect': return { key: 'aiAppsStatusAttention', dot: 'isError' };
			case 'conflict': return { key: (bothRoutes ? 'aiAppsStatusBothRoutes' : 'aiAppsStatusConflict'), dot: 'isError' };
			case 'revokeFailed': return { key: 'aiAppsStatusRevokeFailed', dot: 'isError' };
			case 'gone': return { key: 'aiAppsNotInstalled', dot: '' };
			case 'bundle': return { key: BUNDLE_STATUS[connection.bundleState || 'finish'], dot: '' };
			case 'disconnected': return { key: 'aiAppsStatusDisconnected', dot: 'isError' };
		};
		return null;
	})();

	const link = (text: string, onClick: () => void, disabled = false) => (
		<button type="button" className="linkButton" disabled={disabled || busy} onClick={onClick}>{text}</button>
	);
	const change = (which: 'access' | 'tier', disabled = false) => (
		<button ref={changeRef[which]} type="button" className="linkButton" disabled={disabled || busy} onClick={() => setEditing(which)}>{translate('commonChange')}</button>
	);

	// The notice for a status that needs the user, with its own actions
	let attention: { text: string; actions: React.ReactNode } | null = null;

	switch (state) {
		case 'removed': {
			attention = { text: tr('aiConnectAttentionRemoved', appName), actions: <>{link(translate('aiConnectReconnect'), onReconnect, !apiListening || lookupFailed)}{link(translate('aiAppsForget'), onForget)}</> };
			break;
		};
		case 'accessEnded': {
			attention = { text: translate('aiConnectAttentionAccessEnded'), actions: link(translate('aiConnectReconnect'), onReconnect, !apiListening || lookupFailed) };
			break;
		};
		case 'unreadable': {
			attention = { text: tr('aiConnectAttentionUnreadable', appName), actions: <>{link(translate('aiConnectSetUpManually'), onManual)}{connection.displayTarget ? link(translate('aiConnectReveal'), onReveal) : null}</> };
			break;
		};
		case 'reconnect': {
			attention = { text: tr('aiConnectAttentionReconnect', appName), actions: null };
			break;
		};
		case 'conflict': {
			if (bothRoutes) {
				attention = { text: tr('aiConnectAttentionBothRoutes', appName), actions: null };
				break;
			};

			// Hermes never replaces an entry it didn't write: set it up by hand instead (H9)
			const replace = (appId == 'hermes') ? link(translate('aiConnectSetUpManually'), onManual) : link(translate('aiConnectReplace'), onReplace, !apiListening || lookupFailed);

			attention = { text: tr('aiConnectAttentionConflict', appName), actions: <>{replace}{link(translate('aiAppsForget'), onForget)}</> };
			break;
		};
		case 'gone': {
			attention = { text: tr('aiConnectAttentionNotInstalled', appName), actions: link(translate('aiAppsForget'), onForget) };
			break;
		};
		case 'revokeFailed': {
			attention = { text: tr('aiConnectRevokeFailed', appName), actions: link(translate('commonRetry'), onRetry) };
			break;
		};
		case 'pending': {
			attention = { text: tr('aiConnectAttentionPending', appName), actions: null };
			break;
		};
		case 'bundle': {
			attention = { text: tr('aiConnectAttentionBundle', appName), actions: onContinue ? link(translate('aiAppsContinue'), onContinue) : null };
			break;
		};
		case 'disconnected': {
			attention = { text: tr('aiConnectAttentionDisconnected', appName), actions: link(translate('aiConnectReconnect'), onReconnect, !apiListening) };
			break;
		};
	};

	const tiers = tierOptions(connection.tier);
	const tierHint = tierNote(tierDraft, connection.route);
	const statusCn = [ 'localApiStatus', status?.dot || '' ];
	// A replaced key heart hasn't confirmed revoked yet, next to the record's own state (D1C-16)
	const statusText = status ? [ tr(status.key, appName), (revocationPending(connection) ? translate('aiAppsStatusRevokePending') : '') ].filter(it => it).join(' · ') : '';
	const saveAccessCn = [ 'button', 'black', 'size28', (isValidLinkGrant(draft) ? '' : 'disabled') ];

	return (
		<div className="apiKeyEditor aiConnectManage" aria-busy={busy}>
			<div className="aiConnectHead">
				<AiAppIcon appId={appId} name={appName} icon={icon} />
				<h2 className="title">{appName}</h2>
				{status ? (
					<div className="statusLine">
						{status.dot ? <span className={statusCn.join(' ')} aria-hidden="true" /> : null}
						<span>{statusText}</span>
					</div>
				) : null}
			</div>

			<dl className="manageRows">
				<div className="manageRow">
					<dt>{translate('aiConnectManageAccess')}</dt>
					<dd>{accessSummary(grant, spaces)}</dd>
					{changeable && (editing != 'access') ? change('access') : null}
				</div>

				{(editing == 'access') ? (
					<div ref={editRef} className="manageEdit">
						<div className="sentenceRow">
							<label htmlFor={ids.perm}>{tr('aiConnectSentenceCan', appName)}</label>
							<div className="expirySelect">
								<select id={ids.perm} value={draft.perm} disabled={busy} onChange={e => setDraft({ ...draft, perm: Number(e.target.value) })}>
									<option value={I.LocalApiPermission.ReadWrite}>{translate('aiConnectPermReadWrite')}</option>
									<option value={I.LocalApiPermission.Read}>{translate('aiConnectPermRead')}</option>
								</select>
								<ChevronDown aria-hidden="true" focusable="false" />
							</div>
							<span>{translate('aiConnectSentenceIn')}</span>
							<span>{spaceSummary(draft, spaces)}</span>
						</div>
						<AppGrantFields spaces={spaces} value={draft} disabled={busy} withPermission={false} preserveUnavailableSpaces={true} t={translate} onChange={v => setDraft(linkApprovalGrant(v.spaceIds, v.allSpaces, draft.perm))} />
						{unavailable.length ? (
							<div className="accessNotice">
								<p>{translate('apiKeyUnavailableSpaces').replace('%s', String(unavailable.length))}</p>
								<div className="noticeActions">
									<button type="button" className="linkButton" disabled={busy} onClick={() => setDraft({ ...draft, spaceIds: draft.spaceIds.filter(id => !unavailable.includes(id)) })}>
										{translate('apiKeyRemoveUnavailableSpaces')}
									</button>
								</div>
							</div>
						) : null}
						<div className="editButtons">
							<button type="button" className="button blank size28" disabled={busy} onClick={() => setEditing(null)}>{translate('commonCancel')}</button>
							<button type="button" className={saveAccessCn.join(' ')} disabled={busy || !isValidLinkGrant(draft)} onClick={() => onSaveAccess(draft)}>{translate('commonSave')}</button>
						</div>
					</div>
				) : null}

				<div className="manageRow">
					<dt>{translate('apiKeyExpires')}</dt>
					<dd>{expireAt ? formatDate(expireAt) : translate('apiKeyNeverExpires')}</dd>
				</div>

				{(connection.route != 'skill') ? (
					<div className="manageRow">
						<dt>{translate('aiConnectTier')}</dt>
						<dd>{isManual ? translate('aiConnectOtherTierHint') : tierLabel(connection.tier)}</dd>
						{!isManual && !isBundle && changeable && (editing != 'tier') ? change('tier', !apiListening) : null}
					</div>
				) : null}

				{(editing == 'tier') ? (
					<div ref={editRef} className="manageEdit">
						<div className="expiryRow">
							<label htmlFor={ids.tier}>{translate('aiConnectTier')}</label>
							<div className="expirySelect">
								<select id={ids.tier} value={tierDraft} disabled={busy} onChange={e => setTierDraft(e.target.value as I.AiTier)}>
									{tiers.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
								</select>
								<ChevronDown aria-hidden="true" focusable="false" />
							</div>
						</div>
						{tierHint ? <p className="description">{tierHint}</p> : null}
						<div className="editButtons">
							<button type="button" className="button blank size28" disabled={busy} onClick={() => setEditing(null)}>{translate('commonCancel')}</button>
							<button type="button" className="button black size28" disabled={busy || (tierDraft == connection.tier)} onClick={() => onSaveTier(tierDraft)}>{translate('commonSave')}</button>
						</div>
					</div>
				) : null}

				{connection.displayTarget ? (
					<div className="manageRow">
						<dt>{translate('aiConnectManageTarget')}</dt>
						<dd className="path" title={connection.displayTarget}>{connection.displayTarget}</dd>
						{link(translate('aiConnectReveal'), onReveal)}
					</div>
				) : null}
			</dl>

			{siblings.length ? <p className="description">{tr('aiAppsAlsoIn', siblings.join(', '))}</p> : null}
			{attention ? (
				<div className="accessNotice">
					<p>{attention.text}</p>
					{attention.actions ? <div className="noticeActions">{attention.actions}</div> : null}
				</div>
			) : null}
			{lookupFailed ? (
				<div className="accessNotice">
					<p>{translate('aiConnectManageLookupFailed')}</p>
					{onRetryLookup ? <div className="noticeActions">{link(translate('commonRetry'), onRetryLookup)}</div> : null}
				</div>
			) : null}
			{notice ? <p className="accessNotice" role="status">{notice}</p> : null}

			<div className="apiKeyButtons">
				<div className="aside">
					{!removed ? link(translate('aiConnectSetUpManually'), onManual) : null}
					{probeFailed ? link(translate('aiAppsRetryCheck'), onRetryCheck, !apiListening) : null}
				</div>
				{removed ? (
					<button type="button" className="button black" data-primary="true" disabled={busy} onClick={onClose}>{translate('commonClose')}</button>
				) : (
					<>
						<button type="button" className="button blank" disabled={busy || (!moved && (!apiListening || lookupFailed))} onClick={onReconnect}>{translate('aiConnectReconnect')}</button>
						<button type="button" className="button red" disabled={busy} onClick={onDisconnect}>{tr('aiConnectDisconnect', appName)}</button>
					</>
				)}
			</div>
		</div>
	);
};

export interface AiConnectResultProps {
	appName: string;
	/** The card, for its bundled mark */
	appId?: string;
	icon?: string;
	/** What a disconnect did, line by line (an entry or extension left behind, a key not deleted) */
	lines: string[];
	/** The entry left behind is in the file main reveals for this card: Reveal (W19) */
	reveal: boolean;
	/** The file the entry was left in: copied when it can't be revealed as it is (another profile, W19) */
	path?: string;
	onReveal: () => void;
	onCopyPath?: () => void;
	onClose: () => void;
};

/** After a disconnect that couldn't finish everything: what is left and what the user can do */
export const AiConnectResult = ({ appName, appId, icon, lines, reveal, path, onReveal, onCopyPath, onClose }: AiConnectResultProps) => {
	let aside: React.ReactNode = null;

	if (reveal) {
		aside = <button type="button" className="linkButton" onClick={onReveal}>{translate('aiConnectReveal')}</button>;
	} else
	if (path && onCopyPath) {
		aside = <button type="button" className="linkButton" onClick={onCopyPath}>{translate('aiConnectManualCopyPath')}</button>;
	};

	return (
		<div className="apiKeyEditor aiConnectManage">
			<div className="aiConnectHead">
				<AiAppIcon appId={appId} name={appName} icon={icon} />
				<h2 className="title">{appName}</h2>
			</div>
			{lines.map((line, i) => <p key={i} className="description">{line}</p>)}
			<div className="apiKeyButtons">
				{aside ? <div className="aside">{aside}</div> : null}
				<button type="button" className="button black" data-primary="true" onClick={onClose}>{translate('commonClose')}</button>
			</div>
		</div>
	);
};

export default AiConnectManage;
