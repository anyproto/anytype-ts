import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, TextArea, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { dispatcher } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	authStore?: any;
};
interface State {
	error: string;
};

const Config: any = require('json/config.json');

@inject('authStore')
@observer
class PageAuthLogin extends React.Component<Props, State> {

	phraseRef: any;

	state = {
		error: ''
	};
	
	constructor (props: any) {
        super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
        return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Login with your keychain" />
					<Label text="Type your keychain phrase or private key" />
					<Error text={error} />
							
					<form onSubmit={this.onSubmit}>
						<TextArea ref={(ref: any) => this.phraseRef = ref} placeHolder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" />
						<div className="buttons">
							<Button type="input" text="Login" className="orange" />
							<Button text="Back" className="grey" onClick={this.onCancel} />
						</div>
					</form>
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		this.phraseRef.focus();
	};

	onSubmit (e: any) {
		const { authStore, history } = this.props;
		
		e.preventDefault();

		this.phraseRef.setError(false);
		
		let request = { 
			rootPath: Config.root, 
			mnemonic: this.phraseRef.getValue()
		};
		
		dispatcher.call('walletRecover', request, (errorCode: any, message: any) => {
			if (message.error.code) {
				let error = '';
				switch (message.error.code) {
					case errorCode.BAD_INPUT:
						error = 'Invalid mnemonic phrase';
						this.phraseRef.setError(true);
						break; 
					default:
						error = message.error.description;
						break;
				};
				if (error) {
					this.setState({ error: error });
				};
			} else {
				authStore.phraseSet(request.mnemonic);
				history.push('/auth/account-select');
			};
		});
	};
	
	onCancel (e: any) {
		e.preventDefault();
		this.props.history.push('/auth/select');
	};
	
};

export default PageAuthLogin;