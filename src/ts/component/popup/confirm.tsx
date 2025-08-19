import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Title, Icon, Label, Button, Checkbox, Error, Input } from 'Component';
import { I, keyboard, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';

const PopupConfirm = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { title, text, icon, storageKey, onConfirm, onCancel, noCloseOnConfirm, confirmMessage } = data;
	const cn = [ 'wrap' ];
	const [ error, setError ] = useState('');
	const errorText = String(data.error || error || '');
	const n = useRef(0);
	const nodeRef = useRef(null);
	const checkboxRef = useRef(null);
	const inputRef = useRef(null);
	const canConfirm = undefined === data.canConfirm ? true : data.canConfirm;
	const canCancel = undefined === data.canCancel ? true : data.canCancel;
	const textConfirm = data.textConfirm || translate('commonOk');
	const textCancel = data.textCancel || translate('commonCancel');
	const colorConfirm = data.colorConfirm || 'black';
	const colorCancel = data.colorCancel || 'blank';
	const bgColor = data.bgColor || '';

	if (storageKey) {
		cn.push('withCheckbox');
	};

	if (confirmMessage) {
		cn.push('withInput');
	};

	const rebind = () => {
		unbind();
		$(window).on('keydown.confirm', e => onKeyDown(e));
	};

	const unbind = () => {
		$(window).off('keydown.confirm');
	};

	const onKeyDown = (e: any) => {
		const node = $(nodeRef.current);
		const cmd = keyboard.cmdKey();
		const buttons = node.find('.button');

		keyboard.shortcut('enter, space', e, (pressed: string) => {
			e.stopPropagation();

			if ((pressed === 'space') && confirmMessage) {
				return;
			};

			if (buttons[n.current]) {
				$(buttons[n.current]).trigger('click');
			};
		});

		keyboard.shortcut('escape', e, () => {
			e.stopPropagation();
			onCancel?.(e);
		});

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			const dir = [ 'arrowup', 'arrowleft' ].includes(pressed) ? 1 : -1;

			if (buttons.length < 2) {
				return;
			};

			n.current += dir;
			if (n.current < 0) {
				n.current = buttons.length - 1;
			};
			if (n.current > buttons.length - 1) {
				n.current = 0;
			};

			setHighlight();
		});

		keyboard.shortcut(`${cmd}+c`, e, () => {
			e.stopPropagation();
		});
	};
	
	const onConfirmHandler = (e: any) => {
		if (confirmMessage) {
			const value = inputRef.current?.getValue();

			if (value != confirmMessage) {
				setError(translate('popupConfirmConfirmationTextError'));
				return;
			};
		};
		
		e.preventDefault();
		if (!noCloseOnConfirm) {
			close();
		};
		
		if (onConfirm) {
			onConfirm();
		};
	};

	const onCheck = (e: any) => {
		const value = checkboxRef.current?.getValue();

		checkboxRef.current?.toggle();
		Storage.set(storageKey, !value);
	};
	
	const onCancelHandler = (e: any) => {
		close();

		if (onCancel) {
			onCancel();
		};
	};

	const onMouseEnter = (e: any) => {
		const node = $(nodeRef.current);
		const buttons = node.find('.button');

		n.current = buttons.index(e.currentTarget);
		setHighlight();
	};

	const setHighlight = () => {
		const node = $(nodeRef.current);
		const buttons = node.find('.button');

		node.find('.button.hover').removeClass('hover');

		if (buttons[n.current]) {
			$(buttons[n.current]).addClass('hover');
		};
	};

	useEffect(() => {
		keyboard.setFocus(true);
		setHighlight();
		rebind();

		return () => {
			keyboard.setFocus(false);
			unbind();
		};
	}, []);
	
	return (
		<div ref={nodeRef} className={[ 'wrap', (storageKey ? 'withCheckbox' : '') ].join(' ')}>
			{icon ? (
				<div className={[ 'iconWrapper', bgColor ].join(' ')}>
					<Icon className={icon} />
				</div>
			) : ''}
			<Title text={title} />
			<Label className="descr" text={text} />

			{storageKey ? (
				<div className="checkboxWrapper" onClick={onCheck}>
					<Checkbox ref={checkboxRef} value={false} />
					<Label text={translate('commonDoNotShowAgain')} />
				</div>
			) : ''}

			{confirmMessage ? (
				<div className="confirmMessage">
					<Input type="text" ref={inputRef} placeholder={confirmMessage} />
				</div>
			) : ''}

			<div className="buttons">
				{canConfirm ? <Button text={textConfirm} color={colorConfirm} className="c36" onClick={onConfirmHandler} onMouseEnter={onMouseEnter} /> : ''}
				{canCancel ? <Button text={textCancel} color={colorCancel} className="c36" onClick={onCancelHandler} onMouseEnter={onMouseEnter} /> : ''}
			</div>

			<Error text={errorText} />
		</div>
	);

}));

export default PopupConfirm;