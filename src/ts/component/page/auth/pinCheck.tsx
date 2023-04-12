import * as React from 'react';
import { Frame, Title, Error, Pin, Header } from 'Component';
import { I, Util, Storage, translate, keyboard, ObjectUtil } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PageAuthPinCheck = observer(class PageAuthPinCheck extends React.Component<I.PageComponent, State> {
	
	ref = null;
	state = {
		error: ''
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onSuccess = this.onSuccess.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
		return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Frame>
					<Title text={translate('authPinCheckTitle')} />
					<div className={error !== '' ? 'isInvalid' : '' }>
						<Pin 
							ref={ref => { this.ref = ref; }}
							expectedPin={Storage.get('pin')} 
							onSuccess={this.onSuccess} 
							onError={() => { this.setState({ error: translate('authPinCheckError') }) }} 
						/>
					</div>
					<Error text={error} />
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentWillUnmount () {
		this.unbind();
	};

	unbind () {
		$(window).off('focus.pin');
	};

	rebind () {
		this.unbind();
		$(window).on('focus.pin', () => { this.ref.focus(); });
	};

	onSuccess () {
		const { account } = authStore;
		const redirect = Storage.get('redirect');

		keyboard.setPinChecked(true);

		if (account) {
			redirect ? Util.route(redirect) : ObjectUtil.openHome('route');
		} else {
			Util.route('/');
		};
	};
	
});

export default PageAuthPinCheck;
