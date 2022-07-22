import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Button, Header, FooterAuth as Footer, Textarea } from 'ts/component';
import { translate, DataUtil, analytics } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};
interface State {};

const $ = require('jquery');

const PageAuthSuccess = observer(class PageAuthSuccess extends React.Component<Props, State> {

	refPhrase: any = null;

	constructor (props: any) {
		super(props);

		this.onFocusPhrase = this.onFocusPhrase.bind(this);
		this.onBlurPhrase = this.onBlurPhrase.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onCopyPhrase = this.onCopyPhrase.bind(this);
	};

	render () {
		const { cover } = commonStore;
		const { phrase } = authStore;

		return (
			<div>
				<Cover {...cover} />
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<Title text="Here's your Recovery Phrase" />
					<Label text="Please save it somewhere safe - you will need it login to your account on other devices and to recover your data.<br/><br/>Tap below to reveal:" />
						
					<div className="textareaWrap">
						<Textarea 
							ref={(ref: any) => this.refPhrase = ref} 
							id="phrase" 
							value={phrase} 
							className="isBlurred"
							onFocus={this.onFocusPhrase} 
							onBlur={this.onBlurPhrase} 
							onCopy={this.onCopyPhrase}
							placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
							readonly={true}
						/>
					</div>

					<Button text={translate('authSuccessSubmit')} onClick={this.onSubmit} />
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		analytics.event('ScreenKeychain', { type: 'FirstSession' });
	};

	onSubmit (e: any) {
		DataUtil.onAuth(authStore.account);
	};

	onFocusPhrase (e: any) {
		this.refPhrase.select();
		this.elementUnblur(e);
	};

	onBlurPhrase (e: any) {
		this.elementBlur(e);
		window.getSelection().removeAllRanges();
	};

	onCopyPhrase () {
		analytics.event('KeychainCopy', { type: 'FirstSession' });
	};

	elementBlur (e: any) {
		$(e.currentTarget).addClass('isBlurred');
	};

	elementUnblur (e: any) {
		$(e.currentTarget).removeClass('isBlurred');
	};

});

export default PageAuthSuccess;