import React, { forwardRef, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Input, Button, Loader, Error } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Storage } from 'Lib';

const PopupApiCreate = observer(forwardRef<{}, I.Popup>(({ param = {}, close }, ref) => {

	const nameRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);

	const onKeyDown = (e: any, v: string) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			onSubmit();
		});
	};

	const onSubmit = () => {
		const name = nameRef.current.getValue();

		if (isLoading) {
			return;
		};

		setIsLoading(true);

		C.AccountLocalLinkCreateApp({ name }, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			close();
		});
	};

	return (
		<>
			{isLoading ? <Loader id="loader" /> : ''}

			<div className="nameWrapper">
				<Input
					ref={nameRef}
					value=""
					focusOnMount={true}
					onKeyDown={onKeyDown}
					placeholder={translate('defaultNamePage')}
				/>
			</div>

			<div className="buttons">
				<Button text={translate('popupApiCreateCreate')} onClick={onSubmit} />
			</div>

			<Error text={error} />
		</>
	);

}));

export default PopupApiCreate;