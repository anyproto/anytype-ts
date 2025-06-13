import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Loader, Error, Icon, Input } from 'Component';
import { I, C, S, U, J, translate, Action } from 'Lib';
import $ from 'jquery';

const PopupMembershipActivation = observer(forwardRef<{}, I.Popup>(({ param = {}, getId, close }, ref) => {

	const inputRef = useRef(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ error, setError ] = useState('');

	const onKeyUp = () => {
		const v = inputRef.current.getValue();

		$(`#${getId()} .button`).toggleClass('disabled', !v.length);
		setError('');
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

	const onCancel = () => {
		close();
	};

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}

			<Icon />

			<Title text={translate('popupMembershipActivationTitle')} />
			<Label text={translate('popupMembershipActivationText')} />

			<Input type="text" ref={inputRef} onKeyUp={onKeyUp} placeholder={translate('popupMembershipActivationPlaceholder')} />

			<div className="buttons">
				<Button className="c36 disabled" text={translate('commonContinue')} onClick={onSubmit} />
				<Button className="c36" color="blank" text={translate('commonCancel')} onClick={onCancel} />
			</div>

			<Error text={error} />
		</>
	);

}));

export default PopupMembershipActivation;
