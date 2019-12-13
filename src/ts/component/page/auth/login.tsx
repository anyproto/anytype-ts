import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Textarea, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { Storage, translate, C } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
};
interface State {
	error: string;
};

@inject('commonStore')
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
		const { commonStore } = this.props;
		const { cover } = commonStore;
		const { error } = this.state;
		
        return (
			<div>
				<Cover num={cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authLoginTitle')} />
					<Label text={translate('authLoginLabel')} />
					<Error text={error} />
							
					<form onSubmit={this.onSubmit}>
						<Textarea ref={(ref: any) => this.phraseRef = ref} placeHolder={translate('authLoginPhrase')} />
						<div className="buttons">
							<Button type="input" text={translate('authLoginLogin')} className="orange" />
							<Button text={translate('authLoginBack')} className="grey" onClick={this.onCancel} />
						</div>
					</form>
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		this.phraseRef.focus();
	};
	
	componentDidUpdate () {
		this.phraseRef.focus();
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		const { authStore, history } = this.props;
		const { path } = authStore;
		
		this.phraseRef.setError(false);
		
		const phrase = this.phraseRef.getValue();
		
		C.WalletRecover(path, phrase, (message: any) => {
			if (message.error.code) {
				this.phraseRef.setError(true);
				this.setState({ error: message.error.description });
			} else {
				authStore.phraseSet(phrase);
				history.push('/auth/account-select');
			};
		});
	};
	
	onCancel (e: any) {
		this.props.history.push('/auth/select');
	};
	
};

export default PageAuthLogin;