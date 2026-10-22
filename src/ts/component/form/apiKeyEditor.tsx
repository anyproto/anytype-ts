import React, { useEffect, useRef, useState } from 'react';
import AppGrantFields from './appGrantFields';
import ChevronDown from 'Component/util/icons/arrow/chevronDown';
import * as I from 'Interface';
import { apiKeyCreateError, apiKeySupportsV1, sameLinkGrant } from 'Lib/apiKey';
import { isValidLinkGrant, linkApprovalGrant } from 'Lib/linkApprovalGrant';

interface Props {
	app?: I.AppInfo;
	spaces: I.LinkApprovalSpace[];
	t: (key: string) => string;
	formatDate: (timestamp: number) => string;
	onCreate: (app: { name: string; expireAt: number; grant: I.LinkAppGrant }, callback: (message: any) => void) => void;
	onUpdate: (hash: string, grant: I.LinkAppGrant, callback: (message: any) => void) => void;
	onCopy: (key: string) => void;
	onClose: () => void;
};

const ApiKeyEditor = ({ app, spaces, t, formatDate, onCreate, onUpdate, onCopy, onClose }: Props) => {
	const [ name, setName ] = useState('');
	const [ days, setDays ] = useState(0);
	const [ grant, setGrant ] = useState<I.LinkAppGrant>(() => app?.grant ? {
		...app.grant, spaceIds: [ ...app.grant.spaceIds ],
	} : linkApprovalGrant([], false, I.LocalApiPermission.Read));
	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ key, setKey ] = useState('');
	const pending = useRef(false);
	const mounted = useRef(false);
	const formRef = useRef<HTMLFormElement>(null);
	const expireAt = () => days ? Math.floor(Date.now() / 1000) + days * 86400 : 0;
	const validation = app ? (isValidLinkGrant(grant) ? '' : 'apiKeyGrantRequired') : apiKeyCreateError(name, grant, expireAt());
	const unavailable = grant.spaceIds.filter(id => !spaces.some(space => space.id == id));
	const canSave = !isLoading && !validation && !unavailable.length && (!app || !sameLinkGrant(app.grant, grant));
	const supportsV1 = apiKeySupportsV1(grant);
	const losesV1 = app && apiKeySupportsV1(app.grant) && !supportsV1 && isValidLinkGrant(grant);

	useEffect(() => {
		mounted.current = true;
		if (app) {
			formRef.current?.querySelector<HTMLElement>('input:not(:disabled), select:not(:disabled)')?.focus({ preventScroll: true });
		};
		return () => { mounted.current = false; };
	}, []);

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSave || pending.current) return;
		pending.current = true;
		setIsLoading(true);
		setError('');
		const callback = (message: any) => {
			if (!mounted.current) return;
			pending.current = false;
			setIsLoading(false);
			if (message.error?.code) {
				setError(message.error.description || t('apiKeySaveError'));
			} else if (app) {
				onClose();
			} else if (message.key) {
				setKey(message.key);
			} else {
				setError(t('apiKeySaveError'));
			};
		};
		if (app) {
			onUpdate(app.hash, grant, callback);
		} else {
			onCreate({ name, expireAt: expireAt(), grant }, callback);
		};
	};

	if (key) {
		return (
			<div className="apiKeyEditor success">
				<h2 className="title">{t('popupApiCreateSuccess')}</h2>
				<p className="description">{t('apiKeyCopyDescription')}</p>
				<textarea aria-label={t('popupSettingsApiKey')} value={key} readOnly rows={3} />
				<div className="apiKeyButtons">
					<button type="button" className="button blank" onClick={onClose}>{t('commonClose')}</button>
					<button type="button" className="button black" onClick={() => onCopy(key)}>{t('popupSettingsApiCopyKey')}</button>
				</div>
			</div>
		);
	};

	return (
		<form ref={formRef} className="apiKeyEditor" onSubmit={onSubmit} aria-busy={isLoading}>
			<h2 className="title">{t(app ? 'apiKeyEditTitle' : 'apiKeyCreateTitle')}</h2>
			{app ? <div className="appName" title={app.name}>{app.name}</div> : null}
			<p className="description">{t(app ? 'apiKeyEditDescription' : 'apiKeyCreateDescription')}</p>
			{app && !app.grant && <p className="legacyNotice">{t('apiKeyLegacyEdit')}</p>}
			{!app && (
				<div className="nameField">
					<label htmlFor="apiKeyName">{t('apiKeyAppName')}</label>
					<input id="apiKeyName" value={name} disabled={isLoading} autoFocus autoComplete="off"
						placeholder={t('apiKeyAppNamePlaceholder')} onChange={e => setName(e.target.value)} />
				</div>
			)}
			<AppGrantFields spaces={spaces} value={grant} disabled={isLoading} preserveUnavailableSpaces={true} t={t} onChange={setGrant} />
			<div className="expiryRow">
				<label htmlFor={app ? undefined : 'apiKeyExpiry'}>{t('apiKeyExpires')}</label>
				{app ? <span>{app.expireAt ? formatDate(app.expireAt) : t('apiKeyNeverExpires')}</span> : (
					<div className="expirySelect">
						<select id="apiKeyExpiry" value={days} disabled={isLoading} onChange={e => setDays(Number(e.target.value))}>
							{[ 0, 7, 30, 90, 365 ].map(value => <option key={value} value={value}>{t(`apiKeyExpiry${value}`)}</option>)}
						</select>
						<ChevronDown aria-hidden="true" focusable="false" />
					</div>
				)}
			</div>
			<p className="compatibility">{t(supportsV1 ? 'apiKeyV1Compatible' : 'apiKeyV2Only')}</p>
			{losesV1 && <p className="accessNotice">{t('apiKeyV1WillStop')}</p>}
			{!!unavailable.length && <div className="accessNotice">
				<p>{t('apiKeyUnavailableSpaces').replace('%s', String(unavailable.length))}</p>
				<button type="button" className="removeUnavailable" disabled={isLoading} onClick={() => setGrant({ ...grant, spaceIds: grant.spaceIds.filter(id => !unavailable.includes(id)) })}>
					{t('apiKeyRemoveUnavailableSpaces')}
				</button>
			</div>}
			{(error || (validation == 'apiKeyNameTooLong')) && <div className="apiKeyError" role="alert">{error || t(validation)}</div>}
			<div className="apiKeyButtons">
				<button type="button" className="button blank" disabled={isLoading} onClick={onClose}>{t('commonCancel')}</button>
				<button type="submit" className={`button black ${canSave ? '' : 'disabled'}`} disabled={!canSave}>{t(isLoading ? 'linkApprovalApproving' : (app ? 'apiKeySave' : 'apiKeyCreate'))}</button>
			</div>
		</form>
	);
};

export default ApiKeyEditor;
