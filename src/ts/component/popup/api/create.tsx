import React, { forwardRef, useRef, useState } from 'react';
import { Input, Button, Loader, Error, Title, Icon, Textarea } from 'Component';
import * as I from 'Interface';

const PopupApiCreate = forwardRef<{}, I.Popup>(({ param = {}, close }, ref) => {

	const nameRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ key, setKey ] = useState('');
	const iconName = key ? 'popup/header/success' : 'popup/header/create';
	const iconColor = key ? 'lime' : '';
	const title = key ? translate('popupApiCreateSuccess') : translate('popupApiCreateTitle');

	const onKeyDown = (e: any, v: string) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			onSubmit();
		});
	};

	const onCopy = () => {
		U.Common.copyToast(translate('commonPhrase'), key);
		close();
	};

	const onSubmit = () => {
		const name = nameRef.current.getValue();

		if (isLoading) {
			return;
		};

		setIsLoading(true);

		C.AccountLocalLinkCreateApp({ name, scope: I.LocalApiScope.Json }, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				setError(message.error.description);
			} else
			if (message.key) {
				setKey(message.key);
			};
		});
	};

	let input = null;
	let buttons = null;

	if (key) {
		input = (
			<Textarea
				key="inputWithKey"
				ref={nameRef}
				value={key}
				readonly={true}
				onClick={onCopy}
			/>
		);

		buttons = (
			<div className="buttons">
				<Button text={translate('commonCopy')} size={36} onClick={onCopy} />
				<Button text={translate('commonClose')} size={36} color="blank" onClick={() => close()} />
			</div>
		);
	} else {
		input = (
			<Input
				key="inputWithoutKey"
				ref={nameRef}
				value=""
				focusOnMount={true}
				placeholder={translate('popupApiCreatePlaceholder')}
				onKeyDown={onKeyDown}
			/>
		);

		buttons = (
			<div className="buttons">
				<Button text={translate('commonCreate')} size={36} onClick={onSubmit} />
				<Button text={translate('commonCancel')} size={36} color="blank" onClick={() => close()} />
			</div>
		);
	};

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}

			<div className="iconWrapper">
				<Icon name={iconName} color={iconColor} size={56} />
			</div>

			<Title text={title} />

			<div className="nameWrapper">
				{input}
			</div>

			{buttons}
			<Error text={error} />
		</>
	);

});

export default PopupApiCreate;