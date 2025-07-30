import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Loader, Error, Icon, Input } from 'Component';
import { I, C, S, translate } from 'Lib';

const PopupMembershipActivation = observer(forwardRef<{}, I.Popup>(({ param = {}, getId, close }, ref) => {

	const { data } = param;
	const { code } = data;
	const inputRef = useRef(null);
	const buttonRef = useRef(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ error, setError ] = useState('');

	const onKeyUp = () => {
		checkButton();
		setError('');
	};

	const checkButton = () => {
		const v = inputRef.current?.getValue();

		buttonRef.current?.setDisabled(!v.length);
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

			S.Popup.replace('membershipActivation', 'membership', { data: { tier: message.tier, code } });
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

			<Icon />

			<Title text={translate('popupMembershipActivationTitle')} />
			<Label text={translate('popupMembershipActivationText')} />

			<Input type="text" ref={inputRef} onKeyUp={onKeyUp} placeholder={translate('popupMembershipActivationPlaceholder')} />

			<div className="buttons">
				<Button ref={buttonRef} className="c36" text={translate('commonContinue')} onClick={onSubmit} />
				<Button className="c36" color="blank" text={translate('commonCancel')} onClick={() => close()} />
			</div>

			<Error text={error} />
		</>
	);

}));

export default PopupMembershipActivation;