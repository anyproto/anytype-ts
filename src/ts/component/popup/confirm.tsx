import * as React from 'react';
import { Title, Icon, Label, Button, Checkbox, Error } from 'Component';
import { I, keyboard, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';

const PopupConfirm = observer(class PopupConfirm extends React.Component<I.Popup> {

	refButtons: any = null;
	refCheckbox: any = null;
	n = 0;

	constructor (props: I.Popup) {
		super(props);
		
		this.onCheck = this.onCheck.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.setHighlight = this.setHighlight.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { title, text, icon, storageKey, error } = data;
		
		const canConfirm = undefined === data.canConfirm ? true : data.canConfirm;
		const canCancel = undefined === data.canCancel ? true : data.canCancel;
		const textConfirm = data.textConfirm || translate('commonOk');
		const textCancel = data.textCancel || translate('commonCancel');
		const colorConfirm = data.colorConfirm || 'black';
		const colorCancel = data.colorCancel || 'blank';
		const bgColor = data.bgColor || '';
		
		return (
			<div className={[ 'wrap', (storageKey ? 'withCheckbox' : '') ].join(' ')}>
				{icon ? (
					<div className={[ 'iconWrapper', bgColor ].join(' ')}>
						<Icon className={icon} />
					</div>
				) : ''}
				<Title text={title} />
				<Label text={text} />

				{storageKey ? (
					<div className="checkboxWrapper" onClick={this.onCheck}>
						<Checkbox ref={ref => this.refCheckbox = ref} value={false} />
						<Label text={translate('commonDoNotShowAgain')} />
					</div>
				) : ''}

				<div ref={ref => this.refButtons = ref} className="buttons">
					{canConfirm ? <Button text={textConfirm} color={colorConfirm} className="c36" onClick={this.onConfirm} onMouseEnter={this.onMouseEnter} /> : ''}
					{canCancel ? <Button text={textCancel} color={colorCancel} className="c36" onClick={this.onCancel} onMouseEnter={this.onMouseEnter} /> : ''}
				</div>

				<Error text={error} />
			</div>
		);
	};

	componentDidMount() {
		keyboard.setFocus(true);
		this.setHighlight();

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
		keyboard.shortcut('enter, space', e, () => {
			e.stopPropagation();
			const buttons = $(this.refButtons).find('.button');

			if (buttons[this.n]) {
				$(buttons[this.n]).trigger('click');
			};
		});

		keyboard.shortcut('escape', e, () => {
			e.stopPropagation();
			this.onCancel(e);
		});

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (arrow) => {
			const dir = [ 'arrowup', 'arrowleft' ].includes(arrow) ? 1 : -1;
			const buttons = $(this.refButtons).find('.button');

			if (buttons.length < 2) {
				return;
			};

			this.n += dir;
			if (this.n < 0) {
				this.n = buttons.length - 1;
			};
			if (this.n > buttons.length - 1) {
				this.n = 0;
			};

			this.setHighlight();
		});
	};
	
	onConfirm (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onConfirm, noCloseOnConfirm } = data;
		
		e.preventDefault();
		if (!noCloseOnConfirm) {
			close();
		};
		
		if (onConfirm) {
			onConfirm();
		};
	};

	onCheck (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { storageKey } = data;
		const value = this.refCheckbox.getValue();

		this.refCheckbox.toggle();
		Storage.set(storageKey, !value);
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

	onMouseEnter (e: any) {
		const buttons = $(this.refButtons).find('.button');

		this.n = $(buttons).index(e.currentTarget);
		this.setHighlight();
	};

	setHighlight () {
		const buttons = $(this.refButtons).find('.button');

		if (buttons[this.n]) {
			$(this.refButtons).find('.hover').removeClass('hover');
			$(buttons[this.n]).addClass('hover');
		};
	};
	
});

export default PopupConfirm;
