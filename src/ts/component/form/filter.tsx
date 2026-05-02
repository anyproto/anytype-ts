import React, { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import { Input, Icon } from 'Component';
import * as I from 'Interface';

type FilterSize = 28 | 32 | 36;

interface Props {
	id?: string;
	size?: FilterSize;
	className?: string;
	inputClassName?: string;
	iconParam?: I.IconParam;
	value?: string;
	placeholder?: string;
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
	size = 28,
	className = '',
	inputClassName = '',
	iconParam,
	value = '',
	placeholder = translate('commonFilterClick'),
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
	const [ isFocused, setIsFocused ] = useState(false);
	const [ isActive, setIsActive ] = useState(false);
	const cn = [ 'filter', `size${size}`, className ];

	if (isFocused) {
		cn.push('isFocused');
	};

	if (isActive) {
		cn.push('isActive');
	};

	let iconObj = null;
	if (iconParam) {
		iconObj = (
			<Icon
				name={iconParam.name}
				color={iconParam.color}
				size={iconParam.size}
				width={iconParam.width}
				height={iconParam.height}
				tooltipParam={tooltipParam}
				onClick={onIconClick}
			/>
		);
		cn.push('withIcon');
	};

	const focus = () => {
		inputRef.current?.focus();
	};

	const blur = () => {
		inputRef.current.blur();
	};

	const onFocusHandler = (e: any) => {
		setIsFocused(true);
		onFocus?.(e);
	};
	
	const onBlurHandler = (e: any) => {
		setIsFocused(false);
		onBlur?.(e);
	};

	const clear = () => {
		inputRef.current?.setValue('');
		inputRef.current?.focus();
		
		onChangeHandler(null, '');
		onClear?.();
	};

	const onClearHandler = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		clear();
	};

	const onChangeHandler = (e: any, v: string) => {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		onChange?.(v);
	};

	const onCompositionEndHandler = () => {
		const v = getValue();
		if (v !== undefined) {
			onChange?.(v);
		};
	};

	const onKeyDownHandler = (e: any, v: string): void => {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		buttonCheck();

		keyboard.shortcut('arrowup, arrowdown', e, () => {
			e.preventDefault();
		});
		
		keyboard.shortcut('escape', e, () => {
			clear();
		});

		onKeyDown?.(e, v);
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
		U.Dom.toggleClass(nodeRef.current, 'active', Boolean(getValue()));
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

	const placeholderSet = (v: string) => {
		const node = inputRef.current?.getNode();
		if (node) {
			node.setAttribute('placeholder', v);
		};
	};
	
	const init = () => {
		buttonCheck();
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
						onCompositionEnd={onCompositionEndHandler}
						onKeyDown={onKeyDownHandler}
						onKeyUp={onKeyUpHandler}
						onSelect={onSelect}
						placeholder={placeholder}
					/>
				</div>

				<Icon name="common/clear" onClick={onClearHandler} />
			</div>
			<div className="line" />
		</div>
	);
});

export default Filter;
