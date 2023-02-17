import * as React from 'react';
import { Frame, Cover, Title, Label, Error, Button, Header, Footer } from 'Component';
import { I, Util, translate, Animation } from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PageAuthSelect = observer(class PageAuthSelect extends React.Component<I.PageComponent, State> {

	state = {
		error: ''
	};

	constructor (props: I.PageComponent) {
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
				<Frame className="animation" dataset={{ 'animation-index-from': 4 }}>
					<Title className="animation" dataset={{ 'animation-index-from': 0 }} text={translate('authSelectTitle')} />
					<Label className="animation" dataset={{ 'animation-index-from': 1 }} text={translate('authSelectLabel')} />
					<Error text={error} />
								
					<div className="buttons">
						<Button className="animation" dataset={{ 'animation-index-from': 2 }} text={translate('authSelectLogin')} type="input" onClick={this.onLogin} />
						<Button className="animation" dataset={{ 'animation-index-from': 3 }} text={translate('authSelectSignup')} type="input" color="grey" onClick={this.onRegister} />
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount(): void {
		Animation.to();	
	};
	
	onLogin (e: any) {
		Util.route('/auth/login');
	};
	
	onRegister (e: any) {
		Util.route('/auth/register/register');
	};
	
});

export default PageAuthSelect;