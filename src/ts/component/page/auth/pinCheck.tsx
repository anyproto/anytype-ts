import * as React from 'react';
import { Frame, Title, Error, Pin, Header } from 'Component';
import { I, UtilCommon, Storage, translate, keyboard, UtilObject } from 'Lib';
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
		this.onError = this.onError.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
		return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Frame>
					<Title text={translate('authPinCheckTitle')} />
					<Pin 
						ref={ref => this.ref = ref}
						expectedPin={Storage.get('pin')} 
						onSuccess={this.onSuccess} 
						onError={this.onError} 
					/>
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

	onError () {
		this.ref.reset();		
		this.setState({ error: translate('authPinCheckError') });
	};

	onSuccess () {
		const { account } = authStore;
		const redirect = Storage.get('redirect');
		const routeParam = { replace: true, animate: true };

		keyboard.setPinChecked(true);

		if (account) {
			redirect ? UtilCommon.changeRoute(redirect, routeParam) : UtilObject.openHome('route', routeParam);
		} else {
			UtilCommon.changeRoute('/', routeParam);
		};
	};
	
});

export default PageAuthPinCheck;
