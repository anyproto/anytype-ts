import React, { forwardRef, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Input, Button, Loader, Error, Phrase } from 'Component';
import { I, C, U, translate, keyboard } from 'Lib';

const PopupApiCreate = observer(forwardRef<{}, I.Popup>(({ param = {}, close }, ref) => {

	const nameRef = useRef(null);
	const phraseRef = useRef(null);
	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ key, setKey ] = useState('');
	const cn = [ 'wrap' ];

	if (key) {
		cn.push('withKey');
	};

	const onKeyDown = (e: any, v: string) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			onSubmit();
		});
	};

	const onToggle = (isHidden: boolean) => {
		if (!isHidden) {
			U.Common.copyToast(translate('commonPhrase'), phraseRef.current.getValue());
		};
	};

	const onCopy = () => {
		phraseRef.current.onToggle();
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

	return (
		<div className={cn.join(' ')}>
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

			{key ? (
				<>
					<div className="inputs" onClick={onCopy}>
						<Phrase
							ref={phraseRef}
							value={key}
							readonly={true}
							isHidden={true}
							checkPin={true}
							onToggle={onToggle}
						/>
					</div>

					<div className="buttons">
						<Button text={translate('commonOk')} onClick={() => close()} />
					</div>
				</>
			) : (
				<div className="buttons">
					<Button text={translate('popupApiCreateCreate')} onClick={onSubmit} />
				</div>
			)}

			<Error text={error} />
		</div>
	);

}));

export default PopupApiCreate;