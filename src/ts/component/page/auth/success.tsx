import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Frame, Cover, Title, Label, Button, Header, Footer, Textarea } from 'Component';
import { I, translate, DataUtil, analytics, Util, Preview, Storage } from 'Lib';
import { commonStore, authStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

const PageAuthSuccess = observer(class PageAuthSuccess extends React.Component<I.PageComponent, object> {

	node: any = null;
	refPhrase: any = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onCopy = this.onCopy.bind(this);
	};

	render () {
		const { cover } = commonStore;

		return (
			<div ref={node => this.node = node}>
				<Cover {...cover} />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					<Title text="Here's your Recovery Phrase" />
					<Label text="Please save it somewhere safe - you will need it login to your account on other devices and to recover your data. You can also locate this phrase in your Account Settings.<br/><br/>Tap below to reveal:" />
						
					<div className="textareaWrap">
						<Textarea 
							ref={ref => this.refPhrase = ref} 
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
		//commonStore.redirectSet('/main/usecase');

		DataUtil.onAuth(authStore.account, () => {
			const blocks = blockStore.getBlocks(blockStore.widgets, it => it.isLink() && (it.content.targetBlockId == Constant.widgetId.recent));
			if (blocks.length) {
				Storage.setToggle('widget', blocks[0].parentId, true);
			};
		});
	};

	onFocus (e: any) {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();

		phrase.removeClass('isBlurred');
	};

	onBlur (e: any) {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));

		phrase.addClass('isBlurred');
		window.getSelection().removeAllRanges();
	};

	onCopy () {
		this.refPhrase.focus();
		Util.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: 'Recovery phrase copied to clipboard' });

		analytics.event('KeychainCopy', { type: 'BeforeLogout' });
	};

});

export default PageAuthSuccess;