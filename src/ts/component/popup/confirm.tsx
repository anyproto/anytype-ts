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
		
		return (
			<React.Fragment>
				{icon ? (
					<div className="smile c64">
						<Icon className={icon} />
					</div>
				) : ''}
				<Title text={title} />
				<Label text={text} />
				<Button text={textConfirm} className="orange" onClick={this.onConfirm} />
				<Button text={textCancel} className="grey" onClick={this.onCancel} />
			</React.Fragment>
		);
	};
	
	onConfirm (e: any) {
		const { id, param } = this.props;
		const { data } = param;
		const { onConfirm } = data;
		
		e.preventDefault();
		this.props.close();
		
		if (onConfirm) {
			onConfirm();
		};
	};
	
	onCancel (e: any) {
		this.props.close();
	};
	
};

export default PopupConfirm;