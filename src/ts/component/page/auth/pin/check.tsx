import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Error, Pin, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { Storage, translate } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};

interface State {
	error: string;
};

const Constant: any = require('json/constant.json');

@observer
class PageAuthPinCheck extends React.Component<Props, State> {
	
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
		const { match, history } = this.props;
		const isSelect = match.params.id == 'select';

		if (isSelect) {
			history.push('/auth/setup/select');
		} else {
			history.push('/main/index');
				
			if (!Storage.get('popupNewBlock')) {
				commonStore.popupOpen('help', { 
					data: { document: 'whatsNew' },
				});
			};
		};
	};
	
};

export default PageAuthPinCheck;