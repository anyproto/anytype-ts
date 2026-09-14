import React, { forwardRef, useState, useEffect } from 'react';
import { Title, Icon, Button, EmptyState } from 'Component';
import * as I from 'Interface';
import { apiKeySpaceTooltip, apiKeySupportsV1 } from 'Lib/apiKey';
import { approvalSpaces } from 'Lib/linkApproval';

const PageMainSettingsApi = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { getId } = props;
	const { dateFormat } = S.Common;
	const [ list, setList ] = useState<I.AppInfo[]>([]);
	const spaces = approvalSpaces(U.Menu.getVaultItems(), S.Auth.account?.info?.techSpaceId || '');

	// The date columns are too narrow for a full month name, so they render abbreviated (M is
	// always 3 characters in every locale); the title keeps the account's own date format.
	const shortDate = (t: number) => U.Date.dateWithFormat(I.DateFormat.MonthAbbrBeforeDay, t);
	const fullDate = (t: number) => U.Date.dateWithFormat(dateFormat, t);

	const load = () => {
		C.AccountLocalLinkListApps((message: any) => {
			if (!message.error.code) {
				const list = message.list.sort((c1, c2) => U.Data.sortByNumericKey('createdAt', c1, c2, I.SortType.Desc));

				setList(list);
			};
		});
	};

	const onAdd = () => {
		S.Popup.open('apiCreate', { onClose: () => load() });
	};

	const onEdit = (app: I.AppInfo) => {
		S.Popup.open('apiCreate', { data: { app }, onClose: () => load() });
	};

	// The cell only ever shows a masked key, so the tooltip offers the action rather than the secret.
	const onCopyKey = (item: I.AppInfo) => {
		Preview.tooltipHide();
		U.Common.copyToast(translate('popupSettingsApiKey'), item.apiKey);
	};

	const onMore = (item: I.AppInfo) => {
		const element = `#${getId()} #icon-more-${item.hash}`;
		const el = U.Dom.select(element);
		const options: any[] = [
			{ id: 'copyKey', name: translate('popupSettingsApiCopyKey') },
			{ id: 'copyMcp', name: translate('popupSettingsApiCopyMcp') },
			{ id: 'revoke', name: translate('popupSettingsApiRevoke'), color: 'destructive' },
		];
		if (item.scope == I.LocalApiScope.Json) {
			options.unshift({ id: 'edit', name: translate('apiKeyEditTitle') });
		};

		S.Menu.open('select', {
			element,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => U.Dom.addClass(el, 'active'),
			onClose: () => U.Dom.removeClass(el, 'active'),
			data: {
				options,
				onSelect: (e: any, element: any) => {
					switch (element.id) {
						case 'edit': {
							onEdit(item);
							break;
						};
						case 'copyKey': {
							onCopyKey(item);
							break;
						};

						case 'copyMcp': {
							U.Common.copyToast(translate('popupSettingsApiMcpConfig'), U.String.sprintf(J.Constant.mcpConfig, item.apiKey));
							break;
						};

						case 'revoke': {
							C.AccountLocalLinkRevokeApp(item.hash, (message: any) => {
								if (!message.error.code) {
									load();
								};
							});
							break;
						};
					};
				},
			},
		});
	};

	const Row = (item: I.AppInfo) => {
		const name = item.name || translate('defaultNamePage');
		const isJson = item.scope == I.LocalApiScope.Json;
		const grant = item.grant;
		const scope = isJson ? translate(!grant ? 'apiKeyLegacy' : (apiKeySupportsV1(grant) ? 'apiKeyVersionBoth' : 'apiKeyVersion2')) : translate(`apiScope${item.scope}`);
		const spaceNames = (grant?.spaceIds || []).map(id => spaces.find(space => space.id == id)?.name || id);
		const spaceSummary = grant?.allSpaces ? translate('apiKeyAllSpaces') : (spaceNames.length == 1 ? spaceNames[0] : translate('apiKeySpaceCount').replace('%s', String(spaceNames.length)));
		const expired = item.expireAt && (item.expireAt <= Date.now() / 1000);
		const expireDate = item.expireAt ? shortDate(item.expireAt) : translate('apiKeyNeverExpires');
		const expireTitle = item.expireAt ? fullDate(item.expireAt) : translate('apiKeyNeverExpires');
		const access = grant ? translate(grant.perm == I.LocalApiPermission.ReadWrite ? 'linkApprovalReadWrite' : 'linkApprovalRead') : translate('apiKeyUnrestricted');

		return (
			<div className="row">
				<div className="col colObject">
					<div className="appDetails">
						<div className="name" title={name}>{name}</div>
						<div className="keyMeta">{scope}</div>
					</div>
				</div>
				<div
					className="col colKey"
					onMouseEnter={e => Preview.tooltipShow({ text: translate('apiKeyClickToCopy'), element: e.currentTarget as HTMLElement })}
					onMouseLeave={() => Preview.tooltipHide()}
					onClick={() => onCopyKey(item)}
				>
					{U.String.shortMask(item.apiKey, 3)}
				</div>
				<div className="col colDate" title={item.createdAt ? fullDate(item.createdAt) : ''}>
					{item.createdAt ? shortDate(item.createdAt) : ''}
				</div>
				<div className="col colExpire" title={expireTitle}>
					{expired ? translate('apiKeyExpired') : expireDate}
				</div>
				<div className="col colAccess">
					{isJson ? (
						<button type="button" className="apiKeyAccess" onClick={() => onEdit(item)} aria-label={translate('apiKeyEditFor').replace('%s', name)}>
							<span>{access}</span>
							{grant && <span className="keyMeta" title={grant.allSpaces ? translate('linkApprovalFutureSpaces') : apiKeySpaceTooltip(spaceNames)}>{spaceSummary}</span>}
						</button>
					) : translate(`apiScope${item.scope}`)}
				</div>
				<div className="col colMore">
					<Icon id={`icon-more-${item.hash}`} name="common/more" className="more" withBackground={true} onClick={() => onMore(item)} />
				</div>
			</div>
		);
	};

	useEffect(() => {
		load();
	}, []);

	return (
		<>
			<div className="titleWrapper">
				<Title text={translate('popupSettingsApiTitle')} />
				{list.length ? <Button size={28} text={translate('popupSettingsApiCreate')} onClick={onAdd} /> : ''}
			</div>
			<p className="apiKeyIntro">{translate('apiKeySettingsDescription')}</p>

			{list.length ? (
				<div className="items">
					<div className="row isHead">
						<div className="col colSpace">{translate('commonName')}</div>
						<div className="col colKey">{translate('popupSettingsApiKey')}</div>
						<div className="col colDate">{translate('popupSettingsApiCreated')}</div>
						<div className="col colExpire">{translate('apiKeyExpires')}</div>
						<div className="col colAccess">{translate('linkApprovalPermission')}</div>
						<div className="col colMore" />
					</div>
					{list.map(item => <Row key={item.hash} {...item} />)}
				</div>
			) : (
				<EmptyState
					text={translate('popupSettingsApiEmpty')}
					buttonText={translate('popupSettingsApiCreate')}
					buttonColor="black"
					onButton={onAdd}
				/>
			)}
		</>
	);

});

export default PageMainSettingsApi;
