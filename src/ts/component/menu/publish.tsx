import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Title, Input, Label, Switch, Button, Icon, Loader } from 'Component';
import { J, U, I, S, Action, translate, analytics } from 'Lib';

const MenuPublish = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { rootId } = data;
	const inputRef = useRef(null);
	const space = U.Space.getSpaceview();
	const object = S.Detail.get(rootId, rootId, []);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ slug, setSlug ] = useState(U.Common.slug(object.name));
	const participant = U.Space.getMyParticipant();

	let domain = '';
	if (participant.resolvedName) {
		domain = U.Common.sprintf(J.Url.publishDomain, participant.resolvedName);
	} else {
		domain = U.Common.sprintf(J.Url.publish, participant.identity);
	};

	const url = [ domain, slug ].join('/');
	const items = [
		(!space.isPersonal ? { 
			id: 'space', name: translate('popupSettingsSpaceIndexShareShareTitle'), onClick: () => {
				S.Popup.open('settings', { 
					data: { 
						page: 'spaceShare', 
						isSpace: true, 
						route: analytics.route.share,
				}, className: 'isSpace' });
				close();
			},
		} : null),
		{ 
			id: 'export', name: translate('popupExportTitle'), onClick: () => {
				S.Popup.open('export', { data: { objectIds: [ rootId ], allowHtml: true } });
				close();
			},
		},
	].filter(it => it);

	const onPublish = () => {
		setIsLoading(true);
		Action.publish(rootId, inputRef.current.getValue(), () => {
			setIsLoading(false);
			close();
		});
	};

	const setSlugHander = v => setSlug(U.Common.slug(v));
	const onUrlClick = () => Action.openUrl(url);

	useEffect(() => {
		setSlugHander(object.name);
	}, []);

	return (
		<>
			{isLoading ? <Loader /> : ''}
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
