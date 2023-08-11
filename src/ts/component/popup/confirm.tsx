import * as React from 'react';
import { Title, Icon, Label, Button } from 'Component';
import { I, keyboard, translate } from 'Lib';
import { observer } from 'mobx-react';

const PopupConfirm = observer(class PopupConfirm extends React.Component<I.Popup> {

	constructor (props: I.Popup) {
		super(props);
		
		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { title, text, icon } = data;
		
		const canConfirm = undefined === data.canConfirm ? true : data.canConfirm;
		const canCancel = undefined === data.canCancel ? true : data.canCancel;
		const textConfirm = data.textConfirm || translate('commonOk');
		const textCancel = data.textCancel || translate('commonCancel');
		const colorConfirm = data.colorConfirm || 'black';
		const colorCancel = data.colorCancel || 'blank';
		
		return (
			<React.Fragment>
				{icon ? <Icon className={icon} /> : ''}
				<Title text={title} />
				<Label text={text} />

				<div className="buttons">
					{canConfirm ? <Button text={textConfirm} color={colorConfirm} className="c36" onClick={this.onConfirm} /> : ''}
					{canCancel ? <Button text={textCancel} color={colorCancel} className="c36" onClick={this.onCancel} /> : ''}
				</div>
			</React.Fragment>
		);
	};

	componentDidMount() {
		keyboard.setFocus(true);

		this.rebind();
	};

	componentWillUnmount() {
		keyboard.setFocus(false);

		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.confirm', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.confirm');
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter, space', e, (pressed: string) => {
			e.stopPropagation();
			this.onConfirm(e);
		});

		keyboard.shortcut('escape', e, (pressed: string) => {
			e.stopPropagation();
			this.onCancel(e);
		});
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
	
});

export default PopupConfirm;