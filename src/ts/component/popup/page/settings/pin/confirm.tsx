import * as React from 'react';
import { Title, Label, Pin, Error } from 'Component';
import { I, Storage, translate } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.Popup {
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

	render () {
		const { error } = this.state;
		const pin = Storage.get('pin');

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsPinTitle')} />
				<Label className="description" text={translate('popupSettingsPinVerify')} />
				<Pin expectedPin={pin} onSuccess={this.onCheckPin} onError={this.onError} />
				<Error text={error} />
			</React.Fragment>
		);
	};

	onCheckPin = () => {
		const { onPage, setConfirmPin, onConfirmPin } = this.props;

		onPage('pinSelect');

		if (onConfirmPin) {
			onConfirmPin();
			setConfirmPin(null);
		};

		this.setState({ error: '' });
	};

	onError = () => {
		this.setState({ error: translate('popupSettingsPinError') });
	};

});

export default PopupSettingsPagePinConfirm;