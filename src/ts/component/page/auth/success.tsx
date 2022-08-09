import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Button, Header, FooterAuth as Footer, Textarea } from 'Component';
import { translate, DataUtil, analytics, Util } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};
interface State {};

const $ = require('jquery');

const PageAuthSuccess = observer(class PageAuthSuccess extends React.Component<Props, State> {

	refPhrase: any = null;

	constructor (props: any) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onCopy = this.onCopy.bind(this);
	};

	render () {
		const { cover } = commonStore;

		return (
			<div>
				<Cover {...cover} />
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<Title text="Here's your Recovery Phrase" />
					<Label text="Please save it somewhere safe - you will need it login to your account on other devices and to recover your data. You can also locate this phrase in your Account Settings.<br/><br/>Tap below to reveal:" />
						
					<div className="textareaWrap">
						<Textarea 
							ref={(ref: any) => this.refPhrase = ref} 
							id="phrase" 
							value={translate('popupSettingsPhraseStub')} 
							className="isBlurred"
							onFocus={this.onFocus} 
							onBlur={this.onBlur} 
							onCopy={this.onCopy}
							placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
							readonly={true}
						/>
					</div>

					<div className="buttons">
						<Button color="blank" text={translate('authSuccessCopy')} onClick={this.onCopy} />
						<Button text={translate('authSuccessSubmit')} onClick={this.onSubmit} />
					</div>
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

	onFocus (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();

		phrase.removeClass('isBlurred');
	};

	onBlur (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));

		phrase.addClass('isBlurred');
		window.getSelection().removeAllRanges();
	};

	onCopy () {
		this.refPhrase.focus();
		Util.clipboardCopy({ text: authStore.phrase });

		analytics.event('KeychainCopy', { type: 'BeforeLogout' });
	};

});

export default PageAuthSuccess;