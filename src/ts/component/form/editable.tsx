import * as React from 'react';
import raf from 'raf';
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

class Editable extends React.Component<Props> {

	_isMounted = false;
	node: any = null;
	refPlaceholder = null;
	refEditable = null;

	constructor (props: Props) {
		super(props);

		this.onInput = this.onInput.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render () {
		const { 
			id, classNameWrap, classNameEditor, classNamePlaceholder, readonly, placeholder, spellcheck, onSelect, onPaste, 
			onMouseDown, onMouseUp, onDragStart
		} = this.props;
		const cnw = [ 'editableWrap' ];
		const cne = [ 'editable' ];
		const cnp = [ 'placeholder' ];

		if (classNameWrap) {
			cnw.push(classNameWrap);
		};

		if (classNameEditor) {
			cne.push(classNameEditor);
		};

		if (classNamePlaceholder) {
			cnp.push(classNamePlaceholder);
		};

		let editor = null;
		if (readonly) {
			cne.push('isReadonly');

			editor = (
				<div 
					id={id} 
					ref={ref => this.refEditable = ref}
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
					ref={ref => this.refEditable = ref}
					className={cne.join(' ')}
					contentEditable={true}
					suppressContentEditableWarning={true}
					spellCheck={spellcheck}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onFocus={this.onFocus}
					onBlur={this.onBlur}
					onSelect={onSelect}
					onPaste={onPaste}
					onMouseUp={onMouseUp}
					onInput={this.onInput}
					onDragStart={onDragStart}
					onCompositionStart={this.onCompositionStart}
					onCompositionEnd={this.onCompositionEnd}
				/>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				className={cnw.join(' ')}
				onMouseDown={onMouseDown}
			>
				{editor}
				<div
					id="placeholder" 
					className={cnp.join(' ')}
					ref={ref => this.refPlaceholder = ref}
				>
					{placeholder}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	placeholderCheck () {
		this.getTextValue() ? this.placeholderHide() : this.placeholderShow();	
	};

	placeholderSet (v: string) {
		$(this.refPlaceholder).text(v);
	};
	
	placeholderHide () {
		$(this.refPlaceholder).hide();
	};

	placeholderShow () {
		$(this.refPlaceholder).show();
	};

	setValue (html: string) {
		$(this.refEditable).get(0).innerHTML = U.Common.sanitize(html);
	};

	getTextValue (): string {
		const obj = Mark.cleanHtml($(this.refEditable).html());
		return String(obj.get(0).innerText || '');
	};

	getHtmlValue () : string {
		return String($(this.refEditable).html() || '');
	};

	getRange (): I.TextRange {
		const range = getRange($(this.refEditable).get(0) as Element);
		return range ? { from: range.start, to: range.end } : null;
	};

	setRange (range: I.TextRange) {
		if (!range) {
			return;
		};

		raf(() => {
			const el = $(this.refEditable).get(0);

			el.focus({ preventScroll: true });
			setRange(el, { start: range.from, end: range.to });
		});
	};

	onInput (e: any) {
		const { onInput } = this.props;

		this.placeholderCheck();

		if (onInput) {
			onInput(e);
		};
	};

	onKeyDown (e: any): void {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		const { maxLength, onKeyDown } = this.props;

		if (maxLength) {
			const text = this.getTextValue();
			if ((text.length >= maxLength) && !keyboard.isSpecial(e)) {
				e.preventDefault();
			};
		};

		if (onKeyDown) {
			onKeyDown(e);
		};
	};

	onKeyUp (e: any): void {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		if (this.props.onKeyUp) {
			this.props.onKeyUp(e);
		};
	};

	onFocus (e: any) {
		keyboard.setFocus(true);

		if (this.props.onFocus) {
			this.props.onFocus(e);
		};
	};

	onBlur (e: any) {
		keyboard.setFocus(false);

		if (this.props.onBlur) {
			this.props.onBlur(e);
		};
	};

	onCompositionStart (e: any) {
		keyboard.setComposition(true);

		if (this.props.onCompositionStart) {
			this.props.onCompositionStart(e);
		};
	};

	onCompositionEnd (e: any) {
		keyboard.setComposition(false);

		if (this.props.onCompositionEnd) {
			this.props.onCompositionEnd(e);
		};
	};

};

export default Editable;
