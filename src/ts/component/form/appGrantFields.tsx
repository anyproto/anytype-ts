import React, { useEffect, useId, useRef, useState } from 'react';
import ChevronDown from 'Component/util/icons/arrow/chevronDown';
import * as I from 'Interface';
import { linkApprovalGrant } from 'Lib/linkApprovalGrant';

interface Props {
	spaces: I.LinkApprovalSpace[];
	value: I.LinkAppGrant;
	disabled?: boolean;
	preserveUnavailableSpaces?: boolean;
	/** Pulses the picker to point at the unmade choice when the caller blocks on an empty grant. */
	highlight?: boolean;
	t: (key: string) => string;
	onChange: (grant: I.LinkAppGrant) => void;
};

/** Shared by pairing approval and API-key settings; the caller supplies the vault-ordered catalog. */
const AppGrantFields = ({ spaces, value, disabled, preserveUnavailableSpaces, highlight, t, onChange }: Props) => {
	const permissionId = useId();
	const [ query, setQuery ] = useState('');
	const previousSelection = useRef<string[]>([]);
	const { spaceIds, allSpaces, perm } = value;
	const available = new Set(spaces.map(space => space.id));
	const keepSelection = (ids: string[]) => preserveUnavailableSpaces ? ids : ids.filter(id => available.has(id));
	const selectedIds = keepSelection(spaceIds);
	const filtered = spaces.filter(space => space.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

	useEffect(() => {
		if (selectedIds.length != spaceIds.length) {
			onChange({ ...value, spaceIds: selectedIds });
		};
		previousSelection.current = keepSelection(previousSelection.current);
	}, [ spaces, value, onChange, preserveUnavailableSpaces ]);

	const cn = [ 'spacePicker', (highlight ? 'isHighlighted' : '') ];

	return (
		<div className="appGrantFields">
			<fieldset className={cn.join(' ')} disabled={disabled} aria-label={t('linkApprovalChooseSpaces')}>
				<div className="pickerHeading">
					{(spaces.length > 4) || !!query ? (
						<input className="spaceSearch" type="search" placeholder={t('linkApprovalSearchSpaces')} aria-label={t('linkApprovalSearchSpaces')}
							value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key == 'Enter') e.preventDefault(); }} />
					) : <span>{t('linkApprovalChooseSpaces')}</span>}
					<span className="selectionCount" aria-live="polite">{allSpaces ? t('linkApprovalAllSelected') : t('linkApprovalSelected').replace('%s', String(selectedIds.length))}</span>
				</div>
				<div className="spaceList" aria-label={t('linkApprovalChooseSpaces')}>
					{filtered.map(space => (
						<label key={space.id} className={`spaceRow ${allSpaces ? 'disabled' : ''}`} title={space.name || t('defaultNamePage')}>
							<input type="checkbox" checked={allSpaces || selectedIds.includes(space.id)} disabled={allSpaces} onChange={e => {
								const ids = e.target.checked ? [ ...selectedIds, space.id ] : selectedIds.filter(id => id != space.id);
								onChange(linkApprovalGrant(ids, false, perm));
							}} />
							<span className="spaceAvatar" aria-hidden="true">{space.iconEmoji || Array.from(space.name || '?')[0].toLocaleUpperCase()}</span>
							<span className="spaceName">{space.name || t('defaultNamePage')}</span>
						</label>
					))}
					{!filtered.length && <div className="emptySpaces">{t(spaces.length ? 'linkApprovalNoMatches' : 'linkApprovalNoSpaces')}</div>}
				</div>
				<label className="allSpaces">
					<input type="checkbox" checked={allSpaces} onChange={e => {
						if (e.target.checked) {
							previousSelection.current = selectedIds;
						};
							onChange(linkApprovalGrant(keepSelection(previousSelection.current), e.target.checked, perm));
					}} />
					<span>
						<span className="allSpacesTitle">{t('linkApprovalAllSpaces')}</span>
						<span className="allSpacesDescription">{t('linkApprovalFutureSpaces')}</span>
					</span>
				</label>
			</fieldset>
			<div className="permissionRow">
				<label htmlFor={permissionId}>{t('linkApprovalPermission')}</label>
				<div className="permissionSelect">
					<select id={permissionId} value={perm} disabled={disabled} onChange={e => onChange({ ...value, perm: Number(e.target.value) })}>
						<option value={I.LocalApiPermission.Read}>{t('linkApprovalRead')}</option>
						<option value={I.LocalApiPermission.ReadWrite}>{t('linkApprovalReadWrite')}</option>
					</select>
					<ChevronDown className="permissionChevron" aria-hidden="true" focusable="false" />
				</div>
			</div>
		</div>
	);
};

export default AppGrantFields;
