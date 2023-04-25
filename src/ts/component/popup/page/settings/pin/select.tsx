import * as React from 'react';
import sha1 from 'sha1';
import { observer } from 'mobx-react';
import { Title, Pin, Error } from 'Component';
import { I, Storage, translate } from 'Lib';
import Head from '../head';

type State = {
	pin: string | null;
	error: string;
};

const PopupSettingsPagePinSelect = observer(class PopupSettingsPagePinSelect extends React.Component<I.PopupSettings, State> {

	state = {
		pin: null,
		error: '',
	};
	ref = null;

	render () {
		const { pin, error } = this.state;

		return (
			<div>
				<Head onPage={this.onBack} name={translate('commonBack')}></Head>
				<Title text={translate(pin ? 'popupSettingsPinSelectRepeat' : 'popupSettingsPinSelect')} />
				<Pin 
					ref={ref => this.ref = ref} 
					expectedPin={pin ? sha1(pin) : null} 
					onSuccess={this.onSuccess} 
					onError={this.onError}
				/>
				<Error text={error} />
			</div>
		);
	};

	componentDidUpdate (): void {
		this.ref.reset();	
	};

	onSuccess = (pin: string) => {
		const { onPage } = this.props;
		const { pin: prevPin } = this.state;

		if (!prevPin) {
			this.setState({ pin });
			return;
		};

		Storage.set('pin', sha1(pin));
		onPage('pinIndex');
	};

	/** Triggered when pins mismatch */
	onError = () => {
		this.ref.reset();
		this.setState({ error: translate('popupSettingsPinSelectError') });
	};

	onBack = () => {
		const { onPage } = this.props;
		const { pin } = this.state;

		if (pin) {
			this.setState({ pin: null });
			return;
		};

		onPage('pinIndex');
	};

});

export default PopupSettingsPagePinSelect;