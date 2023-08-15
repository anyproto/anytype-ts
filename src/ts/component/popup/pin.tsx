import * as React from 'react';
import { Title, Pin, Error } from 'Component';
import { I, keyboard, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PopupPin = observer(class PopupConfirm extends React.Component<I.Popup, State> {

	ref = null;
	state = {
		error: ''
	};

	constructor (props: I.Popup) {
		super(props);

		this.onSuccess = this.onSuccess.bind(this);
		this.onError = this.onError.bind(this);
	};

	render () {
		const { error } = this.state;

		return (
			<React.Fragment>
				<Title text={translate('authPinCheckTitle')} />
				<Pin 
					ref={ref => this.ref = ref}
					expectedPin={Storage.get('pin')} 
					onSuccess={this.onSuccess} 
					onError={this.onError} 
				/>
				<Error text={error} />
			</React.Fragment>
		);
	};

	componentDidMount() {
		keyboard.setFocus(true);
	};

	componentWillUnmount() {
		keyboard.setFocus(false);
	};

	onSuccess () {
		const { param, close } = this.props;
		const { data } = param;
		const { onSuccess } = data;

		if (onSuccess) {
			onSuccess();
		};

		close();
	};

	onError () {
		const { param } = this.props;
		const { data } = param;
		const { onError } = data;

		this.ref.reset();		
		this.setState({ error: translate('authPinCheckError') });

		if (onError) {
			onError();
		};
	};
	
});

export default PopupPin;