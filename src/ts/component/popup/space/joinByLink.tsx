import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Loader, Error, Icon, Input } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Storage } from 'Lib';
import $ from 'jquery';

const PopupSpaceJoinByLink = observer(forwardRef<{}, I.Popup>(({ param = {}, close }, ref) => {

	const inputRef = useRef(null)
	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);

	const onKeyUp = () => {
		const v = inputRef.current.getValue();

		$('.popupSpaceJoinByLink .button').toggleClass('disabled', !v.length);
	};

	const onSubmit = () => {
		const url = inputRef.current.getValue();
		const r = U.Common.getRouteFromUrl(url);
		const { cid, key } = U.Common.searchParam(r.split('?')[1]);

		if (cid && key) {
			U.Router.go(`/main/invite/?cid=${cid}&key=${key}`, { replace: true });
			return;
		};

		setError(translate('popupSpaceJoinByLinkError'));
	};

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}
			<Label text={translate('popupSpaceJoinByLinkLabel')} />

			<Icon />

			<Input type="text" ref={inputRef} onKeyUp={onKeyUp} placeholder={translate('popupSpaceJoinByLinkInputPlaceholder')} />

			<Button className="disabled" text={translate('popupInviteRequestRequestToJoin')} onClick={onSubmit} />

			<Error text={error} />
		</>
	);

}));

export default PopupSpaceJoinByLink;
