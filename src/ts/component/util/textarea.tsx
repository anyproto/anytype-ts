import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { keyboard } from 'ts/lib';

const $ = require('jquery');

interface Props {
	id?: string;
	name?: string;
	placeholder?: string;
	rows?: number;
	value?: string;
	autoComplete?: string;
	maxLength?: number;
	readonly?: boolean;
	className?: string;
	onChange?(e: any, value: string): void;
	onKeyDown?(e: any, value: string): void;
	onKeyUp?(e: any, value: string): void;
	onInput?(e: any, value: string): void;
	onFocus?(e: any, value: string): void;
	onBlur?(e: any, value: string): void;
	onCopy?(e: any, value: string): void;
};

interface State {
	value: string;
};

class Textarea extends React.Component<Props, State> {

	_isMounted = false;
	public static defaultProps = {
		value: ''
	};

	state = {
		value: '',
	};

	constructor (props: any) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCopy = this.onCopy.bind(this);
	};
	
	render () {
		const { id, name, className, placeholder, rows, autoComplete, readonly, maxLength } = this.props;
		const { value } = this.state;
		
		let cn = [ 'textarea' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<textarea
				name={name}
				id={id}
				placeholder={placeholder}
				value={value}
				rows={rows}
				className={cn.join(' ')}
				autoComplete={autoComplete}
				readOnly={readonly}
				onChange={this.onChange}
				onKeyDown={this.onKeyDown}
				onKeyUp={this.onKeyUp}
				onInput={this.onInput}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onCopy={this.onCopy}
				maxLength={maxLength ? maxLength : undefined}
			/>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.setValue(this.props.value ? this.props.value : '');
	};

	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onChange (e: any) {
		this.setValue(e.target.value);
		if (this.props.onChange) {
			this.props.onChange(e, e.target.value);
		};
	};

	onKeyDown (e: any) {
		this.setValue(e.target.value);
		if (this.props.onKeyDown) {
			this.props.onKeyDown(e, e.target.value);
		};
	};
	
	onKeyUp (e: any) {
		this.setValue(e.target.value);
		if (this.props.onKeyUp) {
			this.props.onKeyUp(e, e.target.value);
		};
	};

	onInput (e: any) {
		if (this.props.onInput) {
			this.props.onInput(e, e.target.value);
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

	onCopy (e: any) {
		if (this.props.onCopy) {
			this.props.onCopy(e, this.state.value);
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
	
	select () {
		window.setTimeout(() => { 
			if (!this._isMounted) {
				return;
			};

			const node = $(ReactDOM.findDOMNode(this));
			node.get(0).select();
		});
	};
	
	setValue (v: string) {
		this.setState({ value: v });
	};
	
	getValue () {
		return this.state.value;
	};
	
	setError (v: boolean) {
		if (!this._isMounted) {
			return;
		};

		let node = $(ReactDOM.findDOMNode(this));
		v ? node.addClass('withError') : node.removeClass('withError');
	};
	
};

export default Textarea;