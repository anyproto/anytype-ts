import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Error, Pin, Header, FooterAuth as Footer } from 'Component';
import { Util, Storage, translate, keyboard } from 'Lib';
import { authStore, commonStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};

interface State {
	error: string;
};

const PageAuthPinCheck = observer(class PageAuthPinCheck extends React.Component<Props, State> {
	
	ref: any = null;
	state = {
		error: ''
	};

	constructor (props: any) {
		super(props);

		this.onSuccess = this.onSuccess.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		
		return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<Title text={translate('authPinCheckTitle')} />
					<Error text={error} />

					<Pin 
						ref={(ref: any) => { this.ref = ref; }}
						value={Storage.get('pin')} 
						onSuccess={this.onSuccess} 
						onError={() => { this.setState({ error: translate('authPinCheckError') }) }} 
					/>
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
		$(window).on('focus.pin', () => { console.log('focus'); this.ref.focus(); });
	};

	onSuccess (pin: string) {
		const { account } = authStore;
		const { redirect } = commonStore;

		keyboard.setPinChecked(true);

		if (account) {
			Util.route(redirect || '/main/index');
		} else {
			Util.route('/');
		};
	};
	
});

export default PageAuthPinCheck;