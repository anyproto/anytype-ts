import * as React from 'react';
import { Frame, Title, Label, Button, Header, Footer } from 'Component';
import { I, Util, translate } from 'Lib';
import { observer } from 'mobx-react';

const PageAuthNotice = observer(class PageAuthNotice extends React.Component<I.PageComponent, object> {

	constructor (props: I.PageComponent) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};
	
	render () {
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
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