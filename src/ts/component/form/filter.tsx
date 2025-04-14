import React, { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import $ from 'jquery';
import { Input, Icon } from 'Component';
import { I, keyboard, translate } from 'Lib';

interface Props {
	id?: string;
	className?: string;
	inputClassName?: string;
	icon?: string;
	value?: string;
	placeholder?: string;
	placeholderFocus?: string;
	tooltipParam?: I.TooltipParam;
	focusOnMount?: boolean;
	onClick?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any, v: string): void;
	onKeyUp?(e: any, v: string): void;
	onChange?(v: string): void;
	onSelect?(e: any): void;
	onClear?(): void;
	onIconClick?(e: any): void;
};

interface FilterRefProps {
	focus(): void;
	blur(): void;
	setActive(v: boolean): void;
	setValue(v: string): void;
	getValue(): string;
	getRange(): I.TextRange;
	setRange(range: I.TextRange): void;
};

const Filter = forwardRef<FilterRefProps, Props>(({
	id = '',
	className = '',
	inputClassName = '',
	icon = '',
	value = '',
	placeholder = translate('commonFilterClick'),
	placeholderFocus = '',
	tooltipParam = {},
	focusOnMount = false,
	onClick,
	onFocus,
	onBlur,
	onKeyDown,
	onKeyUp,
	onChange,
	onSelect,
	onClear,
	onIconClick,
}, ref) => {
	const nodeRef = useRef(null);
	const inputRef = useRef(null);
	const placeholderRef = useRef(null);
	const [ isFocused, setIsFocused ] = useState(false);
	const [ isActive, setIsActive ] = useState(false);
	const cn = [ 'filter', className ];

	if (isFocused) {
		cn.push('isFocused');
	};

	if (isActive) {
		cn.push('isActive');
	};

	let iconObj = null;
	if (icon) {
		iconObj = (
			<Icon 
				className={icon} 
				tooltipParam={tooltipParam}
				onClick={onIconClick} 
			/>
		);
	};

	const focus = () => {
		inputRef.current.focus();
	};

	const blur = () => {
		inputRef.current.blur();
	};

	const onFocusHandler = (e: any) => {
		setIsFocused(true);

		if (placeholderFocus) {
			placeholderSet(placeholderFocus);
		};

		if (onFocus) { 
			onFocus(e);
		};
	};
	
	const onBlurHandler = (e: any) => {
		setIsFocused(false);

		if (placeholderFocus) {
			placeholderSet(placeholder);
		};

		if (onBlur) {
			onBlur(e);
		};
	};

	const onSelectHandler = (e: any) => {
		if (onSelect) {
			onSelect(e);
		};
	};

	const onClearHandler = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		inputRef.current.setValue('');
		inputRef.current.focus();
		
		onChangeHandler(e, '');
		if (onClear) {
			onClear();
		};
	};

	const onChangeHandler = (e: any, v: string) => {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		resize();

		if (onChange) {
			onChange(v);
		};
	};

	const onKeyDownHandler = (e: any, v: string): void => {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		buttonCheck();

		if (onKeyDown) {
			onKeyDown(e, v);
		};
	};

	const onKeyUpHandler = (e: any, v: string): void => {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		buttonCheck();

		if (onKeyUp) {
			onKeyUp(e, v);
		};
	};

	const buttonCheck = () => {
		$(nodeRef.current).toggleClass('active', Boolean(getValue()));
		placeholderCheck();
	};

	const getValue = () => {
		return inputRef.current?.getValue();
	};

	const getRange = (): I.TextRange => {
		return inputRef.current.getRange();
	};

	const setRange = (range: I.TextRange) => {
		inputRef.current.setRange(range);
	};

	const placeholderCheck = () => {
		getValue() ? placeholderHide() : placeholderShow();	
	};

	const placeholderSet = (v: string) => {
		$(placeholderRef.current).text(v);
	};
	
	const placeholderHide = () => {
		$(placeholderRef.current).hide();
	};

	const placeholderShow = () => {
		$(placeholderRef.current).show();
	};

	const resize = () => {
		const ref = $(placeholderRef.current);
		ref.css({ lineHeight: ref.height() + 'px' });
	};

	const init = () => {
		buttonCheck();
		resize();
	};

	useEffect(() => init());

	useImperativeHandle(ref, () => ({
		focus,
		blur,
		setActive: v => setIsActive(v),
		isFocused: () => isFocused,
		setValue: (v: string) => inputRef.current.setValue(v),
		getValue,
		getRange,
		setRange,
	}));

	const val = getValue();

	if (val) {
		cn.push('active');
	};

	return (
		<div
			ref={nodeRef}
			id={id} 
			className={cn.join(' ')}
			onClick={onClick}
		>
			<div className="inner">
				{iconObj}

				<div className="filterInputWrap">
					<Input 
						ref={inputRef}
						id="input"
						className={inputClassName}
						value={value}
						focusOnMount={focusOnMount}
						onFocus={onFocusHandler} 
						onBlur={onBlurHandler} 
						onChange={onChangeHandler} 
						onKeyDown={onKeyDownHandler}
						onKeyUp={onKeyUpHandler}
						onSelect={onSelectHandler}
						onInput={() => placeholderCheck()}
						onCompositionStart={() => placeholderCheck()}
						onCompositionEnd={() => placeholderCheck()}
					/>
					<div ref={placeholderRef} className="placeholder">{placeholder}</div>
				</div>

				<Icon className="clear" onClick={onClearHandler} />
			</div>
			<div className="line" />
		</div>
	);
});

export default Filter;