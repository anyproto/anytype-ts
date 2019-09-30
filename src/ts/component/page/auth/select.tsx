import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { dispatcher, Storage } from 'ts/lib';
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
class PageAuthSelect extends React.Component<Props, State> {

	state = {
		error: ''
	};

	constructor (props: any) {
        super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onRegister = this.onRegister.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
        return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Organize everything" />
					<Label text="With Anytype you can write notes and documents, manage tasks, share files and save important content from the web." />
					<Error text={error} />
								
					<div className="buttons">
						<Button text="Login" type="input" className="orange" onClick={this.onLogin} />
						<Button text="Sign up" type="input" className="grey" onClick={this.onRegister} />
					</div>
				</Frame>
			</div>
		);
    };

	onLogin (e: any) {
		e.preventDefault();
		this.props.history.push('/auth/login');
	};
	
	onRegister (e: any) {
		const { authStore, history } = this.props;
		
		e.preventDefault();
		
		let request = { 
			rootPath: Config.root
		};
		
		dispatcher.call('walletCreate', request, (errorCode: any, message: any) => {
			if (message.error.code) {
				let error = message.error.description;
				if (error) {
					this.setState({ error: error });
				};
			} else {
				authStore.phraseSet(message.mnemonic);
				history.push('/auth/register/register');
			};
		});
	};
	
};

export default PageAuthSelect;