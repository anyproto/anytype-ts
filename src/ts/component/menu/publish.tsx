import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Input, Label, Switch, Button, Icon, Error, Loader } from 'Component';
import { C, U, I, S, Action, translate, analytics } from 'Lib';

const MenuPublish = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { rootId } = data;
	const { isOnline } = S.Common;
	const inputRef = useRef(null);
	const publishRef = useRef(null);
	const unpublishRef = useRef(null);
	const joinRef = useRef(null);
	const space = U.Space.getSpaceview();
	const object = S.Detail.get(rootId, rootId, []);
	const [ slug, setSlug ] = useState(U.Common.slug(object.name));
	const [ status, setStatus ] = useState(null);
	const [ isStatusLoading, setIsStatusLoading ] = useState(false);
	const [ isStatusLoaded, setIsStatusLoaded ] = useState(false);
	const [ error, setError ] = useState('');

	const domain = U.Space.getPublishDomain();
	const url = U.Space.getPublishUrl(slug);
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

				analytics.event('ClickShareObjectShareSpace', { objectType: object.type });
			},
		} : null),
		{ 
			id: 'export', 
			name: translate('popupExportTitle'), 
			onClick: () => {
				S.Popup.open('export', { data: { objectIds: [ rootId ], allowHtml: true } });
				close();

				analytics.event('ClickShareObjectShareExport', { objectType: object.type });
			},
		},
	].filter(it => it);

	const onPublish = () => {
		publishRef.current.setLoading(true);

		C.PublishingCreate(S.Common.space, rootId, slug, joinRef.current?.getValue(), (message: any) => {
			publishRef.current.setLoading(false);

			if (message.error.code) {
				setError(message.error.message);
				return;
			};

			if (message.url) {
				Action.openUrl(message.url);
				close();

				analytics.event('ShareObjectPublish', { objectType: object.type });
			};
		});

		analytics.event('ClickShareObjectPublish', { objectType: object.type });
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
			analytics.event('ShareObjectUnpublish', { objectType: object.type });
		});

		analytics.event('ClickShareObjectUnpublish', { objectType: object.type });
	};

	const loadStatus = () => {
		setIsStatusLoading(true);

		C.PublishingGetStatus(space.targetSpaceId, rootId, message => {
			setIsStatusLoading(false);
			setIsStatusLoaded(true);

			if (message.state) {
				setStatus(message.state);
			};
		});
	};

	const setSlugHander = v => setSlug(U.Common.slug(v));
	const onUrlClick = () => Action.openUrl(url);

	let buttons = [];

	if (isStatusLoaded && isOnline) {
		if (status === null) {
			buttons.push({ text: translate('menuPublishButtonPublish'), ref: publishRef, onClick: onPublish });
		} else {
			buttons = buttons.concat([
				{ text: translate('menuPublishButtonUnpublish'), color: 'blank', ref: unpublishRef, onClick: onUnpublish },
				{ text: translate('menuPublishButtonUpdate'), ref: publishRef, onClick: onPublish },
			]);
		};
	};

	useEffect(() => {
		setSlugHander(object.name);

		if (isOnline) {
			loadStatus();
		};
	}, []);

	useEffect(() => {
		if (isOnline) {
			loadStatus();
		};
	}, [ isOnline ]);

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

			{space.isShared ? (
				<div className="flex">
					<Label text={translate('menuPublishLabelJoin')} />
					<div className="value">
						<Switch ref={joinRef} />
					</div>
				</div>
			) : ''}

			<div className="buttons">
				{isOnline ? (
					<>
						{isStatusLoading ? <Loader /> : (
							<>
								{buttons.map((item, i) => <Button key={i} {...item} className="c36" />)}
							</>
						)}
					</>
				) : <Label text={translate('menuPublishLabelOffline')} />}
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

}));

export default MenuPublish;