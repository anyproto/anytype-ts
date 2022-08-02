import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Button, Header, FooterAuth as Footer } from 'Component';
import { Util, translate } from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {}

const PageAuthNotice = observer(class PageAuthNotice extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		
        return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<Title text={translate('authNoticeTitle')} />
					<Label text={translate('authNoticeLabel')} />
							
					<div className="buttons">
						<Button text={translate('authNoticeStart')} onClick={this.onClick} />
					</div>
				</Frame>
			</div>
		);
	};

	onClick (e: any) {
		Util.route('/auth/select');
	};
	
});

export default PageAuthNotice;