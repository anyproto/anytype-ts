import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Input, Icon } from 'ts/component';
import { translate } from 'ts/lib';

interface Props {
	placeHolder?: string;
	placeHolderFocus?: string;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onChange?(value: string): void;
};

const $ = require('jquery');

class Filter extends React.Component<Props, {}> {

	public static defaultProps = {
		placeHolder: translate('commonFilterClick'),
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
		const { placeHolder } = this.props;

		return (
			<div className="filter">
				<div className="inner">
					<Input 
						ref={(ref: any) => { this.ref = ref; }} 
						placeHolder={placeHolder} 
						onFocus={this.onFocus} 
						onBlur={this.onBlur} 
						onChange={this.onChange} 
					/>
					<Icon className="clear" onClick={this.onClear} />
				</div>
				<div className="line" />
			</div>
		);
	};

	focus () {
		this.ref.focus();
	};

	blur () {
		this.ref.blur();
	};

	onFocus (e: any) {
		const { placeHolderFocus, onFocus } = this.props;

		if (placeHolderFocus) {
			const node = $(ReactDOM.findDOMNode(this));
			const input = node.find('.input');

			input.attr({ placeHolder: placeHolderFocus });
		};

		if (onFocus) { 
			onFocus(e);
		};
	};
	
	onBlur (e: any) {
		const { placeHolderFocus, placeHolder, onBlur } = this.props;

		if (placeHolderFocus) {
			const node = $(ReactDOM.findDOMNode(this));
			const input = node.find('.input');

			input.attr({ placeHolder: placeHolder });
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
		const node = $(ReactDOM.findDOMNode(this));

		v ? node.addClass('active') : node.removeClass('active');

		this.props.onChange(v);
	};

	setValue (v: string) {
		this.ref.setValue(v);
		this.props.onChange(v);
	};

	getValue () {
		return this.ref.getValue();
	};

};

export default Filter;