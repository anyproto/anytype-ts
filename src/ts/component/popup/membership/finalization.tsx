import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Input, Loader, Icon } from 'Component';
import { I, C, S, U, J, translate } from 'Lib';

const PopupMembershipFinalization = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param } = props;
	const [ status, setStatus ] = useState('');
	const [ statusText, setStatusText ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const nameRef = useRef(null);
	const buttonRef = useRef(null);
	const timeoutRef = useRef(null);

	const setOk = (t: string) => {
		setStatus(I.InterfaceStatus.Ok);
		setStatusText(t);
	};

	const setError = (t: string) => {
		setStatus(I.InterfaceStatus.Error);
		setStatusText(t);
	};

	const onKeyUp = () => {
		const { data } = param;
		const { tier } = data;
		const name = nameRef.current?.getValue() || '';

		buttonRef.current?.setDisabled(true);
		setStatusText('');
		setStatus('');

		window.clearTimeout(timeoutRef.current);

		if (!name.length) {
			return;
		};

		timeoutRef.current = window.setTimeout(() => {
			C.MembershipIsNameValid(tier, name, (message: any) => {
				if (message.error.code) {
					setError(message.error.description);
					return;
				};

				setStatusText(translate('popupMembershipStatusWaitASecond'));

				C.NameServiceResolveName(name, (message: any) => {
					let error = '';
					if (message.error.code) {
						error = message.error.description;
					} else
					if (!message.available) {
						error = translate('popupMembershipStatusNameNotAvailable');
					};

					if (error) {
						setError(error);
					} else {
						buttonRef.current?.setDisabled(false);
						setOk(translate('popupMembershipStatusNameAvailable'));
					};
				});
			});
		}, J.Constant.delay.keyboard);
	};

	const onConfirm = () => {
		const name = nameRef.current?.getValue() || '';

		setIsLoading(true);
		buttonRef.current?.setDisabled(true);

		C.MembershipFinalize(name, (message) => {
			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			/*
			U.Data.getMembershipStatus(true, (membership) => {
				if (!membership) {
					setError(translate('pageMainMembershipError'));
					return;
				};
			});
			*/
		});
	};

	useEffect(() => {
		if (!S.Auth.membership?.name) {
			buttonRef.current?.setDisabled(true);
		};
	}, []);

	const { data } = param;
	const { tier } = data;
	const tierItem = U.Data.getMembershipTier(tier);

	if (!tierItem) {
		return null;
	};

	const { name, nameType } = membership;

	const title = tierItem.name ? U.Common.sprintf(translate(`popupMembershipFinalizationTitleWithName`), tierItem.name) : translate(`popupMembershipFinalizationTitle`);

	return (
		<div className="anyNameForm">
			{tierItem.color ? <Icon className={[ 'color', tierItem.color ].join(' ')} /> : ''}
			<div className="text">
				<Title text={title} />
				<Label text={translate('popupMembershipFinalizationText1')} />
				<Label text={translate('popupMembershipFinalizationText2')} />
			</div>

			<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

			<div className="inputWrapper">
				<Input
					ref={nameRef}
					value={name}
					onKeyUp={onKeyUp}
					readonly={!!name}
					className={name ? 'disabled' : ''}
					placeholder={translate(`popupMembershipFinalizationPlaceholder`)}
				/>
				<div className="ns">{J.Constant.namespace[nameType]}</div>
			</div>
			<Button ref={buttonRef} onClick={onConfirm} color="accent" text={translate('popupMembershipFinalizationClaimName')} />
			{isLoading ? <Loader /> : ''}
		</div>
	);

}));

export default PopupMembershipFinalization;
