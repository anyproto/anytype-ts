import * as React from 'react';
import * as ReactDOM from 'react-dom';

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
	onChange?(e: any): void;
	onKeyUp?(e: any): void;
};

interface State {
	value: string;
	selected: boolean;
};

class TextArea extends React.Component<Props, State> {

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
		this.onKeyUp = this.onKeyUp.bind(this);
	};
	
	render () {
		const { id, name, className, placeHolder, autoComplete, readOnly, maxLength } = this.props;
		const { value } = this.state;
		
		let cn = [ 'textArea' ];
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
				onKeyUp={this.onKeyUp}
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
			this.props.onChange(e);
		};
	};
	
	onKeyUp (e: any) {
		this.setValue(e.target.value);
		if (this.props.onKeyUp) {
			this.props.onKeyUp(e);
		};
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
		v ? node.addClass('with-error') : node.removeClass('with-error');
	};
	
};

export default TextArea;