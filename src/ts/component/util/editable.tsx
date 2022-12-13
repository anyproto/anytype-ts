import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getRange } from 'selection-ranges';
import { I, Mark } from 'Lib';

interface Props {
	id?: string;
	classNameWrap?: string;
	classNameEditor?: string;
	classNamePlaceholder?: string;
	placeholder?: string;
	readonly?: boolean;
	onKeyDown?: (e: any) => void;
	onKeyUp?: (e: any) => void;
	onFocus?: (e: any) => void;
	onBlur?: (e: any) => void;
	onSelect?: (e: any) => void;
	onPaste?: (e: any) => void;
	onMouseDown?: (e: any) => void;
	onMouseUp?: (e: any) => void;
	onInput?: (e: any) => void;
	onCompositionStart?: (e: any) => void;
	onCompositionEnd?: (e: any) => void;
	onDragStart?: (e: any) => void;
};

class Editable extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	placeholder: any = null;
	editable: any = null;

	public static defaultProps = {
    };

	constructor (props: Props) {
		super(props);


	};

	render () {
		const { 
			id, classNameWrap, classNameEditor, classNamePlaceholder, readonly, placeholder, onKeyDown, onKeyUp, onFocus, onBlur, onSelect, onPaste, 
			onMouseDown, onMouseUp, onInput, onCompositionStart, onCompositionEnd, onDragStart 
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
			editor = <div id="value" className={cne.join(' ')} />;
		} else {
			editor = (
				<div
					id={id}
					className={cne.join(' ')}
					contentEditable={true}
					suppressContentEditableWarning={true}
					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}
					onFocus={onFocus}
					onBlur={onBlur}
					onSelect={onSelect}
					onPaste={onPaste}
					onMouseDown={onMouseDown}
					onMouseUp={onMouseUp}
					onInput={onInput}
					onCompositionStart={onCompositionStart}
					onCompositionEnd={onCompositionEnd}
					onDragStart={onDragStart}
				/>
			);
		};

		return (
			<div className={cnw.join(' ')}>
				{editor}
				<div id="placeholder" className={cnp.join(' ')}>{placeholder}</div>
			</div>
		);
	};

	componentDidMount () {
		const node = $(ReactDOM.findDOMNode(this));

		this._isMounted = true;
		this.placeholder = node.find('#placeholder');
		this.editable = node.find('.editable');
	};

	componentWillUnmount () {
		this._isMounted = false;
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
		this.editable.get(0).innerHTML = html;
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

};

export default Editable;