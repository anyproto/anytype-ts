import * as React from 'react';
import { Frame, Cover, Title, Label, Error, Pin, Header, Footer } from 'Component';
import { I, Storage, Util, translate } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.PageComponent {};

interface State {
	error: string;
}

const sha1 = require('sha1');

const PageAuthPinConfirm = observer(class PageAuthPinConfirm extends React.Component<Props, State> {
	
	ref: any = null;
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
		
        return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					<Title text={translate('authPinConfirmTitle')} />
					<Label text={translate('authPinConfirmLabel')} />
					<Error text={error} />
					
					<Pin 
						ref={(ref: any) => { this.ref = ref; }}
						value={authStore.pin} 
						onSuccess={this.onSuccess} 
						onError={() => { this.setState({ error: translate('authPinConfirmError') }) }} 
					/>
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		this.rebind();
	};

	componentWillUnmount () {
		this.unbind();
	};

	unbind () {
		$(window).off('focus.pin');
	};

	rebind () {
		this.unbind();
		$(window).on('focus.pin', () => { this.ref.focus(); });
	};

	onSuccess (pin: string) {
		const { match } = this.props;
		const isAdd = match.params.id == 'add';
		const isSelect = match.params.id == 'select';

		Storage.set('pin', sha1(pin));
				
		if (isSelect) {
			Util.route('/auth/setup/select');
		};
			
		if (isAdd) {
			Util.route('/main/index');
		};
	};

});

export default PageAuthPinConfirm;