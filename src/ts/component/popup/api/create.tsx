import React, { forwardRef, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Input, Button, Loader, Error, Title, Icon, Textarea } from 'Component';
import { I, C, U, translate, keyboard } from 'Lib';

const PopupApiCreate = observer(forwardRef<{}, I.Popup>(({ param = {}, close }, ref) => {

	const nameRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ key, setKey ] = useState('');
	const icon = key ? 'success' : 'create';
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
				<Button text={translate('commonCopy')} className="c36" onClick={onCopy} />
				<Button text={translate('commonClose')} className="c36" color="blank" onClick={() => close()} />
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
				<Button text={translate('commonCreate')} className="c36" onClick={onSubmit} />
				<Button text={translate('commonCancel')} className="c36" color="blank" onClick={() => close()} />
			</div>
		);
	};

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}

			<div className="iconWrapper">
				<Icon className={icon} />
			</div>

			<Title text={title} />

			<div className="nameWrapper">
				{input}
			</div>

			{buttons}
			<Error text={error} />
		</>
	);

}));

export default PopupApiCreate;