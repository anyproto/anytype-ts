import * as React from 'react';
import { Frame, Title, Label, Error, Input, Button, Header, Footer, Icon } from 'Component';
import { I, Util, translate } from 'Lib';
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
	};
	
	render () {
		const { error } = this.state;
		
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					<div className="backWrap" onClick={this.onCancel}>
						<Icon className="back" />
						<div className="name">{translate('commonBack')}</div>
					</div>

					<Title text={translate('authInviteTitle')} />
					<Label text={translate('authInviteLabel')} />
					<Error text={error} />
							
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
	};
	
	componentDidUpdate () {
		this.ref.focus();
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		const value = this.ref.getValue().trim();

		if (!value) {
			this.setState({ error: translate('authInviteEmpty') });
			return;
		};
		
		authStore.codeSet(value);
		Util.route('/auth/onboard');	
	};

	onCancel (e: any) {
		Util.route('/auth/select');
	};
	
});

export default PageAuthInvite;