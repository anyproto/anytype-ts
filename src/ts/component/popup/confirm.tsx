import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Icon, Label, Button, Checkbox, Error, Input, Editable } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const PopupConfirm = forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { title, text, icon, iconParam, storageKey, onConfirm, onCancel, noCloseOnConfirm, confirmMessage } = data;
	const cn = [ 'wrap' ];
	const [ error, setError ] = useState('');
	const errorText = String(data.error || error || '');
	const n = useRef(0);
	const nodeRef = useRef(null);
	const checkboxRef = useRef(null);
	const inputRef = useRef(null);
	const titleRef = useRef(null);
	const canConfirm = undefined === data.canConfirm ? true : data.canConfirm;
	const canCancel = undefined === data.canCancel ? true : data.canCancel;
	const textConfirm = data.textConfirm || translate('commonOk');
	const textCancel = data.textCancel || translate('commonCancel');
	const colorConfirm = data.colorConfirm || 'black';
	const colorCancel = data.colorCancel || 'blank';
	let iconElement: any = null;

	if (iconParam) {
		iconElement = (
			<Icon
				name={iconParam.name}
				color={iconParam.color}
				size={iconParam.size || 56}
			/>
		);
	} else
	if ('string' == typeof(icon)) {
		iconElement = <Icon className={icon} />;
	} else {
		iconElement = icon;
	};
	const buttonSize = (Number(data.buttonSize) || 36) as 36;

	if (storageKey) {
		cn.push('withCheckbox');
	};

	if (confirmMessage) {
		cn.push('withInput');
	};

	const keyHandler = useRef<(e: any) => void>(null);

	const rebind = () => {
		unbind();
		keyHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keyHandler.current);
	};

	const unbind = () => {
		if (keyHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keyHandler.current);
			keyHandler.current = null;
		};
	};

	const onKeyDown = (e: any) => {
		const buttons = nodeRef.current ? U.Dom.selectAll('.button', nodeRef.current) : [];
		const cmd = keyboard.cmdKey();

		keyboard.shortcut('enter, space', e, (pressed: string) => {
			e.stopPropagation();

			if ((pressed === 'space') && confirmMessage) {
				return;
			};

			const btn = buttons[n.current] as HTMLElement;
			if (btn) {
				btn.click();
			};
		});

		keyboard.shortcut('escape', e, () => {
			e.stopPropagation();
			onCancel?.(e);
		});

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			const dir = [ 'arrowup', 'arrowleft' ].includes(pressed) ? -1 : 1;

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
		
		onConfirm?.();
	};

	const onCheck = (e: any) => {
		const value = checkboxRef.current?.getValue();

		checkboxRef.current?.toggle();
		Storage.set(storageKey, !value);
	};
	
	const onCancelHandler = (e: any) => {
		close();
		onCancel?.();
	};

	const onMouseEnter = (e: any) => {
		const buttons = nodeRef.current ? U.Dom.selectAll('.button', nodeRef.current) : [];

		n.current = Array.from(buttons).indexOf(e.currentTarget);
		setHighlight();
	};

	const onMouseLeave = () => {
		if (!nodeRef.current) {
			return;
		};

		U.Dom.selectAll('.button.hover', nodeRef.current).forEach(el => U.Dom.removeClass(el, 'hover'));
	};

	const setHighlight = () => {
		if (!nodeRef.current) {
			return;
		};

		const buttons = U.Dom.selectAll('.button', nodeRef.current);

		U.Dom.selectAll('.button.hover', nodeRef.current).forEach(el => U.Dom.removeClass(el, 'hover'));

		if (buttons[n.current]) {
			U.Dom.addClass(buttons[n.current], 'hover');
		};
	};

	useEffect(() => {
		keyboard.setFocus(true);
		setHighlight();
		rebind();

		if (title) {
			titleRef.current.setValue(title);
		};

		return () => {
			keyboard.setFocus(false);
			unbind();
		};
	}, []);

	
	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			{iconElement ? (
				<div className="iconWrapper">
					{iconElement}
				</div>
			) : ''}

			<Editable
				ref={titleRef}
				classNameWrap="title"
				readonly={true}
			/>
			<Label className="descr" text={text} />

			{storageKey ? (
				<div className="checkboxWrapper" onClick={onCheck}>
					<Checkbox ref={checkboxRef} value={false} />
					<Label text={translate('commonDoNotShowAgain')} />
				</div>
			) : ''}

			{confirmMessage ? (
				<div className="confirmMessage">
					<Input type="text" ref={inputRef} size={buttonSize} placeholder={confirmMessage} />
				</div>
			) : ''}

			<div className="buttons">
				{canConfirm ? (
					<Button 
						text={textConfirm} 
						color={colorConfirm} 
						size={buttonSize} 
						onClick={onConfirmHandler} 
						onMouseEnter={onMouseEnter} 
						onMouseLeave={onMouseLeave} 
					/>
				) : ''}
				{canCancel ? (
					<Button 
						text={textCancel} 
						color={colorCancel} 
						size={buttonSize} 
						onClick={onCancelHandler} 
						onMouseEnter={onMouseEnter} 
						onMouseLeave={onMouseLeave} 
					/> 
				) : ''}
			</div>

			<Error text={errorText} />
		</div>
	);

});

export default PopupConfirm;
