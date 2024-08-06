import * as React from 'react';
import { Frame, Label, Button, Header, Footer, Error } from 'Component';
import { I, U, translate, Animation, analytics } from 'Lib';

interface State {
	error: string;
};

class PageAuthSelect extends React.Component<I.PageComponent, State> {

	node = null;
	state = {
		error: '',
	};

	constructor (props: I.PageComponent) {
        super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onRegister = this.onRegister.bind(this);
	};

	render () {
		const { error } = this.state;

        return (
			<div ref={ref => this.node = ref}>
				<Header {...this.props} component="authIndex" />
				<Frame>
					<div className="logo animation" />
					<Label className="descr animation" text={translate('authSelectLabel')} />
					<Error text={error} />

					<div className="buttons">
						<div className="animation">
							<Button text={translate('authSelectSignup')} onClick={this.onRegister} />
						</div>
						<div className="animation">
							<Button text={translate('authSelectLogin')} color="blank" onClick={this.onLogin} />
						</div>
					</div>
				</Frame>
				<Footer {...this.props} className="animation" component="authDisclaimer" />
			</div>
		);
	};

	componentDidMount (): void {
		Animation.to(() => U.Common.renderLinks($(this.node)));

		analytics.removeContext();
		analytics.event('ScreenIndex');
	};

	onLogin () {
		Animation.from(() => U.Router.go('/auth/login', {}));
	};

	onRegister () {
		Animation.from(() => U.Router.go('/auth/onboard', {}));
	};

};

export default PageAuthSelect;