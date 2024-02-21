import * as React from 'react';
import { observer } from 'mobx-react';
import {Title, Label, Input, Button, Icon} from 'Component';
import {I, keyboard, translate} from 'Lib';
import {keybindStore} from 'Store/keybind';

interface State {
	shortcutText: string;
}

const PopupShortcutPrompt = observer(class PopupShortcutPrompt extends React.Component<I.Popup, State> {
	state: State = {
		shortcutText: '',
	};

	refValue: any = null;
	
	constructor (props: I.Popup) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { placeholder, icon, value, maxLength, title, label, readonly } = data;

		const textConfirm = data.textConfirm || translate('commonOk');
		const textCancel = data.textCancel || translate('commonCancel');

		const { shortcutText } = this.state;
		
		return (
			<React.Fragment>
				{icon ? (
					<div className={'iconWrapper'}>
						<Icon className={icon} />
					</div>
				) : ''}
				<form onSubmit={this.onSubmit}>
					{title ? <Title text={title} /> : ''}
					{label ? <Label text={label} /> : ''}
					<Label text={shortcutText} />
					<Input
						onKeyDown={this.onKeyDown}
						onFocus={()=>keybindStore.setShortcutsDisabled(true)}
						onBlur={()=>keybindStore.setShortcutsDisabled(false)}
						ref={ref => this.refValue = ref}
						value={value}
						readonly={readonly}
						placeholder={placeholder}
						maxLength={maxLength} />
					<Button text={textCancel} color="blank" onClick={this.onCancel} />
					<Button type="input" text={textConfirm} />
				</form>
			</React.Fragment>
		);
	};

	onKeyDown (e: any) {
		e.preventDefault();
		console.log('key down', e);
		keyboard.checkShortcut(e, (shortcut: string) => {
			console.log('good shortcut', shortcut);
			this.refValue.setValue(shortcut);
			console.log('refValue set', this.refValue);
			this.setState({ shortcutText: shortcut });
		});
	}
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { value, select } = data;
		const length = String(value || '').length;
		
		this.refValue.setValue(value);
		this.refValue.focus();

		if (select) {
			this.refValue.setRange({ from: 0, to: length });
		};
	};
	
	onSubmit (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		e.preventDefault();
		this.props.close();

		console.log('tried but no change? refValue set ', this.refValue, onChange);
		if (onChange) {
			console.log('refValue set', this.refValue);
			onChange(this.refValue.getValue());
		};
	};
	
	onCancel (e: any) {
		this.props.close();
	};

});

export default PopupShortcutPrompt;
