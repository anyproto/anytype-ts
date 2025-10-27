import React, { forwardRef, useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Label, Button, Loader, Error, Icon, Input } from 'Component';
import { I, C, S, translate } from 'Lib';

const PopupMembershipActivation = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { close, param } = props;
	const { data } = param;
	const { code } = data;
	const inputWrapperRef = useRef(null);
	const inputRef = useRef(null);
	const buttonRef = useRef(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ error, setError ] = useState('');

	const onKeyUp = () => {
		checkButton();
		setError('');
	};

	const onClear = () => {
		inputRef.current?.setValue('');
		setError('');
		buttonRef.current?.setDisabled(true);
		$(inputWrapperRef.current).removeClass('canClear');
	};

	const checkButton = () => {
		const v = inputRef.current?.getValue();

		buttonRef.current?.setDisabled(!v.length);
		$(inputWrapperRef.current).toggleClass('canClear', v.length > 0);
	};

	const onSubmit = () => {
		const code = inputRef.current.getValue();

		setIsLoading(true);

		C.MembershipCodeGetInfo(code, (message) => {
			setIsLoading(false);

			if (message.error.code) {
				setError(translate(`popupMembershipActivationError${message.error.code}`));
				return;
			};

			C.MembershipCodeRedeem(code, '', () => {
				if (message.error.code) {
					setError(message.error.description);
					return;
				};

				close();
			});
		});
	};

	useEffect(() => {
		if (code) {
			inputRef.current?.setValue(code);
		};

		window.setTimeout(() => checkButton());
	}, []);

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}

			<Icon className="activation" />

			<Title text={translate('popupMembershipActivationTitle')} />
			<Label text={translate('popupMembershipActivationText')} />

			<div ref={inputWrapperRef} className="inputWrapper">
				<Input type="text" ref={inputRef} onKeyUp={onKeyUp} placeholder={translate('popupMembershipActivationPlaceholder')} />
				<Icon className="clear" onClick={onClear} />
			</div>

			<div className="buttons">
				<Button ref={buttonRef} className="c36" color="accent" text={translate('commonActivate')} onClick={onSubmit} />
				<Button className="c36" color="blank" text={translate('commonCancel')} onClick={() => close()} />
			</div>

			<Error text={error} />
		</>
	);

}));

export default PopupMembershipActivation;
