import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Input, Loader, Icon } from 'Component';
import { I, C, J, translate, analytics, U } from 'Lib';

const PopupMembershipFinalization = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { product, route, onSuccess } = data;
	const [ status, setStatus ] = useState('');
	const [ statusText, setStatusText ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const nameRef = useRef(null);
	const buttonRef = useRef(null);
	const timeoutRef = useRef<any>(null);

	const setOk = (t: string) => {
		setStatus(I.InterfaceStatus.Ok);
		setStatusText(t);
	};

	const setError = (code: number) => {
		setStatus(I.InterfaceStatus.Error);
		setStatusText(translate(`popupMembershipCode${code}`));
	};

	const onKeyUp = () => {
		const name = nameRef.current?.getValue() || '';

		buttonRef.current?.setDisabled(true);
		setStatusText('');
		setStatus('');

		window.clearTimeout(timeoutRef.current);

		if (!name.length) {
			return;
		};

		setStatusText(translate('popupMembershipStatusWaitASecond'));

		timeoutRef.current = window.setTimeout(() => {
			C.MembershipV2AnyNameIsValid(name, (message: any) => {
				if (message.error.code) {
					buttonRef.current?.setDisabled(true);
					setError(message.error.code);
					return;
				};

				buttonRef.current?.setDisabled(false);
				setOk(translate('popupMembershipStatusNameAvailable'));
			});

		}, J.Constant.delay.keyboard);
	};

	const onConfirm = (e: any) => {
		e.preventDefault();

		if (isLoading || buttonRef.current?.isDisabled()) {
			return;
		};

		const name = nameRef.current?.getValue() || '';

		setStatus('');
		setIsLoading(true);
		buttonRef.current?.setDisabled(true);

		C.MembershipV2AnyNameAllocate(name, (message) => {
			setIsLoading(false);

			if (message.error.code) {
				setError(message.error.code);
				return;
			};

			onSuccess();
		});

		analytics.event('ClickMembershipFinalization');
	};

	useEffect(() => {
		buttonRef.current?.setDisabled(true);
		analytics.event('ScreenMembershipFinalization', route);
	}, []);

	return (
		<form onSubmit={onConfirm} className="anyNameForm">
			<Icon className={[ 'color', product.colorStr || 'default' ].join(' ')} />
			<div className="text">
				<Title text={U.String.sprintf(translate(`popupMembershipFinalizationTitle`), product.name)} />
				<Label text={translate('popupMembershipFinalizationText1')} />
				<Label text={translate('popupMembershipFinalizationText2')} />
			</div>

			<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

			<div className="inputWrapper">
				<Input
					ref={nameRef}
					onKeyUp={onKeyUp}
					placeholder={translate(`popupMembershipFinalizationPlaceholder`)}
				/>
				<div className="ns">{J.Constant.namespace[0]}</div>
			</div>
			<Button ref={buttonRef} type="input" onClick={onConfirm} color="accent" text={translate('popupMembershipFinalizationClaimName')} />
			{isLoading ? <Loader /> : ''}
		</form>
	);

}));

export default PopupMembershipFinalization;
