import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Label, IconObject, Button, Loader, Error, Editable } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Storage } from 'Lib';
import $ from 'jquery';

const PopupSpaceCreate = observer(forwardRef<{}, I.Popup>(({ param = {}, close }, ref) => {

	const nameRef = useRef(null);
	const iconRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ canSave, setCanSave ] = useState(true);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ iconOption, setIconOption ] = useState(U.Common.rand(1, J.Constant.count.icon));
	const { data } = param;
	const { spaceKind } = data;

	const onKeyDown = (e: any) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			onSubmit(false);
		});
	};

	const onKeyUp = (e: any) => {
		nameRef.current?.placeholderCheck();
		onChange(e, nameRef.current?.getTextValue());
		updateCounter();
	};

	const onChange = (e: any, v: string) => {
		const object = getObject();

		if (!v.trim().length) {
			v = translate('defaultNamePage');
		};

		if (iconRef.current) {
			object.name = v;
			iconRef.current?.setObject(object);
		};
	};

	const getObject = () => {
		return {
			name: nameRef.current?.getTextValue(),
			layout: I.ObjectLayout.SpaceView,
			iconOption,
		};
	};

	const checkName = (v: string): string => {
		if ([
			translate('defaultNameSpace'), 
			translate('defaultNamePage'),
		].includes(v)) {
			v = '';
		};
		return v;
	};

	const onSubmit = (withImport: boolean) => {
		const { onCreate, route } = data;
		const name = checkName(nameRef.current.getTextValue());

		if (isLoading || !canSave) {
			return;
		};

		setIsLoading(true);

		const withChat = U.Object.isAllowedChat();
		const details = {
			name,
			iconOption,
		};

		analytics.event(withImport ? 'ClickCreateSpaceImport' : 'ClickCreateSpaceEmpty');

		C.WorkspaceCreate(details, I.Usecase.Empty, withChat, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			const startingId = message.startingId;

			C.WorkspaceSetInfo(message.objectId, details, () => {
				if (message.error.code) {
					setError(message.error.description);
					return;
				};

				const ids = [ message.objectId ].concat(U.Menu.getVaultItems().map(it => it.id));

				Storage.set('spaceOrder', ids);

				U.Router.switchSpace(message.objectId, '', true, { 
					onRouteChange: () => {
						U.Space.initSpaceState();

						if (withImport) {
							close(() => U.Object.openRoute({ id: 'importIndex', layout: I.ObjectLayout.Settings }));
						} else 
						if (startingId) {
							U.Object.getById(startingId, {}, (object: any) => {
								if (object) {
									U.Object.openRoute(object);
								};
							});
						} else {
							U.Space.openDashboard({ replace: true });
						};

						if (onCreate) {
							onCreate(message.objectId);
						};
					} 
				}, false);

				analytics.event('CreateSpace', { usecase: I.Usecase.Empty, middleTime: message.middleTime, route });
				analytics.event('SelectUsecase', { type: I.Usecase.Empty });
			});
		});
	};

	const onIcon = () => {
		let icon = iconOption;

		icon++;
		if (icon > J.Constant.count.icon) {
			icon = 1;
		};

		setIconOption(icon);
	};

	const updateCounter = () => {
		const el = $('.popupSpaceCreate .nameWrapper .counter');
		const counter = J.Constant.limit.spaceName - nameRef.current?.getTextValue().length;
		const show = counter <= J.Constant.limit.spaceNameThreshold;
		const isRed = counter < 0;

		el.toggleClass('show', show);
		el.toggleClass('red', isRed);

		setCanSave(!isRed);

		if (show) {
			el.text(counter)
		};
	};

	const object = getObject();

	let buttons = null;

	switch (spaceKind) {
		case I.SpaceKind.Chat: {
			buttons = <Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateCreateChat')} onClick={() => onSubmit(false)} />
			break;
		};

		case I.SpaceKind.Space: {
			buttons = <Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateCreateSpace')} onClick={() => onSubmit(false)} />
			break;
		};

		case I.SpaceKind.Unknown: {
			buttons = (
				<>
					<Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateCreate')} onClick={() => onSubmit(false)} />
					<Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateImport')} color="blank" onClick={() => onSubmit(true)} />
				</>
			);
			break;
		};
	};

	useEffect(() => {
		const object = getObject();
		iconRef.current?.setObject(object);
		nameRef.current?.setFocus();
		updateCounter();
	}, [ iconOption ]);

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}
			<Label text={translate('popupSpaceCreateLabel')} />

			<div className="iconWrapper">
				<IconObject
					ref={iconRef}
					size={96}
					object={object}
					canEdit={false}
					menuParam={{ horizontal: I.MenuDirection.Center }}
					onClick={onIcon}
				/>
			</div>

			<div className="nameWrapper">
				<Editable
					classNameWrap="spaceName"
					ref={nameRef}
					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}
					placeholder={translate('defaultNamePage')}
					maxLength={J.Constant.limit.spaceName}
				/>
				<div className="counter" />
			</div>

			<div className="buttons">
				{buttons}
			</div>

			<Error text={error} />

		</>
	);

}));

export default PopupSpaceCreate;
