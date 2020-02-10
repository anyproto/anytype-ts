import * as React from 'react';
import { Input, Button } from 'ts/component';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Popup {
	history: any;
};

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
		const { placeHolder, value } = data;
		
		return (
			<form onSubmit={this.onSubmit}>
				<Input ref={(ref: any) => { this.refValue = ref; }} value={value} placeHolder={placeHolder} />
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
		const { id, param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		e.preventDefault();
		commonStore.popupClose(id);
		
		if (onChange) {
			onChange(this.refValue.getValue());
		};
	};
	
	onCancel (e: any) {
		commonStore.popupClose(this.props.id);
	};
	
};

export default PopupPrompt;