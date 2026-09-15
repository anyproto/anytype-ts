import React, { useEffect, useState } from 'react';
import AppGrantFields from 'Component/form/appGrantFields';
import * as I from 'Interface';
import { approvalLabel, approvalName, approvalSource } from 'Lib/linkApproval';
import { isValidLinkGrant, linkApprovalGrant } from 'Lib/linkApprovalGrant';

interface Props {
	payload: I.LinkApprovalPayload;
	challenge?: string;
	isSent?: boolean;
	error?: boolean;
	t: (key: string) => string;
	onDecide: (allow: boolean, grant?: I.LinkAppGrant) => void;
};

const LinkApproval = ({ payload, challenge, isSent, error, t, onDecide }: Props) => {
	const [ grant, setGrant ] = useState<I.LinkAppGrant>(() => linkApprovalGrant([], false,
		payload.requestedPerm == I.LocalApiPermission.ReadWrite ? I.LocalApiPermission.ReadWrite : I.LocalApiPermission.Read));
	const [ highlight, setHighlight ] = useState(false);
	const spaces = payload.spaces || [];
	const isJson = payload.scope == I.LocalApiScope.Json;
	const canAllow = !isSent && (!isJson || (isValidLinkGrant(grant) && grant.spaceIds.every(id => spaces.some(space => space.id == id))));
	const fill = (text: string, value: string) => text.replace('%s', value);

	// The pulse is a one-shot: drop it once it has played, and the moment the choice is made.
	useEffect(() => {
		if (!highlight) {
			return;
		};
		if (canAllow) {
			setHighlight(false);
			return;
		};

		const timeout = setTimeout(() => setHighlight(false), 600);
		return () => clearTimeout(timeout);
	}, [ highlight, canAllow ]);
	const { clientInfo } = payload;
	const name = approvalName(clientInfo);
	const source = approvalSource(clientInfo) || t('linkApprovalUnknownApp');
	const label = approvalLabel(clientInfo) || t('linkApprovalUnknownApp');

	if (challenge) {
		return (
			<div className="linkApproval code">
				<div className="logo" />
				<div className="title">{t('linkApprovalCodeTitle')}</div>
				<div className="description">{fill(t('linkApprovalCodeDescription'), label)}</div>
				<div className="challenge" aria-label={challenge}>
					{String(challenge).split('').map((n, i) => <span key={i} className="number" aria-hidden="true">{n}</span>)}
				</div>
			</div>
		);
	};

	return (
		<form className={`linkApproval request ${isJson ? 'withSpaces' : ''}`} onSubmit={e => {
			e.preventDefault();
			if (canAllow) {
				onDecide(true, isJson ? grant : undefined);
			} else
			if (!isSent) {
				// Allow is unreachable until a space is chosen, so point at the choice that blocks it
				// rather than letting the press do nothing.
				setHighlight(true);
			};
		}}>
			<div className="logo" />
			<div className="heading">
				<div className="title">{name ? fill(t('linkApprovalRequestTitle'), name) : t('linkApprovalTitleUnknown')}</div>
				<div className="source" title={source}>{source}</div>
			</div>

			{isJson ? (
				<>
					<AppGrantFields spaces={spaces} value={grant} disabled={isSent} highlight={highlight} t={t} onChange={setGrant} />
					<div className="compatibility">{!(grant.allSpaces && (grant.perm == I.LocalApiPermission.ReadWrite)) && t('linkApprovalCompatibility')}</div>
				</>
			) : <div className="scope">{t('linkApprovalScopeLimited')}</div>}

			{error && <div className="approvalError" role="alert">{t('linkApprovalError')}</div>}
			<div className="footer">
				<div className="buttons">
					<button type="button" className={`button blank ${isSent ? 'disabled' : ''}`} disabled={isSent} onClick={() => onDecide(false)}>{t('linkApprovalDeny')}</button>
					{/* aria-disabled, not disabled: a disabled button swallows the press, and the press is
					    what we want in order to point the user at the space they have not chosen. */}
					<button type="submit" className={`button black ${canAllow ? '' : 'disabled'}`} aria-disabled={!canAllow}>{t(isSent ? 'linkApprovalApproving' : 'linkApprovalAllow')}</button>
				</div>
				<div className="note">{t('linkApprovalDenyNote')}</div>
			</div>
		</form>
	);
};

export default LinkApproval;
