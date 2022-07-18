import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import {Frame, Cover, Title, Label, Error, Input, Button, Header, FooterAuth as Footer, Icon} from 'ts/component';
import { Util, translate } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};
interface State {
	error: string;
};

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
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<div className="authBackWrap" onClick={this.onCancel}>
						<Icon className="back" />
						<div className="name">{translate('authLoginBack')}</div>
					</div>

					<Title text={translate('authInviteTitle')} />
					<Label text={translate('authInviteLabel')} />
					<Error text={error} />
							
					<form className="form" onSubmit={this.onSubmit}>
						<Input ref={(ref: any) => this.ref = ref} placeholder={translate('authInvitePlaceholder')} />
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
		
		const { match } = this.props;
		const value = this.ref.getValue().trim();

		if (!value) {
			this.setState({ error: translate('authInviteEmpty') });
			return;
		};
		
		authStore.codeSet(value);
		Util.route('/auth/setup/' + match.params.id);	
	};

	onCancel (e: any) {
		Util.route('/auth/register');
	};
	
});

export default PageAuthInvite;