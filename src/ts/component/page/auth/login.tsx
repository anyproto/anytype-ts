import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, TextArea, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { Dispatcher } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};
interface State {
	error: string;
};

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
		e.preventDefault();
		
		Dispatcher.call('walletCreate', { pin: 'test' });
		
		//this.props.history.push('/auth/pin-select/login');
	};
	
	onCancel (e: any) {
		e.preventDefault();
		this.props.history.push('/auth/select');		
	};
	
};

export default PageAuthLogin;