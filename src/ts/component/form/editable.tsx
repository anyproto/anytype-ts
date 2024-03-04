import * as React from 'react';
import { getRange, setRange } from 'selection-ranges';
import { I, Mark, UtilCommon } from 'Lib';

interface Props {
	id?: string;
	classNameWrap?: string;
	classNameEditor?: string;
	classNamePlaceholder?: string;
	placeholder?: string;
	readonly?: boolean;
	spellcheck?: boolean;
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
	placeholder: any = null;
	editable: any = null;
	composition = false;

	constructor (props: Props) {
		super(props);

		this.onInput = this.onInput.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render () {
		const { 
			id, classNameWrap, classNameEditor, classNamePlaceholder, readonly, placeholder, spellcheck, onFocus, onBlur, onSelect, onPaste, 
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
					className={cne.join(' ')}
					contentEditable={true}
					suppressContentEditableWarning={true}
					spellCheck={spellcheck}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onFocus={onFocus}
					onBlur={onBlur}
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
				<div id="placeholder" className={cnp.join(' ')}>{placeholder}</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	init () {
		const pl = this.placeholder ? this.placeholder.length : 0;
		const el = this.editable ? this.editable.length : 0;

		if (pl && el) {
			return;
		};

		const node = $(this.node);
		if (!pl) {
			this.placeholder = node.find('#placeholder');
		};
		if (!el) {
			this.editable = node.find('.editable');
		};
	};

	placeholderCheck () {
		this.getTextValue() ? this.placeholderHide() : this.placeholderShow();	
	};

	placeholderSet (v: string) {
		this.placeholder.text(v);
	};
	
	placeholderHide () {
		this.placeholder.hide();
	};

	placeholderShow () {
		this.placeholder.show();
	};

	setValue (html: string) {
		this.editable.get(0).innerHTML = UtilCommon.sanitize(html);
	};

	getTextValue (): string {
		const obj = Mark.cleanHtml(this.editable.html());
		return String(obj.get(0).innerText || '');
	};

	getHtmlValue () : string {
		return String(this.editable.html() || '');
	};

	getRange (): I.TextRange {
		const range = getRange(this.editable.get(0) as Element);
		return range ? { from: range.start, to: range.end } : null;
	};

	setRange (range: I.TextRange) {
		const el = this.editable.get(0);

		el.focus({ preventScroll: true });
		setRange(el, { start: range.from, end: range.to });
	};

	onInput (e: any) {
		const { onInput } = this.props;

		this.placeholderCheck();

		if (onInput) {
			onInput(e);
		};
	};

	onKeyDown (e: any): void {
		const { onKeyDown } = this.props;

		// Chinese IME is open
		if (this.composition) {
			return;
		};

		if (onKeyDown) {
			onKeyDown(e);
		};
	};

	onKeyUp (e: any): void {
		const { onKeyUp } = this.props;

		// Chinese IME is open
		if (this.composition) {
			return;
		};

		if (onKeyUp) {
			onKeyUp(e);
		};
	};

	onCompositionStart (e: any) {
		const { onCompositionStart } = this.props;

		this.composition = true;

		if (onCompositionStart) {
			onCompositionStart(e);
		};
	};

	onCompositionEnd (e: any) {
		const { onCompositionEnd } = this.props;

		this.composition = false;

		if (onCompositionEnd) {
			onCompositionEnd(e);
		};
	};

};

export default Editable;