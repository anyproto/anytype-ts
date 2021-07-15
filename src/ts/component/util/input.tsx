import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, keyboard } from 'ts/lib';
import Inputmask from 'inputmask';

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
	onChange?(e: any, value: string): void;
	onPaste?(e: any, value: string): void;
	onKeyUp?(e: any, value: string): void;
	onKeyDown?(e: any, value: string): void;
	onFocus?(e: any, value: string): void;
	onBlur?(e: any, value: string): void;
	onSelect?(e: any, value: string): void;
	onClick?(e: any): void;
};

interface State {
	value: string;
	type: string;
};

const $ = require('jquery');

class Input extends React.Component<Props, State> {
	
	_isMounted = false;
	mask: any = null;

	public static defaultProps = {
        type: 'text',
		value: ''
    };

	state = {
		value: '',
		type: ''
	};
	
	constructor (props: any) {
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
		const { id, name, placeholder, className, autoComplete, readonly, maxLength, multiple, accept, onClick } = this.props;
		
		let type: string = this.state.type || this.props.type;
		let cn = [ 'input', 'input-' + type ];
		if (className) {
			cn.push(className);
		};
		if (readonly) {
			cn.push('isReadonly');
		};
		
		return (
			<input
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
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onPaste={this.onPaste}
				onSelect={this.onSelect}
				onClick={onClick}
				maxLength={maxLength ? maxLength : undefined}
				accept={accept ? accept : undefined}
				multiple={multiple}
			/>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		this.setValue(this.props.value);
		this.setState({ type: this.props.type });
		this.initMask();
	};
	
	componentDidUpdate () {
		this.initMask();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	initMask () {
		let { maskOptions } = this.props;
		if (!maskOptions || !this._isMounted) {
			return;
		};

		maskOptions = maskOptions || {};

		const node = $(ReactDOM.findDOMNode(this));
		new Inputmask(maskOptions.mask, maskOptions).mask(node.get(0));
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
		
		keyboard.setFocus(true);
	};
	
	onBlur (e: any) {
		if (this.props.onBlur) {
			this.props.onBlur(e, this.state.value);
		};
		
		keyboard.setFocus(false);
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
	
	focus () {
		window.setTimeout(() => {
			if (!this._isMounted) {
				return;
			};
			
			$(ReactDOM.findDOMNode(this)).get(0).focus({ preventScroll: true }); 
		});
	};
	
	blur () {
		window.setTimeout(() => {
			if (!this._isMounted) {
				return;
			};
			
			$(ReactDOM.findDOMNode(this)).blur(); 
		});
	};
	
	select () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		window.setTimeout(() => { node.get(0).select();	});
	};
	
	setValue (v: string) {
		if (!this._isMounted) {
			return;
		};

		this.state.value = String(v || '');
		this.setState({ value: this.state.value });
	};
	
	getValue () {
		return this.state.value;
	};
	
	setType (v: string) {
		if (!this._isMounted) {
			return;
		};

		this.setState({ type: v });
	};
	
	setError (v: boolean) {
		if (!this._isMounted) {
			return;
		};

		let node = $(ReactDOM.findDOMNode(this));
		v ? node.addClass('withError') : node.removeClass('withError');
	};

	setRange (range: I.TextRange) {
		if (!this._isMounted) {
			return;
		};

		this.focus();
		
		let node = $(ReactDOM.findDOMNode(this));
		window.setTimeout(() => { node.get(0).setSelectionRange(range.from, range.to); });
	};
	
	addClass (v: string) {
		if (!this._isMounted) {
			return;
		};

		$(ReactDOM.findDOMNode(this)).addClass(v);
	};
	
	removeClass (v: string) {
		if (!this._isMounted) {
			return;
		};

		$(ReactDOM.findDOMNode(this)).removeClass(v);
	};
	
};

export default Input;