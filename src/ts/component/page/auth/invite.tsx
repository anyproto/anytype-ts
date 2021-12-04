import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { I, Storage, translate, C } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {}
interface State {
	error: string;
}

const PageAuthInvite = observer(class PageAuthInvite extends React.Component<Props, State> {

	ref: any;

	state = {
		error: ''
	};
	
	constructor (props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		
        return (
			<div>
				<Cover {...cover} className="main" />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authInviteTitle')} />
					<Label text={translate('authInviteLabel')} />
					<Error text={error} />
							
					<form className="form" onSubmit={this.onSubmit}>
						<Input ref={(ref: any) => this.ref = ref} type="password" placeholder={translate('authInvitePlaceholder')} />
						<div className="buttons">
							<Button type="input" text={translate('authInviteLogin')} />
						</div>
					</form>
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		this.ref.focus();
	};
	
	componentDidUpdate () {
		this.ref.focus();
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		const { match, history } = this.props;
		const value = this.ref.getValue().trim();

		if (!value) {
			this.setState({ error: translate('authInviteEmpty') });
			return;
		};
		
		authStore.codeSet(this.ref.getValue());
		history.push('/auth/setup/' + match.params.id);	
	};
	
});

export default PageAuthInvite;