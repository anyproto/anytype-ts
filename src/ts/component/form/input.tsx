import * as React from 'react';
import $ from 'jquery';
import Inputmask from 'inputmask';
import { I, keyboard } from 'Lib';

interface Props {
	id?: string;
	name?: string;
	type?: string;
	placeholder?: string;
	value: string;
	autoComplete?: string;
	maxLength?: number;
	className?: string;
	multiple?: boolean;
	readonly?: boolean;
	accept?: string;
	maskOptions?: any;
	focusOnMount?: boolean;
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

interface State {
	value: string;
	type: string;
};

class Input extends React.Component<Props, State> {
	
	_isMounted = false;
	node: any = null;
	mask: any = null;
	isFocused = false;
	range: I.TextRange = null;

	public static defaultProps = {
        type: 'text',
		value: ''
    };

	state = {
		value: '',
		type: ''
	};
	
	constructor (props: Props) {
        super(props);

		this.onChange = this.onChange.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onCut = this.onCut.bind(this);
		this.onSelect = this.onSelect.bind(this);
	};

	render () {
		const { id, name, placeholder, className, autoComplete, readonly, maxLength, multiple, accept, onClick, onMouseEnter, onMouseLeave } = this.props;
		const type = String(this.state.type || this.props.type || '');
		const cn = [ 'input', 'input-' + type ];

		if (className) {
			cn.push(className);
		};
		if (readonly) {
			cn.push('isReadonly');
		};
		
		return (
			<input
				ref={node => this.node = node}
				type={type}
				name={name}
				id={id}
				placeholder={placeholder}
				value={this.state.value}
				className={cn.join(' ')}
				autoComplete={autoComplete ? autoComplete : name}
				readOnly={readonly}
				onChange={this.onChange}
				onKeyUp={this.onKeyUp}
				onKeyDown={this.onKeyDown}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onPaste={this.onPaste}
				onCut={this.onCut}
				onSelect={this.onSelect}
				onClick={onClick}
				onCompositionStart={() => keyboard.setComposition(true)}
				onCompositionEnd={() => keyboard.setComposition(false)}
				maxLength={maxLength ? maxLength : undefined}
				accept={accept ? accept : undefined}
				multiple={multiple}
				spellCheck={false}
			/>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { value, type, focusOnMount } = this.props;
		
		this.setValue(value);
		this.setState({ type });
		this.initMask();

		if (focusOnMount) {
			this.focus();
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;

		if (this.isFocused) {
			this.isFocused = false;
			keyboard.setFocus(false);
			keyboard.disableSelection(false);
		};
	};

	initMask () {
		let { maskOptions } = this.props;
		if (!maskOptions || !this._isMounted) {
			return;
		};

		maskOptions = maskOptions || {};
		new Inputmask(maskOptions.mask, maskOptions).mask($(this.node).get(0));
	};

	onChange (e: any) {
		this.setValue(e.target.value);
		
		if (this.props.onChange) {
			this.props.onChange(e, e.target.value);
		};
	};
	
	onKeyUp (e: any) {
		if ($(this.node).hasClass('disabled')) {
			return;
		};

		this.setValue(e.target.value);
		
		if (this.props.onKeyUp) {
			this.props.onKeyUp(e, this.state.value);
		};
	};
	
	onKeyDown (e: any) {
		if ($(this.node).hasClass('disabled')) {
			return;
		};

		if (this.props.onKeyDown) {
			this.props.onKeyDown(e, this.state.value);
		};
	};
	
	onFocus (e: any) {
		if (this.props.onFocus) {
			this.props.onFocus(e, this.state.value);
		};
		
		this.isFocused = true;
		this.addClass('isFocused');

		keyboard.setFocus(true);
		keyboard.disableSelection(true);
	};
	
	onBlur (e: any) {
		if (this.props.onBlur) {
			this.props.onBlur(e, this.state.value);
		};
		
		this.isFocused = false;
		this.removeClass('isFocused');

		keyboard.setFocus(false);
		keyboard.disableSelection(false);
	};
	
	onPaste (e: any) {
		e.persist();

		this.callWithTimeout(() => {
			this.updateRange(e);

			if (this.props.onPaste) {
				this.props.onPaste(e, this.state.value);
			};
		});
	};

	onCut (e: any) {
		e.persist();

		this.callWithTimeout(() => {
			this.updateRange(e);

			if (this.props.onCut) {
				this.props.onCut(e, this.state.value);
			};
		});
	};
	
	onSelect (e: any) {
		if (this.props.onSelect) {
			this.props.onSelect(e, this.state.value);
		};

		this.updateRange(e);
	};

	getInputElement() {
		return $(this.node).get(0) as HTMLInputElement;
	};
	
	focus () {
		this.callWithTimeout(() => this.getInputElement().focus({ preventScroll: true }));
	};
	
	blur () {
		this.callWithTimeout(() => $(this.node).trigger('blur'));
	};
	
	select () {
		this.callWithTimeout(() => this.getInputElement().select());
	};
	
	setValue (v: string) {
		if (!this._isMounted) {
			return;
		};

		this.state.value = String(v ?? '');
		this.setState({ value: this.state.value });
	};
	
	getValue () {
		return this.state.value;
	};
	
	setType (v: string) {
		if (this._isMounted) {
			this.setState({ type: v });
		};
	};
	
	setError (v: boolean) {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		v ? node.addClass('withError') : node.removeClass('withError');
	};

	updateRange (e: any) {
		const { selectionStart, selectionEnd } = e.target;
		this.range = { from: selectionStart, to: selectionEnd };
	};

	setRange (range: I.TextRange) {
		this.callWithTimeout(() => {
			const el = this.getInputElement();

			el.focus({ preventScroll: true }); 
			el.setSelectionRange(range.from, range.to); 
		});
	};

	getRange (): I.TextRange {
		return this.range;
	};
	
	addClass (v: string) {
		if (this._isMounted) {
			$(this.node).addClass(v);
		};
	};
	
	removeClass (v: string) {
		if (this._isMounted) {
			$(this.node).removeClass(v);
		};
	};

	setPlaceholder (v: string) {
		$(this.node).attr({ placeholder: v });
	};

	callWithTimeout (callBack: () => void) {
		window.setTimeout(() => {
			if (this._isMounted) {
				callBack(); 
			};
		});
	};

	getSelectionRect (): DOMRect {
		if (!this._isMounted) {
			return null;
		};

		const { id } = this.props;
		const node = $(this.node);
		const parent = node.parent();
		const { left, top } = node.position();
		const value = this.getValue();
		const range = this.getRange();
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
			zIndex: 100,
		});
		clone.text(value.substring(0, range.to));

		const rect = clone.get(0).getBoundingClientRect() as DOMRect;

		clone.remove();
		return rect;
	};
	
};

export default Input;