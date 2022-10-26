import * as React from 'react';
import { Frame, Cover, Title, Label, Error, Button, Header, Footer } from 'Component';
import { I, Util, translate, C } from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.PageComponent {};

interface State {
	error: string;
}

const PageAuthSelect = observer(class PageAuthSelect extends React.Component<Props, State> {

	state = {
		error: ''
	};

	constructor (props: any) {
        super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onRegister = this.onRegister.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		
        return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					<Title text={translate('authSelectTitle')} />
					<Label text={translate('authSelectLabel')} />
					<Error text={error} />
								
					<div className="buttons">
						<Button text={translate('authSelectLogin')} type="input" onClick={this.onLogin} />
						<Button text={translate('authSelectSignup')} type="input" color="grey" onClick={this.onRegister} />
					</div>
				</Frame>
			</div>
		);
	};
	
	onLogin (e: any) {
		Util.route('/auth/login');
	};
	
	onRegister (e: any) {
		Util.route('/auth/register/register');
	};
	
});

export default PageAuthSelect;