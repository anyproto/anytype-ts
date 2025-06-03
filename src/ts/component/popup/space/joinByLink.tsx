import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Loader, Error, Icon, Input } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Storage } from 'Lib';
import $ from 'jquery';

const PopupSpaceJoinByLink = observer(forwardRef<{}, I.Popup>(({ param = {}, getId, close }, ref) => {

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

	return (
		<>
			<Label text={translate('popupSpaceJoinByLinkLabel')} />

			<Icon />

			<Input type="text" ref={inputRef} onKeyUp={onKeyUp} placeholder={translate('popupSpaceJoinByLinkInputPlaceholder')} />

			<Button className="disabled" text={translate('popupInviteRequestRequestToJoin')} onClick={onSubmit} />

			<Error text={error} />
		</>
	);

}));

export default PopupSpaceJoinByLink;
