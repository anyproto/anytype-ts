import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Input, Icon } from 'ts/component';
import { translate } from 'ts/lib';

interface Props {
	className?: string;
	inputClassName?: string;
	value?: string;
	placeholder?: string;
	placeholderFocus?: string;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any, v: string): void;
	onKeyUp?(e: any, v: string): void;
	onChange?(value: string): void;
};

const $ = require('jquery');

class Filter extends React.Component<Props, {}> {

	public static defaultProps = {
		className: '',
		inputClassName: '',
		placeholder: translate('commonFilterClick'),
	};
	
	ref: any = null;

	constructor (props: any) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onClear = this.onClear.bind(this);
	};
	
	render () {
		const { value, placeholder, className, inputClassName, onKeyDown, onKeyUp } = this.props;
		const cn = [ 'filter', className ];

		return (
			<div className={cn.join(' ')}>
				<div className="inner">
					<Input 
						ref={(ref: any) => { this.ref = ref; }} 
						className={inputClassName}
						placeholder={placeholder} 
						value={value}
						onFocus={this.onFocus} 
						onBlur={this.onBlur} 
						onChange={this.onChange} 
						onKeyDown={onKeyDown}
						onKeyUp={onKeyUp}
					/>
					<Icon className="clear" onClick={this.onClear} />
				</div>
				<div className="line" />
			</div>
		);
	};

	componentDidMount() {
		this.ref.setValue(this.props.value);
	};

	componentDidUpdate () {
		this.checkButton();
	};

	focus () {
		this.ref.focus();
		this.checkButton();
	};

	blur () {
		this.ref.blur();
	};

	onFocus (e: any) {
		const { placeholderFocus, onFocus } = this.props;

		if (placeholderFocus) {
			const node = $(ReactDOM.findDOMNode(this));
			const input = node.find('.input');

			input.attr({ placeholder: placeholderFocus });
		};

		if (onFocus) { 
			onFocus(e);
		};
	};
	
	onBlur (e: any) {
		const { placeholderFocus, placeholder, onBlur } = this.props;

		if (placeholderFocus) {
			const node = $(ReactDOM.findDOMNode(this));
			const input = node.find('.input');

			input.attr({ placeholder: placeholder });
		};

		if (onBlur) {
			onBlur(e);
		};
	};

	onClear (e: any) {
		this.ref.setValue('');
		this.ref.focus();
		this.onChange(e, '');
	};

	onChange (e: any, v: string) {	
		const { onChange } = this.props;

		this.checkButton();

		if (onChange) {
			onChange(v);
		};
	};

	checkButton () {
		const node = $(ReactDOM.findDOMNode(this));
		const v = this.getValue();

		v ? node.addClass('active') : node.removeClass('active');
	};

	setValue (v: string) {
		this.ref.setValue(v);
		this.checkButton();
	};

	getValue () {
		return this.ref.getValue();
	};

};

export default Filter;