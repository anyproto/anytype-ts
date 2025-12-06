import React, { forwardRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Button, EmptyState } from 'Component';
import { I, S, U, C, J, translate, Preview } from 'Lib';

const PageMainSettingsApi = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { getId } = props;
	const { dateFormat } = S.Common;
	const [ list, setList ] = useState([]);

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

	const onMore = (item: any) => {
		const element = $(`#${getId()} #icon-more-${item.hash}`);
		const options: any[] = [
			{ id: 'copyKey', name: translate('popupSettingsApiCopyKey') },
			{ id: 'copyMcp', name: translate('popupSettingsApiCopyMcp') },
			{ id: 'revoke', name: translate('popupSettingsApiRevoke'), color: 'red' },
		];

		S.Menu.open('select', {
			element,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => element.addClass('active'),
			onClose: () => element.removeClass('active'),
			data: {
				options,
				onSelect: (e: any, element: any) => {
					switch (element.id) {
						case 'copyKey': {
							U.Common.copyToast(translate('popupSettingsApiKey'), item.apiKey);
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

	const Row = (item: any) => {
		const name = item.name || translate('defaultNamePage');

		return (
			<div className="row">
				<div className="col colObject">
					<div className="name">{name}</div>
				</div>
				<div 
					className="col" 
					onMouseEnter={e => Preview.tooltipShow({ text: item.apiKey, element: $(e.currentTarget) })} 
					onMouseLeave={() => Preview.tooltipHide()}
				>
					{U.String.shortMask(item.apiKey, 3)}
				</div>
				<div className="col colDate">
					{item.createdAt ? U.Date.dateWithFormat(dateFormat, item.createdAt) : ''}
				</div>
				<div className="col">
					{translate(`apiScope${item.scope}`)}
				</div>
				<div className="col colMore">
					<Icon id={`icon-more-${item.hash}`} className="more withBackground" onClick={() => onMore(item)} />
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
				{list.length ? <Button className="c28" text={translate('popupSettingsApiCreate')} onClick={onAdd} /> : ''}
			</div>

			{list.length ? (
				<div className="items">
					<div className="row isHead">
						<div className="col colSpace">{translate('commonName')}</div>
						<div className="col">{translate('popupSettingsApiKey')}</div>
						<div className="col">{translate('popupSettingsApiCreated')}</div>
						<div className="col">{translate('popupSettingsApiScope')}</div>
						<div className="col colMore" />
					</div>
					{list.map((item: any, i: number) => <Row key={i} {...item} />)}
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

}));

export default PageMainSettingsApi;