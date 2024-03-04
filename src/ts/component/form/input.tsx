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
	isFocused: boolean = false;

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
		this.onSelect = this.onSelect.bind(this);
	};

	render () {
		const { id, name, placeholder, className, autoComplete, readonly, maxLength, multiple, accept, onClick, onMouseEnter, onMouseLeave } = this.props;
		const type: string = this.state.type || this.props.type;
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
				onSelect={this.onSelect}
				onClick={onClick}
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
		this.setValue(e.target.value);
		
		if (this.props.onKeyUp) {
			this.props.onKeyUp(e, this.state.value);
		};
	};
	
	onKeyDown (e: any) {
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
		e.stopPropagation();

		if (this.props.onPaste) {
			e.preventDefault();
			this.setValue(e.clipboardData.getData('text/plain'));
			this.props.onPaste(e, this.state.value);
		};
	};
	
	onSelect (e: any) {
		if (this.props.onSelect) {
			this.props.onSelect(e, this.state.value);
		};
	};

	getInputElement() {
		return $(this.node).get(0) as HTMLInputElement;
	}
	
	focus () {
		window.setTimeout(() => {
			if (!this._isMounted) {
				return;
			};

			this.getInputElement().focus({ preventScroll: true }); 
		});
	};
	
	blur () {
		window.setTimeout(() => {
			if (this._isMounted) {
				$(this.node).trigger('blur');
			};
		});
	};
	
	select () {
		if (this._isMounted) {
			window.setTimeout(() => { this.getInputElement().select();	});
		};
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

	setRange (range: I.TextRange) {
		window.setTimeout(() => { 
			if (!this._isMounted) {
				return;
			};

			const el = this.getInputElement();

			el.focus({ preventScroll: true }); 
			el.setSelectionRange(range.from, range.to); 
		});
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
	
};

export default Input;
