import * as React from 'react';
import { Title, Label, Pin, Error } from 'Component';
import { I, Storage, translate } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

interface State {
	error: string;
};

const PopupSettingsPagePinConfirm = observer(class PopupSettingsPagePinConfirm extends React.Component<I.PopupSettings, State> {

	state = {
		error: '',
	};
	ref = null;

	render () {
		const { onPage, prevPage } = this.props;
		const { error } = this.state;
		const pin = Storage.get('pin');

		return (
			<React.Fragment>
				<Head onPage={() => onPage(prevPage)} name={translate('commonBack')} />
				<Title text={translate('popupSettingsPinTitle')} />
				<Label className="description" text={translate('popupSettingsPinVerify')} />
				<Pin ref={ref => this.ref = ref} expectedPin={pin} onSuccess={this.onCheckPin} onError={this.onError} />
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
		this.ref.reset();
		this.setState({ error: translate('popupSettingsPinError') });
	};

});

export default PopupSettingsPagePinConfirm;