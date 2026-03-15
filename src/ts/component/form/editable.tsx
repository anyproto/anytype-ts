import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { getRange, setRange } from 'selection-ranges';
import { I, U, keyboard, Mark } from 'Lib';
import raf from 'raf';

interface Props {
	id?: string;
	classNameWrap?: string;
	classNameEditor?: string;
	classNamePlaceholder?: string;
	placeholder?: string;
	readonly?: boolean;
	spellcheck?: boolean;
	maxLength?: number;
	focusOnMount?: boolean;
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
	onCompositionEnd?: (e: any, value: string, range: I.TextRange) => void;
	onBeforeInput?: (e: any) => void;
};

interface EditableRefProps {
	placeholderCheck: () => void;
	placeholderSet: (v: string) => void;
	placeholderHide: () => void;
	placeholderShow: () => void;
	setFocus: () => void;
	setBlur: () => void;
	setValue: (html: string) => void;
	getTextValue: () => string;
	getHtmlValue: () => string;
	getRange: () => I.TextRange;
	setRange: (range: I.TextRange) => void;
	getNode: () => JQuery;
	isFocused: () => boolean;
	isAtDomEnd: () => boolean;
	isAtDomStart: () => boolean;
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
	focusOnMount = false,
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
	onBeforeInput,
}, ref) => {

	const nodeRef = useRef(null);
	const placeholderRef = useRef(null);
	const editableRef = useRef(null);
	const isFocused = useRef(false);
	const cnw = [ 'editableWrap', classNameWrap ];
	const cne = [ 'editable', classNameEditor ];
	const cnp = [ 'placeholder', classNamePlaceholder ];
	const justEndedComposition = useRef(false);

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

	const setFocus = () => {
		const l = getTextValue().length;

		raf(() => setRangeHandler({ from: l, to: l }));
	};

	const setBlur = () => {
		U.Common.clearSelection();
	};

	const setValue = (html: string) => {
		editableRef.current.innerHTML = U.String.sanitize(html, true);
	};

	const getTextValue = (): string => {
		const obj = Mark.cleanHtml($(editableRef.current).html());

		let t = String(obj.get(0).innerText || '');
		if (t == '\n') {
			t = '';
		};

		// Safety: strip any remaining ZWS that survived cleanHtml
		t = t.replace(/\u200B/g, '');

		return t;
	};

	const getHtmlValue = (): string => {
		return String(editableRef.current.innerHTML || '');
	};

	const getRangeHandler = (): I.TextRange => {
		const range = getRange(editableRef.current);
		if (!range) {
			return null;
		};

		// Convert DOM offsets (with ZWS) to model offsets (without ZWS)
		if (Mark.hasZws(editableRef.current)) {
			return {
				from: Mark.domToModel(range.start, editableRef.current),
				to: Mark.domToModel(range.end, editableRef.current),
			};
		};

		return { from: range.start, to: range.end };
	};

	const setRangeHandler = (range: I.TextRange) => {
		if (!range || !editableRef.current) {
			return;
		};

		editableRef.current.focus({ preventScroll: true });

		// Convert model offsets (without ZWS) to DOM offsets (with ZWS)
		if (Mark.hasZws(editableRef.current)) {
			const domFrom = Mark.modelToDom(range.from, editableRef.current);
			const domTo = Mark.modelToDom(range.to, editableRef.current);

			setRange(editableRef.current, { start: domFrom, end: domTo });
		} else {
			setRange(editableRef.current, { start: range.from, end: range.to });
		};

		// Fix cursor landing inside contenteditable="false" elements (emoji/mention marks)
		if (range.from == range.to) {
			const sel = window.getSelection();

			if (sel && sel.rangeCount) {
				const r = sel.getRangeAt(0);
				const container = r.startContainer.nodeType === Node.ELEMENT_NODE ? r.startContainer as HTMLElement : r.startContainer.parentElement;
				const nonEditable = container?.closest?.('[contenteditable="false"]');

				if (nonEditable && editableRef.current.contains(nonEditable)) {
					r.setStartAfter(nonEditable);
					r.setEndAfter(nonEditable);
					sel.removeAllRanges();
					sel.addRange(r);
				};
			};
		};
	};

	const onPasteHandler = (e: any) => {
		placeholderCheck();

		if (onPaste) {
			onPaste(e);
		};
	};

	const onInputHandler = (e: any) => {
		// If composition just ended, skip this input event
		if (justEndedComposition.current) {
			justEndedComposition.current = false;
			return;
		};

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
		isFocused.current = true;

		if (onFocus) {
			onFocus(e);
		};
	};

	const onBlurHandler = (e: any) => {
		keyboard.setFocus(false);
		isFocused.current = false;

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
		justEndedComposition.current = true;

		if (onCompositionEnd) {
			onCompositionEnd(e, getTextValue(), getRangeHandler());
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
				onBeforeInput={onBeforeInput}
			/>
		);
	};

	useEffect(() => {
		if (focusOnMount && !readonly) {
			setFocus();
		};
	}, []);

	const isAtDomEnd = (): boolean => {
		if (!editableRef.current || !Mark.hasZws(editableRef.current)) {
			return true;
		};

		const range = getRange(editableRef.current);
		if (!range) {
			return true;
		};

		return range.end >= (editableRef.current.textContent || '').length;
	};

	const isAtDomStart = (): boolean => {
		if (!editableRef.current || !Mark.hasZws(editableRef.current)) {
			return true;
		};

		const range = getRange(editableRef.current);
		if (!range) {
			return true;
		};

		return range.start <= 0;
	};

	useImperativeHandle(ref, () => ({
		placeholderCheck,
		placeholderSet,
		placeholderHide,
		placeholderShow,
		setFocus,
		setBlur,
		setValue,
		getTextValue,
		getHtmlValue,
		getRange: getRangeHandler,
		setRange: setRangeHandler,
		getNode: () => $(nodeRef.current),
		isFocused: () => isFocused.current,
		isAtDomEnd,
		isAtDomStart,
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
