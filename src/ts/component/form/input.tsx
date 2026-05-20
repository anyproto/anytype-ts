import React, {
	useEffect, useRef, useState, forwardRef, useImperativeHandle, ChangeEvent, SyntheticEvent, KeyboardEvent, FormEvent, FocusEvent, ClipboardEvent
} from 'react';
import Inputmask from 'inputmask';
import * as I from 'Interface';

type InputSize = 28 | 36 | 40 | 52 | 56;

interface Props {
	id?: string;
	name?: string;
	type?: string;
	placeholder?: string;
	value?: string;
	autoComplete?: string;
	maxLength?: number;
	size?: InputSize;
	className?: string;
	multiple?: boolean;
	readonly?: boolean;
	accept?: string;
	maskOptions?: any;
	focusOnMount?: boolean;
	pattern?: string;
	inputMode?: any;
	noValidate?: boolean;
	min?: number;
	max?: number;
	step?: number;
	onCompositionStart?(): void;
	onCompositionEnd?(): void;
	onInput?(e: any, value: string): void;
	onChange?(e: any, value: string): void;
	onPaste?(e: any, value: string): void;
	onCut?(e: any, value: string): void;
	onKeyUp?(e: any, value: string): void;
	onKeyDown?(e: any, value: string): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onFocus?(e: any, value: string): void;
	onBlur?(e: any, value: string): void;
	onSelect?(e: any, value: string): void;
	onClick?(e: any): void;
	onUnmount?(): void;
};

export interface InputRef {
	setValue: (v: string) => void;
	getValue: () => string;
	setType: (v: string) => void;
	setError: (v: boolean) => void;
	focus: (preventScroll?: boolean) => void;
	setFocus: () => void;
	blur: () => void;
	select: () => void;
	setRange: (range: I.TextRange, preventScroll?: boolean) => void;
	getRange: () => I.TextRange;
	getSelectionRect: () => DOMRect | null;
	getNode: () => HTMLInputElement | null;
	isFocused: () => boolean;
};

const Input = forwardRef<InputRef, Props>(({
	id = '',
	name = '',
	type = 'text',
	value: initialValue = '',
	placeholder = '',
	autoComplete = '',
	size = 28,
	className = '',
	readonly = false,
	maxLength = null,
	multiple = false,
	accept = null,
	pattern = null,
	inputMode = null,
	noValidate = true,
	min = 0,
	max = 0,
	step = 0,
	focusOnMount = false,
	maskOptions = null,
	onClick,
	onMouseEnter,
	onMouseLeave,
	onCompositionStart,
	onCompositionEnd,
	onInput,
	onChange,
	onPaste,
	onCut,
	onKeyUp,
	onKeyDown,
	onFocus,
	onBlur,
	onSelect,
	onUnmount,
}, ref) => {

	const [ value, setValue ] = useState(initialValue);
	const [ inputType, setInputType ] = useState(type);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const isFocused = useRef(false);
	const rangeRef = useRef<I.TextRange | null>(null);
	const isComposing = useRef(false);
	const compositionValue = useRef('');
	const cn = [ 'input', `input-${inputType}`, `size${size}`, className ];

	if (readonly) {
		cn.push('isReadonly');
	};

	const focus = (preventScroll?: boolean) => {
		const v = (undefined !== preventScroll) ? preventScroll : true;

		inputRef.current?.focus({ preventScroll: v });
	};

	const handleEvent = (
		handler: ((e: any, value: string) => void) | undefined,
		e: SyntheticEvent<HTMLInputElement>
	) => {
		handler?.(e, String((e.target as HTMLInputElement || e.currentTarget as HTMLInputElement).value || ''));
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);
		handleEvent(onChange, e);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (U.Dom.hasClass(inputRef.current, 'disabled')) {
			return;
		};

		handleEvent(onKeyDown, e);
	};

	const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
		if (U.Dom.hasClass(inputRef.current, 'disabled')) {
			return;
		};

		handleEvent(onKeyUp, e);
	};

	const handleInput = (e: FormEvent<HTMLInputElement>) => {
		handleEvent(onInput, e);
	};

	const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
		if (readonly) {
			return;
		};

		isFocused.current = true;
		addClass('isFocused');
		keyboard.setFocus(true);
		keyboard.disableSelection(true);
		handleEvent(onFocus, e);
	};

	const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
		if (readonly) {
			return;
		};

		isFocused.current = false;
		removeClass('isFocused');
		keyboard.setFocus(false);
		keyboard.disableSelection(false);

		if (isComposing.current) {
			isComposing.current = false;
			compositionValue.current = '';
			keyboard.setComposition(false);
		};

		handleEvent(onBlur, e);
	};

	const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
		e.persist();
		callWithTimeout(() => {
			updateRange(e);
			handleEvent(onPaste, e);
		});
	};

	const handleCut = (e: ClipboardEvent<HTMLInputElement>) => {
		e.persist();
		callWithTimeout(() => {
			updateRange(e);
			handleEvent(onCut, e);
		});
	};

	const handleSelect = (e: SyntheticEvent<HTMLInputElement>) => {
		updateRange(e);
		handleEvent(onSelect, e);
	};

	const handleCompositionStart = () => {
		isComposing.current = true;
		compositionValue.current = inputRef.current?.value || '';
		keyboard.setComposition(true);
		onCompositionStart?.();
	};

	const handleCompositionEnd = (e) => {
		keyboard.setComposition(false);
		onCompositionEnd?.();

		if (isComposing.current) {
			const currentValue = e.target.value;
			const prevValue = compositionValue.current;

			isComposing.current = false;
			compositionValue.current = '';

			if (currentValue !== prevValue) {
				handleChange(e);
			};
		};
	};

	const addClass = (className: string) => {
		U.Dom.addClass(inputRef.current, className);
	};

	const removeClass = (className: string) => {
		U.Dom.removeClass(inputRef.current, className);
	};

	const updateRange = (e: any) => {
		const { selectionStart, selectionEnd } = e.target;
		rangeRef.current = { from: selectionStart, to: selectionEnd };
	};

	const callWithTimeout = (callback: () => void) => {
		setTimeout(() => callback(), 0);
	};

	const getSelectionRect = (): DOMRect | null => {
		const node = inputRef.current;
		if (!node) {
			return null;
		};

		const parent = node.parentElement;
		const selectionRange = rangeRef.current;

		if (!selectionRange || !parent) {
			return null;
		};

		const elementId = `${id || 'input'}-clone`;

		let clone = U.Dom.get(elementId);
		if (!clone) {
			clone = document.createElement('div');
			clone.id = elementId;
			parent.appendChild(clone);
		};

		clone.className = node.className;
		U.Dom.css(clone, {
			position: 'absolute',
			width: 'auto',
			left: `${node.offsetLeft}px`,
			top: `${node.offsetTop}px`,
			visibility: 'hidden',
			whiteSpace: 'pre',
			zIndex: '100',
		});

		clone.textContent = value.substring(0, selectionRange.to);
		const rect = U.Dom.getElementRect(clone);

		clone.remove();
		return rect;
	};

	useEffect(() => {
		if (maskOptions && inputRef.current) {
			new Inputmask(maskOptions.mask, maskOptions).mask(inputRef.current);
		};

		if (focusOnMount) {
			focus();
			keyboard.setFocus(true);
			keyboard.disableSelection(true);
		};

		return () => {
			if (isFocused.current) {
				keyboard.setFocus(false);
				keyboard.disableSelection(false);
			};

			if (isComposing.current) {
				keyboard.setComposition(false);
			};

			onUnmount?.();
		};
	}, []);

	useImperativeHandle(ref, () => ({
		focus: (preventScroll?: boolean) => focus(preventScroll),
		setFocus: () => focus(true),
		blur: () => inputRef.current?.blur(),
		select: () => inputRef.current?.select(),
		setValue: (v: string) => setValue(String(v || '')),
		getValue: () => String(value || ''),
		setType: (v: string) => setInputType(v),
		setError: (hasError: boolean) => U.Dom.toggleClass(inputRef.current, 'withError', hasError),
		getSelectionRect,
		setPlaceholder: (placeholder: string) => { if (inputRef.current) inputRef.current.placeholder = placeholder; },
		setRange: (range: I.TextRange, preventScroll?: boolean) => {
			callWithTimeout(() => {
				focus(preventScroll);
				inputRef.current?.setSelectionRange(range.from, range.to);

				if (inputRef.current) {
					const style = window.getComputedStyle(inputRef.current);
					if (style.direction === 'rtl') {
						inputRef.current.scrollLeft = 0;
					};
				};
			});
		},
		getRange: (): I.TextRange | null => rangeRef.current,
		getNode: () => inputRef.current,
		isFocused: () => isFocused.current,
	}));

	return (
		<input
			ref={inputRef}
			type={inputType}
			name={name}
			id={id}
			placeholder={placeholder}
			value={value}
			className={cn.join(' ')}
			autoComplete={autoComplete ?? name}
			readOnly={readonly}
			maxLength={maxLength}
			multiple={multiple}
			accept={accept}
			pattern={pattern}
			inputMode={inputMode}
			formNoValidate={noValidate}
			onChange={handleChange}
			onKeyUp={handleKeyUp}
			onKeyDown={handleKeyDown}
			onInput={handleInput}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onPaste={handlePaste}
			onCut={handleCut}
			onSelect={handleSelect}
			onCompositionStart={handleCompositionStart}
			onCompositionEnd={handleCompositionEnd}
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			spellCheck={false}
			min={min}
			max={max}
			step={step}
			onDragStart={e => {
				e.preventDefault();
				e.stopPropagation();
			}}
		/>
	);
});

export default Input;
