import * as React from 'react';
import sha1 from 'sha1';
import { observer } from 'mobx-react';
import { Title, Pin, Error } from 'Component';
import { I, S, translate } from 'Lib';

type State = {
	pin: string | null;
	error: string;
};

const PageMainSettingsPinSelect = observer(class PageMainSettingsPinSelect extends React.Component<I.PageSettingsComponent, State> {

	state = {
		pin: null,
		error: '',
	};
	ref = null;

	render () {
		const { pin, error } = this.state;

		return (
			<div>
				<Title text={translate(pin ? 'popupSettingsPinSelectRepeat' : 'popupSettingsPinSelect')} />
				<Pin 
					ref={ref => this.ref = ref} 
					expectedPin={pin ? sha1(pin) : null} 
					isNumeric={true}
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

	componentWillUnmount () {
	};

	onSuccess = (pin: string) => {
		const { onPage } = this.props;
		const { pin: prevPin } = this.state;

		if (!prevPin) {
			this.setState({ pin });
			return;
		};

		S.Common.pinSet(sha1(pin));
		onPage('pinIndex');
	};

	/** Triggered when pins mismatch */
	onError = () => {
		this.ref.reset();
		this.setState({ error: translate('popupSettingsPinSelectError') });
	};

});

export default PageMainSettingsPinSelect;
