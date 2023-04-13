import * as React from 'react';
import { Frame, Title, Label, Error, Input, Button, Icon } from 'Component';
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
		this.onCancel = this.onCancel.bind(this);
	};

	render () {
		const { error } = this.state;

        return (
			<div>
				<Icon className="arrow back" onClick={this.onCancel} />
				<Frame>

					<Title className="animation" text={translate('authInviteTitle')} />
					<Label className="animation" text={translate('authInviteLabel')} />
					<Error className="animation" text={error} />

					<form className="animation form" onSubmit={this.onSubmit}>
						<Input ref={ref => this.ref = ref} placeholder={translate('authInvitePlaceholder')} />
						<div className="animation  buttons">
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

	onSubmit (e: any) {
		e.preventDefault();

		const value = this.ref.getValue().trim();

		if (!value) {
			this.setState({ error: translate('authInviteEmpty') });
			return;
		};

		authStore.codeSet(value);
		Animation.from(() => { Util.route('/auth/onboard'); });
	};

	onCancel (e: any) {
		Animation.from(() => { Util.route('/auth/select'); });
	};

});

export default PageAuthInvite;