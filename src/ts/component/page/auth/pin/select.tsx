import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Pin, Header, FooterAuth as Footer } from 'Component';
import { translate, Util } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {}

interface State {
	error: string;
}

const Constant: any = require('json/constant.json');

const PageAuthPinSelect = observer(class PageAuthPinSelect extends React.Component<Props, State> {
	
	refObj: any = {};
	state = {
		error: ''
	};

	constructor (props: any) {
        super(props);

		this.onSuccess = this.onSuccess.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		
		let inputs = [];
		for (let i = 1; i <= Constant.pinSize; ++i) {
			inputs.push({ id: i });
		};
		
        return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<Title text={translate('authPinSelectTitle')} />
					<Label text={translate('authPinSelectLabel')} />
					<Error text={error} />
					
					<Pin onSuccess={this.onSuccess} />
				</Frame>
			</div>
		);
    };

	onSuccess (pin: string) {
		const { match } = this.props;

		authStore.pinSet(pin);
		Util.route('/auth/pin-confirm/' + match.params.id);
	};
	
});

export default PageAuthPinSelect;