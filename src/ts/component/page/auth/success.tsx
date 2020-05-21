import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, Smile, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { I, translate, Storage, DataUtil } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};
interface State {};

@observer
class PageAuthSuccess extends React.Component<Props, State> {

	constructor (props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { cover } = commonStore;

		return (
			<div>
				<Cover {...cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Smile className="c64" icon="🎉" size={32} />
					<Title text={translate('authSuccessTitle')} />
					<Label text={translate('authSuccessLabel')} />
					<Button className="orange" text={translate('authSuccessSubmit')} onClick={this.onSubmit} />
				</Frame>
			</div>
		);
	};

	onSubmit (e: any) {
		const { history } = this.props;
		const pin = Storage.get('pin');
		
		DataUtil.pageInit(() => {
			if (pin) {
				history.push('/auth/pin-check/add');
			} else {
				history.push('/main/index');
			};
		});
	};

};

export default PageAuthSuccess;