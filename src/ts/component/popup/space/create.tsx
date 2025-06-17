import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Label, IconObject, Button, Loader, Error, Editable } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Storage, Preview } from 'Lib';
import $ from 'jquery';

const PopupSpaceCreate = observer(forwardRef<{}, I.Popup>(({ param = {}, close }, ref) => {

	const nameRef = useRef(null);
	const iconRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ canSave, setCanSave ] = useState(true);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ iconOption, setIconOption ] = useState(U.Common.rand(1, J.Constant.count.icon));
	const { data } = param;
	const { uxType } = data;
	const { name: limit, nameThreshold: threshold } = J.Constant.limit.space;

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
		const isChatSpace = uxType == I.SpaceUxType.Chat;

		if (isLoading || !canSave) {
			return;
		};

		setIsLoading(true);

		const withChat = isChatSpace ? true : U.Object.isAllowedChat();
		const details = {
			name,
			iconOption,
			spaceUxType: uxType,
			spaceAccessType: I.SpaceType.Private,
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

						if (isChatSpace) {
							C.SpaceMakeShareable(S.Common.space, (message: any) => {
								if (message.error.code) {
									return;
								};

								C.SpaceInviteGenerate(S.Common.space, I.InviteType.WithApprove, I.ParticipantPermissions.Writer);
							});
						};

						if (withImport) {
							close(() => U.Object.openRoute({ id: 'importIndex', layout: I.ObjectLayout.Settings }));
						} else 
						if (startingId && !isChatSpace) {
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

				analytics.event('CreateSpace', { usecase: I.Usecase.Empty, middleTime: message.middleTime, route, uxType });
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
		const counter = limit - nameRef.current?.getTextValue().length;
		const show = counter <= threshold;
		const isRed = counter < 0;

		el.toggleClass('show', show);
		el.toggleClass('red', isRed);

		setCanSave(!isRed);

		if (show) {
			el.text(counter)
		};
	};

	const object = getObject();

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
					maxLength={limit}
				/>
				<div className="counter" />
			</div>

			<div className="buttons">
				<>
					<Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateCreate')} onClick={() => onSubmit(false)} />
					<Button className={!canSave ? 'disabled' : ''} text={translate('popupSpaceCreateImport')} color="blank" onClick={() => onSubmit(true)} />
				</>
			</div>

			<Error text={error} />
		</>
	);

}));

export default PopupSpaceCreate;
