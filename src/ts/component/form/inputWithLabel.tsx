import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { Input, Label } from 'Component';
import { I } from 'Lib';

interface Props {
	label: string;
	value: string;
	placeholder?: string;
	readonly?: boolean;
	maxLength?: number;
	onKeyUp?(e: any, value: string): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

interface InputWithLabelRefProps {
	focus(): void;
	blur(): void;
	setValue(v: string): void;
	getValue(): string;
	setRange(range: I.TextRange): void;
	isFocused(): boolean;
};

const InputWithLabel = forwardRef<InputWithLabelRefProps, Props>((props, ref) => {
	const {
		label = '',
		value = '',
		readonly = false,
		onFocus,
		onBlur,
	} = props;

	const nodeRef = useRef(null);
	const inputRef = useRef(null);
	const [ isFocused, setIsFocused ] = useState(false);
	const cn = [ 'inputWithLabel' ];

	if (isFocused) {
		cn.push('isFocused');
	};

	const focus = () => {
		inputRef.current?.focus();
	};

	const blur = () => {
		inputRef.current?.blur();
	};

	const setValue = (v: string) => {
		inputRef.current?.setValue(v);
	};

	const getValue = () => {
		return inputRef.current?.getValue();
	};

	const setRange = (range: I.TextRange) => {
		inputRef.current?.setRange(range);
	};

	const onFocusHandler = (e: any) => {
		if (!readonly) {
			setIsFocused(true);
		};

		if (onFocus) { 
			onFocus(e);
		};
	};
	
	const onBlurHandler = (e: any) => {
		if (!readonly) {
			setIsFocused(false);
		};

		if (onBlur) {
			onBlur(e);
		};
	};

	useEffect(() => inputRef.current.setValue(value), []);

	useImperativeHandle(ref, () => ({
		focus,
		blur,
		setValue,
		getValue,
		setRange,
		isFocused: () => isFocused,
	}));

	return (
		<div
			ref={nodeRef}
			onClick={focus}
			className={cn.join(' ')}
		>
			<div className="inner">
				<Label text={label} />

				<Input
					ref={inputRef}
					{...props}
					onFocus={onFocusHandler}
					onBlur={onBlurHandler}
				/>

			</div>
		</div>
	);

});

export default InputWithLabel;