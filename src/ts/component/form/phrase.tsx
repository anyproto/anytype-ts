import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { getRange, setRange } from 'selection-ranges';
import { Icon } from 'Component';
import { J, S, keyboard, Storage } from 'Lib';

interface Props {
	value?: string;
	className?: string;
	readonly?: boolean;
	isHidden?: boolean;
	checkPin?: boolean;
	placeholder?: string;
	onKeyDown?: (e: React.KeyboardEvent) => void;
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

const COLORS = [
	'pink',
	/*
	'orange',
	'red',
	'purple',
	'blue',
	'ice',
	'lime',
	*/
];

const Phrase = forwardRef<PhraseRefProps, Props>(({
	value = '',
	className = '',
	readonly = false,
	isHidden: initialHidden = false,
	checkPin = false,
	placeholder = '',
	onKeyDown,
	onChange,
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

	const onKeyDownHandler = (e: React.KeyboardEvent) => {
		const entry = $(entryRef.current);

		keyboard.shortcut('space, enter', e, () => {
			e.preventDefault();
			updateValue();
		});

		keyboard.shortcut('backspace', e, () => {
			e.stopPropagation();

			const range = getRange(entry.get(0));
			if (range.start || range.end) {
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

	const onKeyUp = (e: React.KeyboardEvent) => {
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

		const cb = e.clipboardData || e.originalEvent.clipboardData;
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
		const entry = $(entryRef.current);

		if (entry.length) {
			range.current = getRange(entry.get(0));
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
		if (readonly) {
			return;
		};

		const entry = $(entryRef.current);

		entry.trigger('focus');
		setRange(entry.get(0), range.current || { start: 0, end: 0 });
	};

	const clear = () => {
		$(entryRef.current).text('');
	};

	const getEntryValue = () => {
		return normalizeWhiteSpace($(entryRef.current).text()).toLowerCase();
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
		return phrase.current.join(' ').trim().toLowerCase();
	};

	const placeholderCheck = () => {
		getValue().length || getEntryValue() ? placeholderHide() : placeholderShow();	
	};

	const placeholderHide= () => {
		$(placeholderRef.current).hide();
	};

	const placeholderShow = () => {
		$(placeholderRef.current).show();
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
					const color = COLORS[i % COLORS.length];
					const cn = isHidden ? `bg bg-${color}` : `textColor textColor-${color}`;
					const word = isHidden ? '•'.repeat(item.length) : item;

					return (
						<span className={[ 'word', cn ].join(' ')} key={i}>
							{word}
						</span>
					);
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
			<Icon className={[ (isHidden ? 'see' : 'hide'), 'withBackground' ].join(' ')} onClick={onToggleHandler} />
			<Icon className="copy withBackground" onClick={onCopy} />
		</div>
	);

});

export default Phrase;