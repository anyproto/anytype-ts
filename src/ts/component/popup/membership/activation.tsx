import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Loader, Error, Icon, Input } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Storage } from 'Lib';
import $ from 'jquery';

const PopupMembershipActivation = observer(forwardRef<{}, I.Popup>(({ param = {}, getId, close }, ref) => {

	const inputRef = useRef(null);
	const [ error, setError ] = useState('');

	const onKeyUp = () => {
		const v = inputRef.current.getValue();

		$(`#${getId()} .button`).toggleClass('disabled', !v.length);
		setError('');
	};

	const onSubmit = () => {
		const route = U.Common.getRouteFromUrl(inputRef.current.getValue());
		const { cid, key } = U.Common.searchParam(route.split('?')[1]);

		if (cid && key) {
			U.Router.go(`/main/invite/?cid=${cid}&key=${key}`, { replace: true });
			return;
		};

		setError(translate('popupSpaceJoinByLinkError'));
	};

	const onCancel = () => {
		close();
	};

	return (
		<>
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
