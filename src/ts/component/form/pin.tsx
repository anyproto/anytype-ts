import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import sha1 from 'sha1';
import { Input } from 'Component';
import { keyboard } from 'Lib';

interface Props {
	isNumeric?: boolean;
	pinLength?: number;
	expectedPin?: string | null;
	focusOnMount?: boolean;
	onSuccess?: (value: string) => void;
	onError?: () => void;
	isVisible?: boolean;
	readonly?: boolean;
};

interface PinRefProps {
	clear: () => void;
	reset: () => void;
	focus: () => void;
	getValue: () => string;
};

const TIMEOUT_DURATION = 150;

const Pin = forwardRef<PinRefProps, Props>(({
	isNumeric = false,
	pinLength = 6,
	expectedPin = null,
	focusOnMount = true,
	isVisible = false,
	readonly = false,
	onSuccess = () => {},
	onError = () => {},
}, ref) => {

	const inputRefs = useRef([]);
	const index = useRef(0);

	const rebind = () => {
		unbind();
		$(window).on('mousedown.pin', e => e.preventDefault());
	};

	const unbind = () => {
		$(window).off('mousedown.pin');
	}; 

	const focus = () => {
		inputRefs.current[index.current].focus();
	};

	const onClick = () => {
		focus();
	};

	/** triggers when all the pin characters have been entered in, resetting state and calling callbacks */
	const check = () => {
		const pin = getValue();
		const success = !expectedPin || (expectedPin === sha1(pin));

		success ? onSuccess(pin) : onError();
	};

	/** returns the pin state stored in the input DOM */
	const getValue = () => {
		return inputRefs.current.map((input) => input.getValue()).join('');
	};

	/** sets all the input boxes to empty string */
	const clear = () => {
		for (const i in inputRefs.current) {
			inputRefs.current[i].setValue('');
		};
	};

	/** resets state */
	const reset = () => {
		index.current = 0;
		clear();
		focus();

		for (const i in inputRefs.current) {
			inputRefs.current[i].setType('text');
		};
	};

	// Input subcomponent methods

	const onInputFocus = (idx: number) => {
		index.current = idx;
	};

	const onInputKeyDown = (e, index: number) => {
		const current = inputRefs.current[index];
		const prev = inputRefs.current[index - 1];

		if (prev) {
			keyboard.shortcut('backspace', e, () => {
				current.setValue('');
				prev.setType('text');
				prev.focus();
			});
		};

		if (isNumeric) {
			keyboard.shortcut('arrowup, arrowdown', e, () => {
				e.preventDefault();
			});
		};
	};

	const onInputKeyUp = () => {
		if (getValue().length === pinLength) {
			check();
		};
	};

	const onInputChange = (index: number, value: string) => {
		const input = inputRefs.current[index];
		const next = inputRefs.current[index + 1];

		let newValue = value;
		if (isNumeric) {
			newValue = newValue.replace(/[^\d]/g, '');
		};
		if (newValue.length > 1) {
			newValue = newValue.slice(0, 1);
		};

		if (newValue != value) {
			input.setValue(newValue);
		};

		if (!newValue) {
			input.setType('text');
			return;
		};

		if (next) {
			next.focus();
		};

		if (!isVisible) {
			window.setTimeout(() => input.setType('password'), TIMEOUT_DURATION);
		};
	};

	const onPaste = async (e: any, index: number) => {
		e.preventDefault();

		const text = await navigator.clipboard.readText();
		const value = String(text || '').split('');

		for (let i = index; i < pinLength; i++) {
			const input = inputRefs.current[i];
			const char = value[i - index] || '';

			input.setValue(char);
			input.setType('text');
		};

		inputRefs.current[pinLength - 1].focus();
		check();
	};

	useImperativeHandle(ref, () => ({
		clear,
		reset,
		focus,
		getValue,
	}));

	useEffect(() => {
		if (focusOnMount) {
			window.setTimeout(() => focus(), 10);
		};

		rebind();
		return () => unbind();
	}, []);

	const props: any = {
		maxLength: 1,
		onKeyUp: onInputKeyUp,
		readonly,
	};

	if (isNumeric) {
		props.inputMode = 'numeric';
	};

	return (
		<div className="pin" onClick={onClick}>
			{Array(pinLength).fill(null).map((_, i) => (
				<Input 
					ref={ref => inputRefs.current[i] = ref} 
					key={i} 
					onPaste={e => onPaste(e, i)}
					onFocus={() => onInputFocus(i)} 
					onKeyDown={e => onInputKeyDown(e, i)} 
					onChange={(_, value) => onInputChange(i, value)}
					{...props}
				/>
			))}
		</div>
	);

});

export default Pin;