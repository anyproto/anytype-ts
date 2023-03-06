import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Title, Label, Input, Button } from 'Component';
import { I, translate } from 'Lib';

const PopupPrompt = observer(class PopupPrompt extends React.Component<I.Popup> {
	
	refValue: any = null;
	
	constructor (props: I.Popup) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { placeholder, value, maxLength, title, label, readonly } = data;

		const textConfirm = data.textConfirm || translate('commonOk');
		const textCancel = data.textCancel || translate('commonCancel');
		
		return (
			<form onSubmit={this.onSubmit}>
				{title ? <Title text={title} /> : ''}
				{label ? <Label text={label} /> : ''}
				<Input ref={ref => { this.refValue = ref; }} value={value} readonly={readonly} placeholder={placeholder} maxLength={maxLength} />
				<Button type="input" text={textConfirm} />
				<Button text={textCancel} color="blank" onClick={this.onCancel} />
			</form>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { value, select } = data;
		const length = String(value || '').length;
		
		this.refValue.setValue(value);
		this.refValue.focus();
		this.resize();

		if (select) {
			this.refValue.setRange({ from: 0, to: length });
		};
	};
	
	onSubmit (e: any) {
		const { id, param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		e.preventDefault();
		this.props.close();
		
		if (onChange) {
			onChange(this.refValue.getValue());
		};
	};
	
	onCancel (e: any) {
		this.props.close();
	};

	resize () {
		const { getId } = this.props;
		const obj = $(`#${getId()}-innerWrap`);

		obj.css({ marginTop: -obj.outerHeight() / 2, marginLeft: -obj.outerWidth() / 2 });
	};
	
});

export default PopupPrompt;