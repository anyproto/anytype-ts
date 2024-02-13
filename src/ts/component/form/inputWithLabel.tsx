import * as React from 'react';
import $ from 'jquery';
import { Input, Icon, Label } from 'Component';
import { I, translate } from 'Lib';

interface Props {
	label: string;
	value: string;
	placeholder?: string;
	readonly?: boolean;
	maxLength?: number;
	onKeyUp?(e: any, value: string): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

class InputWithLabel extends React.Component<Props> {
	
	node: any = null;
	isFocused = false;
	placeholder: any = null;
	ref = null;

	constructor (props: Props) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
	};
	
	render () {
		const { label } = this.props;

		return (
			<div
				ref={node => this.node = node}
				onClick={() => this.ref.focus()}
				className="inputWithLabel"
			>
				<div className="inner">
					<Label text={label} />

					<Input
						ref={ref => this.ref = ref}
						{...this.props}
						onFocus={this.onFocus}
						onBlur={this.onBlur}
					/>

				</div>
			</div>
		);
	};

	componentDidMount() {
		const node = $(this.node);

		this.ref.setValue(this.props.value);
	};

	focus () {
		this.ref.focus();
	};

	blur () {
		this.ref.blur();
	};

	setValue (v: string) {
		this.ref.setValue(v);
	};

	getValue () {
		return this.ref.getValue();
	};

	setRange (range: I.TextRange) {
		this.ref.setRange(range);
	};

	onFocus (e: any) {
		const { onFocus, readonly } = this.props;

		if (!readonly) {
			this.isFocused = true;
			this.addFocusedClass();
		};

		if (onFocus) { 
			onFocus(e);
		};
	};
	
	onBlur (e: any) {
		const { onBlur, readonly } = this.props;

		if (!readonly) {
			this.isFocused = false;
			this.removeFocusedClass();
		};

		if (onBlur) {
			onBlur(e);
		};
	};

	addFocusedClass () {
		const node = $(this.node);
		node.addClass('isFocused');
	};

	removeFocusedClass () {
		const node = $(this.node);
		node.removeClass('isFocused');
	};

};

export default InputWithLabel;
