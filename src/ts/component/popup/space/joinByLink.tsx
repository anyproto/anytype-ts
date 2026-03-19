import React, { forwardRef, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Error, Input, Icon } from 'Component';
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
			<Icon className="close" onClick={() => close()} />
			<Icon className="join" name="menuSpaceCreateJoin" />
			<div className="stepTitle">{translate('popupSpaceJoinByLinkLabel')}</div>
			<form onSubmit={onSubmit}>
				<Input
					type="text"
					ref={inputRef}
					size={56}
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
