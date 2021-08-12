import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Error, Pin, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { Storage, translate, keyboard } from 'ts/lib';
import { authStore, commonStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {}

interface State {
	error: string;
}

const PageAuthPinCheck = observer(class PageAuthPinCheck extends React.Component<Props, State> {
	
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
				<Cover {...cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authPinCheckTitle')} />
					<Error text={error} />

					<Pin 
						value={Storage.get('pin')} 
						onSuccess={this.onSuccess} 
						onError={() => { this.setState({ error: translate('authPinCheckError') }) }} 
					/>
				</Frame>
			</div>
		);
	};

	onSuccess (pin: string) {
		const { history } = this.props;
		const { account } = authStore;
		const redirect = Storage.get('redirect');

		keyboard.setPinChecked(true);

		if (account) {
			history.push(redirect || '/main/index');
				
			if (!Storage.get('popupNewBlock')) {
				popupStore.open('help', { 
					data: { document: 'whatsNew' },
				});
			};
		} else {
			history.push('/');
		};
	};
	
});

export default PageAuthPinCheck;