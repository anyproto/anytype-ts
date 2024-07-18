import * as React from 'react';
import { Frame, Title, Error, Pin } from 'Component';
import { I, S, U, Storage, translate, keyboard } from 'Lib';
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
				<Frame>
					<Title text={translate('authPinCheckTitle')} />
					<Pin 
						ref={ref => this.ref = ref}
						expectedPin={Storage.getPin()} 
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
		$(window).on('focus.pin', () => this.ref.focus());
	};

	onError () {
		this.ref.reset();		
		this.setState({ error: translate('authPinCheckError') });
	};

	onSuccess () {
		const { account } = S.Auth;
		const { redirect } = S.Common;
		const routeParam = { replace: true, animate: true };

		keyboard.setPinChecked(true);

		if (account) {
			redirect ? U.Router.go(redirect, routeParam) : U.Space.openDashboard('route', routeParam);
		} else {
			U.Router.go('/', routeParam);
		};
	};
	
});

export default PageAuthPinCheck;
