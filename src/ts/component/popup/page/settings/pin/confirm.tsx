import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Pin, Error } from 'Component';
import { I, Storage, translate } from 'Lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	setConfirmPin: (v: () => void) => void;
	onConfirmPin: () => void;
};

interface State {
	error: string;
};

const PopupSettingsPagePinConfirm = observer(class PopupSettingsPagePinConfirm extends React.Component<Props, State> {

	state = {
		error: '',
	};

	constructor (props: any) {
		super(props);

		this.onCheckPin = this.onCheckPin.bind(this);
		this.onError = this.onError.bind(this);
	};

	render () {
		const { error } = this.state;
		const pin = Storage.get('pin');

		return (
			<div>
				<Head {...this.props} name={translate('commonCancel')} />

				<Title text={translate('popupSettingsPinTitle')} />
				<Label text={translate('popupSettingsPinVerify')} />
				<Error text={error} />

				<Pin value={pin} onSuccess={this.onCheckPin} onError={this.onError} />
			</div>
		);
	};

	onCheckPin (pin: string) {
		const { onPage, setConfirmPin, onConfirmPin } = this.props;

		onPage('pinSelect');

		if (onConfirmPin) {
			onConfirmPin();
			setConfirmPin(null);
		};

		this.setState({ error: '' });
	};

	onError () {
		this.setState({ error: translate('popupSettingsPinError') });
	};

});

export default PopupSettingsPagePinConfirm;
