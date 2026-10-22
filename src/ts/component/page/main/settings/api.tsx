import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Title, Icon, Button, EmptyState, Label, Switch, Input } from 'Component';
import * as I from 'Interface';
import { apiKeySpaceTooltip, apiKeySupportsV1, apiKeyMarkSeen } from 'Lib/apiKey';
import { approvalSpaces } from 'Lib/linkApproval';

const PageMainSettingsApi = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { getId } = props;
	const { dateFormat } = S.Common;
	const { jsonApiStatus } = S.Auth;
	const [ list, setList ] = useState<I.AppInfo[]>([]);
	const [ localApi, setLocalApi ] = useState(S.Auth.localApiConfig);
	const portRef = useRef(null);
	const statusPort = Number(String(jsonApiStatus?.listenAddr || '').split(':').pop());
	const port = S.Auth.isValidLocalApiPort(statusPort) ? statusPort : localApi.port;
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

	// The RPC response is the authoritative outcome of our own call: the matching event
	// may arrive before or after it. A null status with no error means we disabled the server
	const changeAddr = (listenAddr: string, callBack?: (status: I.JsonApiStatus) => void) => {
		C.AccountChangeJsonApiAddr(listenAddr, (message: any) => {
			if (message.error.code) {
				return;
			};

			S.Auth.jsonApiStatusSet(message.status);
			callBack?.(message.status);
		});
	};

	const onToggle = (v: boolean) => {
		S.Auth.localApiConfigSet({ enabled: v });
		setLocalApi(S.Auth.localApiConfig);
		changeAddr(v ? S.Auth.localApiAddrByPort(localApi.port) : '');
	};

	const onPortChange = () => {
		const v = Number(String(portRef.current?.getValue() || '').trim());

		if (!S.Auth.isValidLocalApiPort(v)) {
			portRef.current?.setValue(String(port));
			Preview.toastShow({ text: translate('localApiPortInvalid') });
			return;
		};

		// Same port only rebinds to retry after a failure
		if ((v == port) && (jsonApiStatus?.success !== false)) {
			return;
		};

		// Only a port that actually bound is remembered for the next account open
		const apply = () => {
			changeAddr(S.Auth.localApiAddrByPort(v), (status) => {
				const bound = Number(String(status?.listenAddr || '').split(':').pop());

				if (status?.success && S.Auth.isValidLocalApiPort(bound)) {
					S.Auth.localApiConfigSet({ port: bound });
					setLocalApi(S.Auth.localApiConfig);
				};
			});
		};

		// A retry on the same port, or no keys issued yet, breaks no client, so it needs no warning
		if ((v == port) || !list.length) {
			apply();
			return;
		};

		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmLocalApiPortTitle'),
				text: translate('popupConfirmLocalApiPortText'),
				textConfirm: translate('commonChange'),
				textCancel: translate('commonCancel'),
				onConfirm: apply,
				onCancel: () => portRef.current?.setValue(String(port)),
			},
		});
	};

	const onStatusEnter = (e: React.MouseEvent) => {
		const text = jsonApiStatus.success
			? U.String.sprintf(translate('localApiStatusListening'), jsonApiStatus.listenAddr)
			: U.String.sprintf(translate('localApiStatusError'), U.String.htmlSpecialChars(jsonApiStatus.error));

		Preview.tooltipShow({ text, element: e.currentTarget as HTMLElement });
	};

	const onStatusClick = () => {
		if (jsonApiStatus && !jsonApiStatus.success) {
			Preview.tooltipHide();
			U.Common.copyToast(translate('commonError'), jsonApiStatus.error);
		};
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
							U.Common.copyToast(translate('popupSettingsApiMcpConfig'), U.String.sprintf(J.Constant.mcpConfig, item.apiKey, port));
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
		portRef.current?.setValue(String(port));
	}, [ port ]);

	useEffect(() => {
		load();

		// Clears the "New" badge the settings sidebar shows on this entry
		apiKeyMarkSeen();
	}, []);

	const statusCn = [ 'localApiStatus', (jsonApiStatus?.success ? 'isSuccess' : 'isError') ];

	return (
		<>
			<div className="titleWrapper">
				<Title text={translate('popupSettingsApiTitle')} />
				{list.length ? <Button size={28} text={translate('popupSettingsApiCreate')} onClick={onAdd} /> : ''}
			</div>
			<Label className="apiKeyIntro" text={U.String.sprintf(translate('apiKeySettingsDescription'), J.Url.developerPortal)} />

			<div className="actionItems">
				<div className="item localApiServer">
					<div className="flex">
						<Label className="name" text={translate('localApiAddress')} />
						{(localApi.enabled && jsonApiStatus) ? (
							<div
								className={statusCn.join(' ')}
								onMouseEnter={onStatusEnter}
								onMouseLeave={() => Preview.tooltipHide()}
								onClick={onStatusClick}
							/>
						) : ''}
						<Label className="host" text={`${S.Auth.localApiHost}:`} />
						<Input
							ref={portRef}
							className="port"
							value={String(port)}
							maxLength={5}
							readonly={!localApi.enabled}
							onKeyUp={(e: any) => {
								if (e.key == 'Enter') {
									onPortChange();
								};
							}}
						/>
						{localApi.enabled ? <Button size={28} className="change" text={translate('commonChange')} onClick={onPortChange} /> : ''}
					</div>
					<div className="flex">
						<Label className="name" text={translate('localApiEnable')} />
						<Switch className="big" value={localApi.enabled} onChange={(e: any, v: boolean) => onToggle(v)} />
					</div>
				</div>
			</div>

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
