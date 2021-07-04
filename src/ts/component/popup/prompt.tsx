import * as React from 'react';
import { Input, Button } from 'ts/component';
import { I, translate } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Popup {
	history: any;
}

const PopupPrompt = observer(class PopupPrompt extends React.Component<Props, {}> {
	
	refValue: any = null;
	
	constructor(props: any) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { placeholder, value, maxLength } = data;
		
		return (
			<form onSubmit={this.onSubmit}>
				<Input ref={(ref: any) => { this.refValue = ref; }} value={value} placeholder={placeholder} maxLength={maxLength} />
				<Button type="input" text={translate('commonOk')} />
				<Button text={translate('commonCancel')} color="grey" onClick={this.onCancel} />
			</form>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		
		this.refValue.setValue(value);
		this.refValue.focus();
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
	
});

export default PopupPrompt;