import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { getRange, setRange } from 'selection-ranges';
import { I, U, keyboard, Mark } from 'Lib';

interface Props {
	id?: string;
	classNameWrap?: string;
	classNameEditor?: string;
	classNamePlaceholder?: string;
	placeholder?: string;
	readonly?: boolean;
	spellcheck?: boolean;
	maxLength?: number;
	onKeyDown?: (e: any) => void;
	onKeyUp?: (e: any) => void;
	onFocus?: (e: any) => void;
	onBlur?: (e: any) => void;
	onSelect?: (e: any) => void;
	onPaste?: (e: any) => void;
	onMouseDown?: (e: any) => void;
	onMouseUp?: (e: any) => void;
	onInput?: (e: any) => void;
	onDragStart?: (e: any) => void;
	onCompositionStart?: (e: any) => void;
	onCompositionEnd?: (e: any) => void;
};

interface EditableRefProps {
	placeholderCheck: () => void;
	placeholderSet: (v: string) => void;
	placeholderHide: () => void;
	placeholderShow: () => void;
	setValue: (html: string) => void;
	getTextValue: () => string;
	getHtmlValue: () => string;
	getRange: () => I.TextRange;
	setRange: (range: I.TextRange) => void;
	getNode: () => JQuery;
};

const Editable = forwardRef<EditableRefProps, Props>(({
	id = '', 
	classNameWrap = '', 
	classNameEditor = '', 
	classNamePlaceholder = '', 
	readonly = false, 
	placeholder = '', 
	spellcheck = false, 
	maxLength,
	onSelect, 
	onMouseDown, 
	onMouseUp, 
	onDragStart,
	onPaste,
	onInput,
	onKeyDown,
	onKeyUp,
	onFocus,
	onBlur,
	onCompositionStart,
	onCompositionEnd,
}, ref) => {

	const nodeRef = useRef(null);
	const placeholderRef = useRef(null);
	const editableRef = useRef(null);
	const cnw = [ 'editableWrap', classNameWrap ];
	const cne = [ 'editable', classNameEditor ];
	const cnp = [ 'placeholder', classNamePlaceholder ];

	const placeholderCheck = () => {
		const text = getTextValue();
		text && !/^\r?\n$/.test(text) ? placeholderHide() : placeholderShow();
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

	const setValue = (html: string) => {
		$(editableRef.current).get(0).innerHTML = U.Common.sanitize(html);
	};

	const getTextValue = (): string => {
		const obj = Mark.cleanHtml($(editableRef.current).html());
		return String(obj.get(0).innerText || '');
	};

	const getHtmlValue = (): string => {
		return String($(editableRef.current).html() || '');
	};

	const getRangeHandler = (): I.TextRange => {
		const range = getRange($(editableRef.current).get(0) as Element);
		return range ? { from: range.start, to: range.end } : null;
	};

	const setRangeHandler = (range: I.TextRange) => {
		if (!range) {
			return;
		};

		const el = $(editableRef.current).get(0);

		el.focus({ preventScroll: true });
		setRange(el, { start: range.from, end: range.to });
	};

	const onPasteHandler = (e: any) => {
		placeholderCheck();

		if (onPaste) {
			onPaste(e);
		};
	};

	const onInputHandler = (e: any) => {
		placeholderCheck();

		if (onInput) {
			onInput(e);
		};
	};

	const onKeyDownHandler = (e: any): void => {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		if (maxLength) {
			const text = getTextValue();

			if ((text.length >= maxLength) && !keyboard.isSpecial(e) && !keyboard.withCommand(e)) {
				e.preventDefault();
			};
		};

		if (onKeyDown) {
			onKeyDown(e);
		};
	};

	const onKeyUpHandler = (e: any): void => {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		if (onKeyUp) {
			onKeyUp(e);
		};
	};

	const onFocusHandler = (e: any) => {
		keyboard.setFocus(true);

		if (onFocus) {
			onFocus(e);
		};
	};

	const onBlurHandler = (e: any) => {
		keyboard.setFocus(false);

		if (onBlur) {
			onBlur(e);
		};
	};

	const onCompositionStartHandler = (e: any) => {
		keyboard.setComposition(true);

		if (onCompositionStart) {
			onCompositionStart(e);
		};
	};

	const onCompositionEndHandler = (e: any) => {
		keyboard.setComposition(false);

		if (onCompositionEnd) {
			onCompositionEnd(e);
		};
	};

	let editor = null;
	if (readonly) {
		cne.push('isReadonly');

		editor = (
			<div 
				id={id} 
				ref={editableRef}
				className={cne.join(' ')} 
				contentEditable={true}
				suppressContentEditableWarning={true}
				spellCheck={false}
				onMouseUp={onSelect} 
			/>
		);
	} else {
		editor = (
			<div
				id={id}
				ref={editableRef}
				className={cne.join(' ')}
				contentEditable={true}
				suppressContentEditableWarning={true}
				spellCheck={spellcheck}
				onKeyDown={onKeyDownHandler}
				onKeyUp={onKeyUpHandler}
				onFocus={onFocusHandler}
				onBlur={onBlurHandler}
				onSelect={onSelect}
				onPaste={onPasteHandler}
				onMouseUp={onMouseUp}
				onInput={onInputHandler}
				onDragStart={onDragStart}
				onCompositionStart={onCompositionStartHandler}
				onCompositionEnd={onCompositionEndHandler}
			/>
		);
	};

	useImperativeHandle(ref, () => ({
		placeholderCheck,
		placeholderSet,
		placeholderHide,
		placeholderShow,
		setValue,
		getTextValue,
		getHtmlValue,
		getRange: getRangeHandler,
		setRange: setRangeHandler,
		getNode: () => $(nodeRef.current),
	}), []);

	return (
		<div 
			ref={nodeRef}
			className={cnw.join(' ')}
			onMouseDown={onMouseDown}
		>
			{editor}
			<div
				id="placeholder" 
				className={cnp.join(' ')}
				ref={placeholderRef}
			>
				{placeholder}
			</div>
		</div>
	);

});

export default Editable;
