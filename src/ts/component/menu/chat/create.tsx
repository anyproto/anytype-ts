import React, { forwardRef, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Editable, Button, Error } from 'Component';
import { I, C, J, S, translate, keyboard } from 'Lib';

const MenuChatCreate = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data, className, classNameWrap } = param;
	const details = data.details || {};
	const editableRef = useRef(null);
	const buttonRef = useRef(null);
	const [ error, setError ] = useState('');

	const onKeyDown = (e: KeyboardEvent) => {
		keyboard.shortcut('enter', e, () => onSubmit);
	};

	const onSubmit = () => {
		const name = String(editableRef.current?.getTextValue() || '').trim();

		buttonRef.current?.setLoading(true);

		C.ObjectCreate({ ...details, name }, [], '', J.Constant.typeKey.chatDerived, S.Common.space, (message: any) => {
			buttonRef.current?.setLoading(false);

			if (message.error.code) {
				setError(message.error.description);
			} else {
				close();
			};
		});
	};

	useEffect(() => {
		editableRef.current?.setValue(details.name);
		editableRef.current?.placeholderCheck();
		editableRef.current?.setFocus();
	});

	return (
		<>
			<IconObject 
				id="menu-chat-create-icon" 
				size={96} 
				iconSize={48} 
				object={{ ...details, layout: I.ObjectLayout.Chat }} 
				canEdit={true} 
				noUpload={true}
				menuParam={{ 
					horizontal: I.MenuDirection.Center,
					className, 
					classNameWrap,
					offsetY: 4,
				}}
				onSelect={icon => details.iconEmoji = icon}
			/>

			<Editable 
				ref={editableRef}
				placeholder={translate('menuChatCreatePlaceholder')} 
				focusOnMount={true}
				onKeyDown={onKeyDown}
			/>

			<Button 
				ref={buttonRef}
				text={translate('commonCreateChat')} 
				color="accent" 
				onClick={onSubmit} 
			/>

			<Error text={error} />
		</>
	);

}));

export default MenuChatCreate;