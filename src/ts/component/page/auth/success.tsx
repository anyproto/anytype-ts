import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Button, IconObject, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { translate, DataUtil } from 'ts/lib';
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
					<IconObject size={64} object={{ iconEmoji: '🎉' }} />
					<Title text={translate('authSuccessTitle')} />
					<Label text={translate('authSuccessLabel')} />
					<Button text={translate('authSuccessSubmit')} onClick={this.onSubmit} />
				</Frame>
			</div>
		);
	};

	onSubmit (e: any) {
		DataUtil.onAuth();
	};

};

export default PageAuthSuccess;