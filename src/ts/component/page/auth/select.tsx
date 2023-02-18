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
				<Frame className="animation" dataset={{ 'animation-index-from': 3 }}>
					<Title className="animation" dataset={{ 'animation-index-from': 0 }} text={translate('authSelectTitle')} />
					<Label className="animation" dataset={{ 'animation-index-from': 1 }} text={translate('authSelectLabel')} />
								
					<div className="buttons">
						<Button 
							className="animation" 
							dataset={{ 'animation-index-from': 2 }} 
							text={translate('authSelectLogin')} 
							onClick={this.onLogin} 
						/>
						<Button 
							className="animation" 
							dataset={{ 'animation-index-from': 3 }} 
							text={translate('authSelectSignup')} 
							color="grey" 
							onClick={this.onRegister} 
						/>
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount(): void {
		Animation.to();
	};
	
	onLogin () {
		Animation.from(() => { Util.route('/auth/login'); });
	};
	
	onRegister (e: any) {
		Animation.from(() => { Util.route('/auth/register/register'); });
	};
	
});

export default PageAuthSelect;