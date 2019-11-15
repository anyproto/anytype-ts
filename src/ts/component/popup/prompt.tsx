import * as React from 'react';
import { Input, Button } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Popup {
	history: any;
	commonStore?: any;
};

@inject('commonStore')
@observer
class PopupPrompt extends React.Component<Props, {}> {
	
	refValue: any = null;
	
	constructor(props: any) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { placeHolder } = data;
		
		return (
			<form onSubmit={this.onSubmit}>
				<Input ref={(ref: any) => { this.refValue = ref; }} placeHolder={placeHolder} />
				<Button type="input" text="Ok" className="orange" />
				<Button text="Cancel" className="grey" onClick={this.onCancel} />
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
		const { commonStore, id, param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		e.preventDefault();
		commonStore.popupClose(id);
		
		if (onChange) {
			onChange(this.refValue.getValue());
		};
	};
	
	onCancel (e: any) {
		const { commonStore, id } = this.props;
		
		commonStore.popupClose(id);
	};
	
};

export default PopupPrompt;