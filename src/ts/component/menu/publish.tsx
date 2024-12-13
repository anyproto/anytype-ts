import React, { forwardRef } from 'react';
import { Title, Input, Label, Switch, Button, Icon } from 'Component';
import { J, U, I, S, Action, translate } from 'Lib';

const MenuPublish = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { rootId } = data;
	const object = S.Detail.get(rootId, rootId, []);
	const participant = U.Space.getMyParticipant();
	const domain = U.Common.sprintf(J.Url.publish, participant.resolvedName);
	const items = [
		{ 
			id: 'space', name: translate('popupSettingsSpaceIndexShareShareTitle'), onClick: () => {
				S.Popup.open('settings', { data: { page: 'spaceShare', isSpace: true }, className: 'isSpace' });
				close();
			},
		},
		{ 
			id: 'export', name: translate('popupExportTitle'), onClick: () => {
				S.Popup.open('export', { data: { objectIds: [ rootId ], allowHtml: true } });
				close();
			},
		},
	];

	const onPublish = () => {
		Action.publish(rootId, `${rootId}-fake-uri`);
	};

	return (
		<>
			<Title text={translate('menuPublishTitle')} />
			<Input value={domain} readonly={true} />
			<Input value={U.Common.slug(object.name)} focusOnMount={true} />
			<Label className="small" text="https:/any.copp/kjshdfkjahsjdkhAJDH*78/rem-koolhaas-architects" />

			<div className="flex">
				<Label text={translate('menuPublishLabel')} />
				<div className="value">
					<Switch />
				</div>
			</div>

			<Button text={translate('menuPublishButton')} className="c36" onClick={onPublish} />

			<div className="outer">
				{items.map((item, index) => (
					<div key={index} className="item" onClick={item.onClick}>
						<Icon className={item.id} />
						<div className="name">{item.name}</div>
						<Icon className="arrow" />
					</div>
				))}
			</div>
		</>
	);

});

export default MenuPublish;