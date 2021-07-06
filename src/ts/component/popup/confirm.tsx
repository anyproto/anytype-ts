import * as React from 'react';
import { Title, Icon, Label, Button } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Popup {};

@observer
class PopupConfirm extends React.Component<Props, {}> {

	constructor(props: any) {
		super(props);
		
		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { title, text, textConfirm, textCancel, icon } = data;

		let canConfirm = undefined === data.canConfirm ? true : data.canConfirm;
		let canCancel = undefined === data.canCancel ? true : data.canCancel;
		
		return (
			<React.Fragment>
				{icon ? (
					<div className="iconObject c64">
						<Icon className={icon} />
					</div>
				) : ''}
				<Title text={title} />
				<Label text={text} />
				{canConfirm ? <Button text={textConfirm} onClick={this.onConfirm} /> : ''}
				{canCancel ? <Button text={textCancel} color="grey" onClick={this.onCancel} /> : ''}
			</React.Fragment>
		);
	};
	
	onConfirm (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onConfirm } = data;
		
		e.preventDefault();
		this.props.close();
		
		if (onConfirm) {
			onConfirm();
		};
	};
	
	onCancel (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onCancel } = data;

		this.props.close();

		if (onCancel) {
			onCancel();
		};
	};
	
};

export default PopupConfirm;