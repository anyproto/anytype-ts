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
const Err: any = {
	BAD_INPUT: 2
};

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
							
					<TextArea ref={(ref: any) => this.phraseRef = ref} placeHolder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" />
					<div className="buttons">
						<Button text="Login" className="orange" onClick={this.onSubmit} />
						<Button text="Back" className="grey" onClick={this.onCancel} />
					</div>
				</Frame>
			</div>
		);
    };

	onSubmit (e: any) {
		const { authStore } = this.props;
		
		e.preventDefault();
		
		let request = { 
			rootPath: Config.root, 
			mnemonic: this.phraseRef.getValue()
		};
			
		dispatcher.call('walletRecover', request, (message: any) => {
			if (message.error.code) {
				let error = '';
				switch (message.error.code) {
					case Err.BAD_INPUT:
						error = 'Invalid mnemonic phrase';
						break; 
					default:
						error = message.error.desc;
						break;
				};
				if (error) {
					this.setState({ error: error });
				};
			} else {
				authStore.phraseSet(request.mnemonic);
				this.props.history.push('/auth/account-select');
			};
		});
	};
	
	onCancel (e: any) {
		e.preventDefault();
		this.props.history.push('/auth/select');
	};
	
};

export default PageAuthLogin;