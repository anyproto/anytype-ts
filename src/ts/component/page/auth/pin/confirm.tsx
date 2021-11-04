import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Pin, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { Storage, translate } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {}

interface State {
	error: string;
}

const sha1 = require('sha1');
const Constant: any = require('json/constant.json');

const PageAuthPinConfirm = observer(class PageAuthPinConfirm extends React.Component<Props, State> {
	
	refObj: any = {};
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
		
		let inputs = [];
		for (let i = 1; i <= Constant.pinSize; ++i) {
			inputs.push({ id: i });
		};
		
        return (
			<div>
				<Cover {...cover} className="main" />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authPinConfirmTitle')} />
					<Label text={translate('authPinConfirmLabel')} />
					<Error text={error} />
					
					<Pin 
						value={authStore.pin} 
						onSuccess={this.onSuccess} 
						onError={() => { this.setState({ error: translate('authPinConfirmError') }) }} 
					/>
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		window.setTimeout(() => { this.refObj[1].focus(); }, 15);
	};

	onSuccess (pin: string) {
		const { match, history } = this.props;
		const isAdd = match.params.id == 'add';
		const isSelect = match.params.id == 'select';

		Storage.set('pin', sha1(pin));
				
		if (isSelect) {
			history.push('/auth/setup/select');
		};
			
		if (isAdd) {
			history.push('/main/index');
		};
	};

});

export default PageAuthPinConfirm;