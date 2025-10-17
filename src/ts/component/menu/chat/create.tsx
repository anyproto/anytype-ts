import React, { forwardRef, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Editable, Button, Error } from 'Component';
import { I, C, J, S, translate, keyboard } from 'Lib';

const MenuChatCreate = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, position } = props;
	const { data, className, classNameWrap } = param;
	const details = data.details || {};
	const editableRef = useRef(null);
	const buttonRef = useRef(null);
	const nameRef = useRef(details.name || '');
	const [ error, setError ] = useState('');
	const isEditing = !!details.id;

	const onKeyDown = (e: KeyboardEvent) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			onSubmit();
		});
	};

	const onKeyUp = (e: KeyboardEvent) => {
		nameRef.current = String(editableRef.current?.getTextValue() || '').trim();
	};

	const onSubmit = () => {
		buttonRef.current?.setLoading(true);

		const cb = (message: any) => {
			buttonRef.current?.setLoading(false);

			if (message.error.code) {
				setError(message.error.description);
			} else {
				if (data.onSubmit) {
					data.onSubmit(message.details);
				};

				close();
			};
		};

		if (isEditing) {
			const keys = [ 'name', 'iconEmoji', 'iconImage' ];

			details.name = nameRef.current;

			if (details.iconImage) {
				details.iconEmoji = '';
			};

			C.ObjectListSetDetails([ details.id ], keys.map(key => ({ key, value: details[key] })), cb);
		} else {
			C.ObjectCreate({ ...details, name: nameRef.current }, [], '', J.Constant.typeKey.chatDerived, S.Common.space, cb);
		};
	};

	const setValue = (v: string) => {
		if (v == translate('defaultNamePage')) {
			v = '';
		};

		editableRef.current?.setValue(v);
		editableRef.current?.placeholderCheck();
		editableRef.current?.setFocus();
	};

	useEffect(() => {
		setValue(nameRef.current);
	}, []);

	useEffect(() => {
		position();
	});

	return (
		<>
			<IconObject 
				id="menu-chat-create-icon" 
				size={96} 
				iconSize={48} 
				object={{ ...details, layout: I.ObjectLayout.Chat }} 
				canEdit={true} 
				menuParam={{ 
					horizontal: I.MenuDirection.Center,
					className, 
					classNameWrap,
					offsetY: 4,
				}}
				onSelect={icon => {
					details.iconEmoji = icon;
					details.iconImage = '';
				}}
				onUpload={hash => {
					details.iconImage = hash;
					details.iconEmoji = '';
				}}
			/>

			<Editable 
				ref={editableRef}
				placeholder={translate('menuChatCreatePlaceholder')} 
				focusOnMount={true}
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
			/>

			<Button 
				ref={buttonRef}
				text={isEditing ? translate('commonSaveChat') : translate('commonCreateChat')} 
				color="accent" 
				onClick={onSubmit} 
			/>

			<Error text={error} />
		</>
	);

}));

export default MenuChatCreate;