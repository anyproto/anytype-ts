import * as React from 'react';
import { Frame, Label, Button, Header, Footer } from 'Component';
import { I, UtilRouter, translate, Animation, analytics } from 'Lib';

class PageAuthSelect extends React.Component<I.PageComponent> {

	constructor (props: I.PageComponent) {
        super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onRegister = this.onRegister.bind(this);
	};

	render () {
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Frame>
					<div className="logo animation" />
					<Label className="descr animation" text={translate('authSelectLabel')} />

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
		Animation.to();
		window.setTimeout(() => analytics.event('ScreenIndex'), 100);
	};

	onLogin () {
		Animation.from(() => UtilRouter.go('/auth/login', {}));
	};

	onRegister () {
		Animation.from(() => UtilRouter.go('/auth/onboard', {}));
	};

};

export default PageAuthSelect;