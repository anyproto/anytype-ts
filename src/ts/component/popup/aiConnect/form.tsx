import React, { useId, useState } from 'react';
import * as I from 'Interface';
import AppGrantFields from 'Component/form/appGrantFields';
import AiAppIcon from 'Component/util/aiAppIcon';
import ChevronDown from 'Component/util/icons/arrow/chevronDown';
import { EXPIRY_DAYS } from 'Lib/aiConnect/catalog';
import { sentenceArgs } from 'Lib/aiConnect/steps';
import { apiKeyCreateError } from 'Lib/apiKey';
import { linkApprovalGrant } from 'Lib/linkApprovalGrant';
import { planReason, spaceSummary, tierNote, tierOptions, tr } from './text';

export interface AiConnectFormProps {
	appName: string;
	/** The card, for its bundled mark */
	appId?: string;
	/** The app whose restart loads the settings, when it isn't this one (ChatGPT for the shared Codex file, W16) */
	restartName?: string;
	/** A same-key delivery's preview (a Replace on the settings-file fallback): the values are the record's and can't change (W3) */
	locked?: boolean;
	icon?: string;
	/** The card's routes; the selector shows only with more than one */
	routes: I.AiRoute[];
	/** The route the plan uses (it may differ from the one asked for, e.g. Claude Code's sandbox) */
	route: I.AiRoute;
	tier: I.AiTier;
	/** The tier the connection (or the prefilled reconnect) has now; the draft may differ */
	savedTier?: I.AiTier;
	grant: I.LinkAppGrant;
	spaces: I.LinkApprovalSpace[];
	name: string;
	/** Key expiry in days (0 = never) */
	days: number;
	/** A prefilled reconnect whose stored expiry is still ahead: shown as a date instead of the choice */
	fixedExpireAt?: number;
	plan: I.AiPlan | null;
	planLoading: boolean;
	/** A Codex home that moved: the new location, offered with "Connect this location" */
	movedPath?: string;
	/** The same connection moves from this file (its key there stops working): named next to the new one (Y7) */
	movedFrom?: string;
	/** Why the sheet is shown again: the old key is gone, or its access changed since it opened */
	notice?: 'reconnect' | 'grantChanged' | null;
	/** Translated error lines (an error, and what it left behind) */
	errors?: string[];
	busy: boolean;
	apiListening: boolean;
	/** Stories: open sections from the start */
	initialAdvanced?: boolean;
	initialSpaces?: boolean;
	formatDate: (t: number) => string;
	onGrant: (grant: I.LinkAppGrant) => void;
	onName: (name: string) => void;
	onDays: (days: number) => void;
	onTier: (tier: I.AiTier) => void;
	onRoute: (route: I.AiRoute) => void;
	/** Connect, Replace and connect, Connect this location */
	onSubmit: () => void;
	/** "Set up manually": opens the manual view with these values, mints nothing */
	onManual: () => void;
	onCancel: () => void;
};

/** The connect sheet: who can do what, what will happen, one primary action (§5.3) */
const AiConnectForm = (props: AiConnectFormProps) => {
	const {
		appName, appId, restartName, locked, icon, routes, route, tier, savedTier, grant, spaces, name, days, fixedExpireAt, plan, planLoading, movedPath, movedFrom, notice,
		errors, busy, apiListening, initialAdvanced, initialSpaces, formatDate, onGrant, onName, onDays, onTier, onRoute, onSubmit, onManual, onCancel,
	} = props;
	const fixed = busy || !!locked;
	const [ advancedOpen, setAdvancedOpen ] = useState(!!initialAdvanced);
	// Nothing chosen yet (a new connection): the picker is open, so the choice is one click away
	const [ spacesOpen, setSpacesOpen ] = useState(!!initialSpaces || (!grant.allSpaces && !grant.spaceIds.length));
	const ids = { perm: useId(), tier: useId(), expiry: useId(), name: useId(), route: useId(), spaces: useId(), advanced: useId() };

	const expireAt = fixedExpireAt || (days ? Math.floor(Date.now() / 1000) + days * 86400 : 0);
	const invalid = apiKeyCreateError(name, grant, expireAt);
	const manualOnly = !!plan && !plan.canApply && !!plan.steps.length;
	const blocked = !!plan && !plan.canApply && !plan.steps.length;
	const canSubmit = !busy && !planLoading && !!plan && !blocked && !invalid && (manualOnly || apiListening);
	const target = plan?.displayTarget || '';

	let primary = 'aiAppsConnect';

	if (busy) {
		primary = 'aiConnectConnecting';
	} else
	if (manualOnly) {
		primary = 'aiConnectSetUpManually';
	} else
	if (plan?.existing == 'foreign') {
		primary = 'aiConnectReplaceButton';
	} else
	if (movedPath) {
		primary = 'aiConnectTargetMovedButton';
	};

	const notices: string[] = [];

	if (notice == 'reconnect') {
		notices.push(translate('aiConnectReconnectConfirm'));
	};
	if (notice == 'grantChanged') {
		notices.push(translate('aiConnectGrantChanged'));
	};
	if (movedPath) {
		notices.push(movedFrom ? tr('aiConnectTargetMovedSame', appName, movedPath, movedFrom) : tr('aiConnectTargetMovedApp', appName, movedPath));
	};
	// Only a plan that offers Replace says Connecting replaces it (Hermes never does, H9)
	if (plan?.replace) {
		notices.push(tr('aiConnectReplaceNotice', appName));
	};
	if (plan && (plan.note || !plan.canApply)) {
		const reason = planReason(plan, appName);

		if (reason) {
			notices.push(reason);
		};
	};

	const sentence = plan ? tr(plan.sentenceKey, ...sentenceArgs(plan.sentenceKey, appName, target, restartName || appName)) : '';
	const showTier = (route != 'skill');
	// The legacy Large option follows the saved tier, not the draft (H19)
	const tiers = tierOptions((savedTier == 'large') ? savedTier : tier);
	const tierHint = tierNote(tier, route);

	const onFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (canSubmit) {
			manualOnly ? onManual() : onSubmit();
		};
	};

	const routeName = (r: I.AiRoute) => translate((r == 'skill') ? 'aiConnectRouteSkill' : 'aiConnectRouteMcp');
	const spacesCn = [ 'spaceSummary', (spacesOpen ? 'isOpen' : '') ];
	const advancedCn = [ 'linkButton', 'advancedToggle', (advancedOpen ? 'isOpen' : '') ];
	const submitCn = [ 'button', 'black', (canSubmit ? '' : 'disabled') ];

	return (
		<form className="apiKeyEditor aiConnectForm" onSubmit={onFormSubmit} aria-busy={busy}>
			<div className="aiConnectHead">
				<AiAppIcon appId={appId} name={appName} icon={icon} />
				<h2 className="title">{tr('aiConnectTitle', appName)}</h2>
			</div>

			<div className="sentenceRow">
				<label htmlFor={ids.perm}>{tr('aiConnectSentenceCan', appName)}</label>
				<div className="expirySelect">
					<select id={ids.perm} value={grant.perm} disabled={fixed} onChange={e => onGrant({ ...grant, perm: Number(e.target.value) })}>
						<option value={I.LocalApiPermission.ReadWrite}>{translate('aiConnectPermReadWrite')}</option>
						<option value={I.LocalApiPermission.Read}>{translate('aiConnectPermRead')}</option>
					</select>
					<ChevronDown aria-hidden="true" focusable="false" />
				</div>
				<span>{translate('aiConnectSentenceIn')}</span>
				<button
					type="button"
					className={spacesCn.join(' ')}
					aria-expanded={spacesOpen}
					aria-controls={ids.spaces}
					disabled={fixed}
					onClick={() => setSpacesOpen(!spacesOpen)}
				>
					<span>{spaceSummary(grant, spaces)}</span>
					<ChevronDown aria-hidden="true" focusable="false" />
				</button>
			</div>

			{spacesOpen ? (
				<div id={ids.spaces} className="spacesWrap">
					<AppGrantFields
						spaces={spaces}
						value={grant}
						disabled={fixed}
						withPermission={false}
						t={translate}
						onChange={v => onGrant(linkApprovalGrant(v.spaceIds, v.allSpaces, grant.perm))}
					/>
				</div>
			) : null}

			<p className="description" aria-live="polite">{planLoading ? '' : sentence}</p>
			{/* Full over stdio adds local file tools: said whether Advanced is open or not (H15) */}
			{(showTier && tierHint) ? <p className="description tierHint">{tierHint}</p> : null}

			{notices.map((text, i) => <p key={i} className="accessNotice">{text}</p>)}

			<button type="button" className={advancedCn.join(' ')} aria-expanded={advancedOpen} aria-controls={ids.advanced} onClick={() => setAdvancedOpen(!advancedOpen)}>
				<span>{translate('aiConnectAdvanced')}</span>
				<ChevronDown aria-hidden="true" focusable="false" />
			</button>

			{advancedOpen ? (
				<div id={ids.advanced} className="advanced">
					{showTier ? (
						<div className="expiryRow">
							<label htmlFor={ids.tier}>{translate('aiConnectTier')}</label>
							<div className="expirySelect">
								<select id={ids.tier} value={tier} disabled={fixed} onChange={e => onTier(e.target.value as I.AiTier)}>
									{tiers.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
								</select>
								<ChevronDown aria-hidden="true" focusable="false" />
							</div>
						</div>
					) : null}

					<div className="expiryRow">
						<label htmlFor={fixedExpireAt ? undefined : ids.expiry}>{translate('apiKeyExpires')}</label>
						{fixedExpireAt ? <span>{formatDate(fixedExpireAt)}</span> : (
							<div className="expirySelect">
								<select id={ids.expiry} value={days} disabled={fixed} onChange={e => onDays(Number(e.target.value))}>
									{EXPIRY_DAYS.map(value => <option key={value} value={value}>{translate(`apiKeyExpiry${value}`)}</option>)}
								</select>
								<ChevronDown aria-hidden="true" focusable="false" />
							</div>
						)}
					</div>

					<div className="expiryRow">
						<label htmlFor={ids.name}>{translate('aiConnectName')}</label>
						<input id={ids.name} className="nameInput" value={name} disabled={fixed} autoComplete="off" onChange={e => onName(e.target.value)} />
					</div>

					{(routes.length > 1) ? (
						<div className="expiryRow">
							<label htmlFor={ids.route}>{translate('aiConnectRoute')}</label>
							<div className="expirySelect">
								<select id={ids.route} value={route} disabled={fixed} onChange={e => onRoute(e.target.value as I.AiRoute)}>
									{routes.map(r => <option key={r} value={r}>{routeName(r)}</option>)}
								</select>
								<ChevronDown aria-hidden="true" focusable="false" />
							</div>
						</div>
					) : null}
				</div>
			) : null}

			{(errors?.length || (invalid == 'apiKeyNameTooLong')) ? (
				<div className="apiKeyError" role="alert">
					{(errors?.length ? errors : [ translate(invalid) ]).map((line, i) => <p key={i}>{line}</p>)}
				</div>
			) : null}

			<div className="apiKeyButtons">
				<button type="button" className="linkButton manualLink" disabled={busy} onClick={onManual}>{translate('aiConnectSetUpManually')}</button>
				<button type="button" className="button blank" disabled={busy} onClick={onCancel}>{translate('commonCancel')}</button>
				<button type="submit" className={submitCn.join(' ')} disabled={!canSubmit} data-primary="true">{translate(primary)}</button>
			</div>
		</form>
	);
};

export default AiConnectForm;
