import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Label, Input, IconObject, Button, Loader, Error } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Storage, sidebar } from 'Lib';

const PopupSpaceCreate = observer(forwardRef<{}, I.Popup>(({ param = {}, close }, ref) => {

	const nameRef = useRef(null);
	const iconRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ iconOption, setIconOption ] = useState(U.Common.rand(1, J.Constant.count.icon));

	const onKeyDown = (e: any, v: string) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			onSubmit(false);
		});
	};

	const onChange = (e: any, v: string) => {
		const object = getObject();

		if (iconRef.current) {
			object.name = v;
			iconRef.current?.setObject(object);
		};
	};

	const getObject = () => {
		return {
			name: nameRef.current?.getValue(),
			layout: I.ObjectLayout.SpaceView,
			iconOption: iconOption,
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
		const { data } = param;
		const { onCreate, route } = data;
		const name = checkName(nameRef.current.getValue());

		if (isLoading) {
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
							close(() => U.Object.openAuto({ id: 'importIndex', layout: I.ObjectLayout.Settings }));
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

	const object = getObject();

	useEffect(() => {
		const object = getObject();
		iconRef.current?.setObject(object);
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
				<Input
					ref={nameRef}
					value=""
					focusOnMount={true}
					onKeyDown={onKeyDown}
					onChange={onChange}
					placeholder={translate('defaultNamePage')}
				/>
			</div>

			<div className="buttons">
				<Button text={translate('popupSpaceCreateCreate')} onClick={() => onSubmit(false)} />
				<Button text={translate('popupSpaceCreateImport')} color="blank" onClick={() => onSubmit(true)} />
			</div>

			<Error text={error} />

		</>
	);

}));

export default PopupSpaceCreate;
