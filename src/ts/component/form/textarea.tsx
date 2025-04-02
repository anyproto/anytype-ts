import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { keyboard } from 'Lib';

interface Props {
	id?: string;
	name?: string;
	placeholder?: string;
	rows?: number;
	value?: string;
	autoComplete?: string;
	maxLength?: number;
	readonly?: boolean;
	className?: string;
	onChange?(e: any, value: string): void;
	onKeyDown?(e: any, value: string): void;
	onKeyUp?(e: any, value: string): void;
	onInput?(e: any, value: string): void;
	onFocus?(e: any, value: string): void;
	onBlur?(e: any, value: string): void;
	onCopy?(e: any, value: string): void;
	onPaste?(e: any): void;
};

interface TextareaRefProps {
	focus(): void;
	select(): void;
	getValue(): string;
	setError(v: boolean): void;
	addClass(v: string): void;
	removeClass(v: string): void;
};

const Textarea = forwardRef<TextareaRefProps, Props>(({
	id = '',
	name = '',
	placeholder = '',
	className = '',
	rows = null,
	value: initialValue = '',
	autoComplete = null,
	maxLength = null,
	readonly = false,
	onChange,
	onKeyDown,
	onKeyUp,
	onInput,
	onFocus,
	onBlur,
	onCopy,
	onPaste,
}, ref) => {
	const [ value, setValue ] = useState(initialValue);
	const nodeRef = useRef(null);
	const cn = [ 'textarea' ];

	if (className) {
		cn.push(className);
	};

	const onChangeHandler = (e: any) => {
		setValue(e.target.value);
		if (onChange) {
			onChange(e, e.target.value);
		};
	};

	const onKeyDownHandler = (e: any) => {
		setValue(e.target.value);
		if (onKeyDown) {
			onKeyDown(e, e.target.value);
		};
	};

	const onKeyUpHandler = (e: any) => {
		setValue(e.target.value);
		if (onKeyUp) {
			onKeyUp(e, e.target.value);
		};
	};

	const onInputHandler = (e: any) => {
		if (onInput) {
			onInput(e, e.target.value);
		};
	};

	const onFocusHandler = (e: any) => {
		if (onFocus) {
			onFocus(e, value);
		};
		keyboard.setFocus(true);
		$(nodeRef.current).addClass('isFocused');
	};

	const onBlurHandler = (e: any) => {
		if (onBlur) {
			onBlur(e, value);
		};
		keyboard.setFocus(false);
		$(nodeRef.current).removeClass('isFocused');
	};

	const onCopyHandler = (e: any) => {
		if (onCopy) {
			onCopy(e, value);
		};
	};

	const onPasteHandler = (e: any) => {
		if (onPaste) {
			onPaste(e);
		};
	};

	const focus = () => {
		window.setTimeout(() => nodeRef.current.focus({ preventScroll: true }));
	};
	
	const select = () => {
		window.setTimeout(() => nodeRef.current.select());
	};
	
	const setError = (v: boolean) => {
		$(nodeRef.current).toggleClass('withError', v);
	};

	const addClass = (v: string) => {
		$(nodeRef.current).addClass(v);
	};
	
	const removeClass = (v: string) => {
		$(nodeRef.current).removeClass(v);
	};
	
	useEffect(() => setValue(initialValue));
	useImperativeHandle(ref, () => ({ 
		focus, 
		select, 
		getValue: () => value, 
		setError, 
		addClass, 
		removeClass 
	}));

	return (
		<textarea
			ref={nodeRef}
			name={name}
			id={id}
			placeholder={placeholder}
			value={value}
			rows={rows}
			className={cn.join(' ')}
			autoComplete={autoComplete}
			readOnly={readonly}
			onChange={onChangeHandler}
			onKeyDown={onKeyDownHandler}
			onKeyUp={onKeyUpHandler}
			onInput={onInputHandler}
			onFocus={onFocusHandler}
			onBlur={onBlurHandler}
			onCopy={onCopyHandler}
			onPaste={onPasteHandler}
			maxLength={maxLength ? maxLength : undefined}
			spellCheck={false}
		/>
	);
});

export default Textarea;
