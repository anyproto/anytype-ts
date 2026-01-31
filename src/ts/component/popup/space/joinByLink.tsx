import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Error, Icon, Input } from 'Component';
import { I, U, translate } from 'Lib';
import $ from 'jquery';

const PopupSpaceJoinByLink = observer(forwardRef<{}, I.Popup>(({ param = {}, getId, close }, ref) => {

	const inputRef = useRef(null);
	const [ error, setError ] = useState('');

	const onKeyUp = () => {
		const v = inputRef.current.getValue();

		$(`#${getId()} .button`).toggleClass('disabled', !v.length);
		setError('');
	};

	const onSubmit = (e: any) => {
		e.preventDefault();

		const route = U.Common.getRouteFromUrl(inputRef.current.getValue());
		if (route) {
			U.Router.go(route, {});
		} else {
			setError(translate('popupSpaceJoinByLinkError'));
		};
	};

	return (
		<>
			<Label text={translate('popupSpaceJoinByLinkLabel')} />
			<form onSubmit={onSubmit}>
				<Icon />
				<Input 
					type="text" 
					ref={inputRef} 
					onKeyUp={onKeyUp} 
					placeholder={translate('popupSpaceJoinByLinkInputPlaceholder')} 
					focusOnMount={true}
				/>
				<Button className="disabled" text={translate('popupInviteRequestRequestToJoin')} onClick={onSubmit} />
			</form>
			<Error text={error} />
		</>
	);

}));

export default PopupSpaceJoinByLink;