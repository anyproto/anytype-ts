import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { keyboard } from 'ts/lib';

const $ = require('jquery');

interface Props {
	id?: string;
	name?: string;
	placeHolder?: string;
	value?: string;
	autoComplete?: string;
	maxLength?: number;
	readOnly?: boolean;
	className?: string;
	onChange?(e: any, value: string): void;
	onKeyDown?(e: any, value: string): void;
	onKeyUp?(e: any, value: string): void;
	onFocus?(e: any, value: string): void;
	onBlur?(e: any, value: string): void;
};

interface State {
	value: string;
	selected: boolean;
};

class Textarea extends React.Component<Props, State> {

	public static defaultProps = {
		value: ''
	};

	state = {
		value: '',
		selected: false
	};

	constructor (props: any) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};
	
	render () {
		const { id, name, className, placeHolder, autoComplete, readOnly, maxLength } = this.props;
		const { value } = this.state;
		
		let cn = [ 'textarea' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<textarea
				name={name}
				id={id}
				placeholder={placeHolder}
				value={value}
				className={cn.join(' ')}
				autoComplete={autoComplete}
				readOnly={readOnly}
				onChange={this.onChange}
				onKeyDown={this.onKeyDown}
				onKeyUp={this.onKeyUp}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				maxLength={maxLength ? maxLength : undefined}
			/>
		);
	};
	
	componentDidMount () {
		let value = this.props.value ? this.props.value : '';
		
		this.setValue(value);
	};
	
	componentDidUpdate () {
		let node = $(ReactDOM.findDOMNode(this));
		
		if (this.state.selected) {
			node.select();
		};
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
	
	focus () {
		let node = $(ReactDOM.findDOMNode(this));
		
		node.focus();
	};
	
	select () {
		this.setState({ selected: true });
	};
	
	setValue (v: string) {
		this.setState({ value: v });
	};
	
	getValue () {
		return this.state.value;
	};
	
	setError (v: boolean) {
		let node = $(ReactDOM.findDOMNode(this));
		v ? node.addClass('withError') : node.removeClass('withError');
	};
	
};

export default Textarea;