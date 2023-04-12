import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import sha1 from 'sha1';
import { Title, Pin, Error } from 'Component';
import { I, Storage, translate } from 'Lib';
import Head from '../head';

interface Props extends I.Popup, RouteComponentProps {
	prevPage: string;
	onPage: (id: string) => void;
};

type State = {
	pin: string | null;
	error: string;
}

const PopupSettingsPagePinSelect = observer(class PopupSettingsPagePinSelect extends React.Component<Props, State> {

	state = {
		pin: null,
		error: '',
	};

	render () {
		const { pin, error } = this.state;
		return (
			<div>
				<Head onPage={this.onBack} name={translate('commonBack')}></Head>
				<Title text={translate(pin ? 'popupSettingsPinSelectRepeat' : 'popupSettingsPinSelect')} />
				<Pin expectedPin={pin ? sha1(pin) : null} onSuccess={this.onSuccess} onError={this.onError}/>
				<Error text={error} />
			</div>
		);
	};

	onSuccess = (pin: string) => {
		const { pin: prevPin } = this.state;

		if (!prevPin) {
			this.setState({ pin });
			return;
		}

		Storage.set('pin', sha1(pin));
		this.props.onPage('pinIndex');
	};

	/** Triggered when pins mismatch */
	onError = () => {
		this.setState({ error: translate('popupSettingsPinSelectError') });
	}

	onBack = () => {
		const { prevPage, onPage } = this.props;
		const { pin } = this.state;

		if (pin) {
			this.setState({ pin: null });
			return;
		}

		onPage(prevPage);
	};

});

export default PopupSettingsPagePinSelect;