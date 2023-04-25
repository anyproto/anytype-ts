import * as React from 'react';
import { Frame, Title, Label, Button, Header, Footer } from 'Component';
import { I, Util, translate, Animation } from 'Lib';
import { observer } from 'mobx-react';

const PageAuthSelect = observer(class PageAuthSelect extends React.Component<I.PageComponent> {

	constructor (props: I.PageComponent) {
        super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onRegister = this.onRegister.bind(this);
	};

	render () {
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />

				<Frame>
					<Title className="animation" text={translate('authSelectTitle')} />
					<Label className="animation" text={translate('authSelectLabel')} />

					<div className="buttons">
						<div className="animation">
							<Button text={translate('authSelectSignup')} onClick={this.onRegister} />
						</div>
						<div className="animation">
							<Button text={translate('authSelectLogin')} color="grey" onClick={this.onLogin} />
						</div>
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount(): void {
		Animation.to();
	};

	componentDidUpdate(): void {
		Animation.to();
	};

	onLogin () {
		Animation.from(() => { Util.route('/auth/login'); });
	};

	onRegister () {
		Animation.from(() => { Util.route('/auth/invite'); });
	};

});

export default PageAuthSelect;