import React, { 
	useEffect, useRef, useState, forwardRef, useImperativeHandle, ChangeEvent, SyntheticEvent, KeyboardEvent, FormEvent, FocusEvent, ClipboardEvent
} from 'react';
import $ from 'jquery';
import Inputmask from 'inputmask';
import { I, keyboard } from 'Lib';

interface Props {
	id?: string;
	name?: string;
	type?: string;
	placeholder?: string;
	value?: string;
	autoComplete?: string;
	maxLength?: number;
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
};

export interface InputRef {
	setValue: (v: string) => void;
	getValue: () => string;
	setType: (v: string) => void;
	setError: (v: boolean) => void;
	focus: () => void;
	blur: () => void;
	select: () => void;
	setRange: (range: I.TextRange) => void;
	getRange: () => I.TextRange;
	getSelectionRect: () => DOMRect | null;
};

const Input = forwardRef<InputRef, Props>(({
	id = '',
	name = '',
	type = 'text',
	value: initialValue = '',
	placeholder = '',
	autoComplete = '',
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
}, ref) => {

	const [ value, setValue ] = useState(initialValue);
	const [ inputType, setInputType ] = useState(type);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const isFocused = useRef(false);
	const rangeRef = useRef<I.TextRange | null>(null);
	const cn = [ 'input', `input-${inputType}`, className ];
	const initialRender = useRef(true);

	if (readonly) {
		cn.push('isReadonly');
	};

	const focus = () => {
		inputRef.current?.focus({ preventScroll: true });
	};

	const handleEvent = (
		handler: ((e: any, value: string) => void) | undefined,
		e: SyntheticEvent<HTMLInputElement>
	) => {
		handler?.(e, String($(e.target || e.currentTarget).val() || ''));
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);
		handleEvent(onChange, e);
	};

	const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
		if ($(inputRef.current).hasClass('disabled')) {
			return;
		};

		handleEvent(onKeyUp, e);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if ($(inputRef.current).hasClass('disabled')) {
			return;
		};

		handleEvent(onKeyDown, e);
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
		keyboard.setComposition(true);
		onCompositionStart?.();
	};

	const handleCompositionEnd = (e) => {
		keyboard.setComposition(false);
		onCompositionEnd?.();

		handleChange(e);
	};

	const addClass = (className: string) => {
		$(inputRef.current).addClass(className);
	};

	const removeClass = (className: string) => {
		$(inputRef.current).removeClass(className);
	};

	const updateRange = (e: any) => {
		const { selectionStart, selectionEnd } = e.target;
		rangeRef.current = { from: selectionStart, to: selectionEnd };
	};

	const callWithTimeout = (callback: () => void) => {
		setTimeout(() => callback(), 0);
	};

	const getSelectionRect = (): DOMRect | null => {
		const node = $(inputRef.current);
		const parent = node.parent();
		const { left, top } = node.position();
		const selectionRange = rangeRef.current;

		if (!selectionRange) {
			return null;
		};

		const elementId = `${id || 'input'}-clone`;

		let clone = parent.find(`#${elementId}`);
		if (!clone.length) {
			clone = $('<div></div>').attr({ id: elementId });
			parent.append(clone);
		};

		clone.attr({ class: node.attr('class') });
		clone.css({
			position: 'absolute',
			width: 'auto',
			left,
			top,
			visibility: 'hidden',
			whiteSpace: 'pre',
			zIndex: 100,
		});

		clone.text(value.substring(0, selectionRange.to));
		const rect = clone.get(0).getBoundingClientRect() as DOMRect;

		clone.remove();
		return rect;
	};

	useEffect(() => {
		if (maskOptions && inputRef.current) {
			new Inputmask(maskOptions.mask, maskOptions).mask($(inputRef.current).get(0));
		};

		if (focusOnMount && inputRef.current) {
			focus();
		};

		return () => {
			if (isFocused.current) {
				keyboard.setFocus(false);
				keyboard.disableSelection(false);
			};
		};
	}, [ maskOptions, focusOnMount ]);

	useEffect(() => {
		if (initialRender.current) {
			initialRender.current = false;
			return;
		};

		onChange?.($.Event('change'), value);
	}, [ value ]);

	useImperativeHandle(ref, () => ({
		focus,
		blur: () => inputRef.current?.blur(),
		select: () => inputRef.current?.select(),
		setValue: (v: string) => setValue(String(v || '')),
		getValue: () => String(value || ''),
		setType: (v: string) => setInputType(v),
		setError: (hasError: boolean) => $(inputRef.current).toggleClass('withError', hasError),
		getSelectionRect,
		setPlaceholder: (placeholder: string) => $(inputRef.current).attr({ placeholder }),
		setRange: (range: I.TextRange) => {
			callWithTimeout(() => {
				focus();
				inputRef.current?.setSelectionRange(range.from, range.to);
			});
		},
		getRange: (): I.TextRange | null => rangeRef.current,
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
		/>
	);
});

export default Input;