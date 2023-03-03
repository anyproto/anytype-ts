import * as React from 'react';
import { Frame, Title, Label, Error, Input, Button, Header, Footer, Icon } from 'Component';
import { I, Util, Animation, translate } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PageAuthInvite = observer(class PageAuthInvite extends React.Component<I.PageComponent, State> {

	ref: any;

	state = {
		error: ''
	};
	
	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onBack = this.onBack.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Icon className="back" onClick={this.onBack} />
				<Frame>

					<Title className="animation" text={translate('authInviteTitle')} />
					<Label className="animation" text={translate('authInviteLabel')} />
					<Error className="animation" text={error} />
							
					<form className="form" onSubmit={this.onSubmit}>
						<Input ref={ref => this.ref = ref} placeholder={translate('authInvitePlaceholder')} />
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
		Animation.to();
	};
	
	componentDidUpdate () {
		this.ref.focus();
		Animation.to();
	};

	onSubmit (e) {
		e.preventDefault();
		
		const value = this.ref.getValue().trim();

		if (!value) {
			this.setState({ error: translate('authInviteEmpty') });
			return;
		};
		
		authStore.codeSet(value);
		Util.route('/auth/onboard');	
	};

	onBack () {
		Util.route('/auth/select');
	};
	
});

export default PageAuthInvite;