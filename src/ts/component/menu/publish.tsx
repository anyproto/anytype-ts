import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Title, Input, Label, Switch, Button, Icon, Error } from 'Component';
import { C, J, U, I, S, Action, translate, analytics } from 'Lib';

const MenuPublish = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { rootId } = data;
	const inputRef = useRef(null);
	const publishRef = useRef(null);
	const unpublishRef = useRef(null);
	const space = U.Space.getSpaceview();
	const object = S.Detail.get(rootId, rootId, []);
	const [ slug, setSlug ] = useState(U.Common.slug(object.name));
	const [ status, setStatus ] = useState(null);
	const [ error, setError ] = useState('');
	const participant = U.Space.getMyParticipant();

	let domain = '';
	if (participant.resolvedName) {
		domain = U.Common.sprintf(J.Url.publishDomain, participant.resolvedName);
	} else {
		domain = U.Common.sprintf(J.Url.publish, participant.identity);
	};

	const url = [ domain, slug ].join('/');
	const items = [
		(!space.isPersonal ? 
		{ 
			id: 'space', 
			name: translate('popupSettingsSpaceIndexShareShareTitle'), 
			onClick: () => {
				S.Popup.open('settings', { 
					data: { 
						page: 'spaceShare', 
						isSpace: true, 
						route: analytics.route.share,
					}, 
					className: 'isSpace' 
				});
				close();
			},
		} : null),
		{ 
			id: 'export', 
			name: translate('popupExportTitle'), 
			onClick: () => {
				S.Popup.open('export', { data: { objectIds: [ rootId ], allowHtml: true } });
				close();
			},
		},
	].filter(it => it);

	const onPublish = () => {
		publishRef.current.setLoading(true);

		C.PublishingCreate(S.Common.space, rootId, url, (message: any) => {
			publishRef.current.setLoading(false);


			if (message.error.code) {
				setError(message.error.message);
				return;
			};

			if (message.url) {
				Action.openUrl(message.url);
				close();
			};
		});
	};

	const onUnpublish = () => {
		unpublishRef.current.setLoading(true);

		C.PublishingRemove(S.Common.space, rootId, (message: any) => {
			unpublishRef.current.setLoading(false);

			if (message.error.code) {
				setError(message.error.message);
				return;
			};

			close();
		});
	};

	const setSlugHander = v => setSlug(U.Common.slug(v));
	const onUrlClick = () => Action.openUrl(url);

	let buttons = [];

	if (status === null) {
		buttons.push({ text: translate('menuPublishButtonPublish'), ref: publishRef, onClick: onPublish });
	} else {
		buttons = buttons.concat([
			{ text: translate('menuPublishButtonUnpublish'), color: 'blank', ref: unpublishRef, onClick: onUnpublish },
			{ text: translate('menuPublishButtonUpdate'), ref: publishRef, onClick: onPublish },
		]);
	};

	useEffect(() => {
		setSlugHander(object.name);

		C.PublishingGetStatus(space.targetSpaceId, rootId, (message) => {
			if (message.state) {
				setStatus(message.state);
			};
		});
	}, []);

	return (
		<>
			<Title text={translate('menuPublishTitle')} />
			<Input value={domain} readonly={true} />
			<Input
                ref={inputRef}
                value={slug}
                focusOnMount={true} 
				onChange={(e, v) => setSlugHander(v)}
			/>
			<Label className="small" text={url} onClick={onUrlClick} />

			<div className="flex">
				<Label text={translate('menuPublishLabel')} />
				<div className="value">
					<Switch />
				</div>
			</div>

			<div className="buttons">
				{buttons.map((item, i) => <Button key={i} {...item} />)}
			</div>

			<Error text={error} />

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
