import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, KeyboardEvent } from 'react';
import { getRange, setRange } from 'selection-ranges';
import { Icon } from 'Component';

interface Props {
	value?: string;
	className?: string;
	readonly?: boolean;
	isHidden?: boolean;
	checkPin?: boolean;
	placeholder?: string;
	tooltipCopy?: string;
	onKeyDown?: (e: KeyboardEvent) => void;
	onChange?: (phrase: string) => void;
	onToggle?: (isHidden: boolean) => void;
	onCopy?: () => void;
	onClick?: (e: any) => void;
};

interface PhraseRefProps {
	setValue: (value: string) => void;
	getValue: () => string;
	setError: (hasError: boolean) => void;
	focus: () => void;
};

const Phrase = forwardRef<PhraseRefProps, Props>(({
	value = '',
	className = '',
	readonly = false,
	isHidden: initialHidden = false,
	checkPin = false,
	placeholder = '',
	tooltipCopy = translate('commonShowKey'),
	onKeyDown,
	onToggle,
	onCopy,
	onClick,
}, ref) => {

	const [ isHidden, setIsHidden ] = useState(false);
	const [ hasError, setHasError ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const placeholderRef = useRef(null);
	const entryRef = useRef(null);
	const range = useRef(null);
	const phrase = useRef([]);
	const cn = [ 'phraseWrapper', className ];

	if (isHidden) {
		cn.push('isHidden');
	};

	if (hasError) {
		cn.push('hasError');
	};

	if (readonly) {
		cn.push('isReadonly');
	};

	const onClickHandler = (e: any) => {
		focus();

		if (onClick) {
			onClick(e);
		};
	};

	const onKeyDownHandler = (e: KeyboardEvent) => {
		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();
			updateValue();
		});

		keyboard.shortcut('backspace', e, () => {
			e.stopPropagation();

			if (!entryRef.current) {
				return;
			};

			const r = getRange(entryRef.current);
			if (r.start || r.end) {
				return;
			};

			e.preventDefault();

			phrase.current.pop();
			setDummy(dummy + 1);
		});

		placeholderCheck();

		if (onKeyDown) {
			onKeyDown(e);
		};
	};

	const onKeyUp = (e: KeyboardEvent) => {
		placeholderCheck();
	};

	const updateValue = () => {
		const value = getEntryValue();

		if (!value.length) {
			return;
		};

		clear();

		phrase.current = checkValue(phrase.current.concat(value.split(' ')));
		setDummy(dummy + 1);
	};

	const onPaste = (e) => {
		e.preventDefault();

		const cb = e.clipboardData;
		const text = normalizeWhiteSpace(cb.getData('text/plain'));

		clear();
		phrase.current = checkValue(phrase.current.concat(text.split(' ')));
		
		if (text) {
			placeholderHide();
		};

		setDummy(dummy + 1);
	};

	const onBlur = () => {
		placeholderCheck();
	};

	const onFocus = () => {
		placeholderCheck();
	};

	const onSelect = () => {
		if (entryRef.current) {
			range.current = getRange(entryRef.current);
		};
	};

	const onToggleHandler = () => {
		const { pin } = S.Common;
		const onSuccess = () => {
			setIsHidden(!isHidden);

			if (onToggle) {
				onToggle(!isHidden);
			};
		};

		if (isHidden && checkPin && pin) {
			S.Popup.open('pin', { data: { onSuccess } });
		} else {
			onSuccess();
		};
	};

	const checkValue = (v: string[]) => {
		return v.map(it => it.substring(0, J.Constant.count.phrase.letter)).filter(it => it).slice(0, J.Constant.count.phrase.word);
	};

	const setError = (v: boolean) => {
		setHasError(v);
	};

	const focus = () => {
		if (readonly || !entryRef.current) {
			return;
		};

		entryRef.current.focus();
		setRange(entryRef.current, range.current || { start: 0, end: 0 });
	};

	const clear = () => {
		if (entryRef.current) {
			entryRef.current.textContent = '';
		};
	};

	const getEntryValue = () => {
		return normalizeWhiteSpace(entryRef.current?.textContent || '').toLowerCase();
	};

	const normalizeWhiteSpace = (val: string) => {
		return String(val || '').replace(/\s\s+/g, ' ').trim() || '';
	};

	const setValue = (value: string) => {
		const text = normalizeWhiteSpace(value);

		phrase.current = text.length ? text.split(' '): [];
		setDummy(dummy + 1);
	};

	const getValue = () => {
		const entry = getEntryValue();
		const list = checkValue(phrase.current.concat(entry ? entry.split(' ') : []));

		return list.join(' ').trim().toLowerCase();
	};

	const placeholderCheck = () => {
		getValue().length || getEntryValue() ? placeholderHide() : placeholderShow();	
	};

	const placeholderHide = () => {
		if (placeholderRef.current) {
			U.Dom.css(placeholderRef.current, { display: 'none' });
		};
	};

	const placeholderShow = () => {
		if (placeholderRef.current) {
			U.Dom.css(placeholderRef.current, { display: 'flex' });
		};
	};

	useEffect(() => {
		setIsHidden(initialHidden);
		setValue(value);
		focus();
	}, []);

	useEffect(() => {
		placeholderCheck();
	}, [ phrase ]);

	useImperativeHandle(ref, () => ({
		setValue,
		getValue,
		setError,
		focus,
		onToggle: onToggleHandler,
	}));

	return (
		<div 
			className={cn.join(' ')}
			onClick={onClickHandler}
		>
			<div className="phraseInnerWrapper">
				{!phrase.current.length ? <span className="word" /> : ''}
				{phrase.current.map((item: string, i: number) => {
					const word = isHidden ? '•'.repeat(item.length) : item;

					return <span className="word" key={i}>{word}</span>;
				})}
				<span 
					ref={entryRef}
					id="entry"
					contentEditable={true}
					suppressContentEditableWarning={true} 
					onKeyDown={onKeyDownHandler}
					onKeyUp={onKeyUp}
					onPaste={onPaste}
					onBlur={onBlur}
					onFocus={onFocus}
					onSelect={onSelect}
				>
					{'\n'}
				</span>
			</div>

			{placeholder ? <div ref={placeholderRef} id="placeholder" className="placeholder">{placeholder}</div> : ''}
			<Icon name={isHidden ? 'common/eye0' : 'common/eye1'} tooltipParam={{ text: translate('commonShowHide') }} onClick={onToggleHandler} />
			<Icon name="menu/action/copy" className="copy" withBackground={true} tooltipParam={{ text: tooltipCopy }} onClick={onCopy} />
		</div>
	);

});

export default Phrase;
