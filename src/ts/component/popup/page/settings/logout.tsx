import * as React from 'react';
import { Title, Label, Textarea, Button } from 'Component';
import { I, C, translate, analytics, UtilCommon, Preview } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';
import Constant from 'json/constant.json';
import Head from './head';

interface State {
	entropy: string;
	showCode: boolean;
};

const PopupSettingsPageLogout = observer(class PopupSettingsPageLogout extends React.Component<I.PopupSettings, State> {

	node: any = null;
	refPhrase: any = null;
	state = {
		entropy: '',
		showCode: false,
	};

	constructor (props: I.PopupSettings) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onLogout = this.onLogout.bind(this);
	};

	render () {
		return (
			<div
				ref={node => this.node = node}
			>
				<Head {...this.props} returnTo="account" name={translate('commonBack')} />
				
				<Title text={translate('popupSettingsPhraseTitle')} />
				<Label className="description" text={translate('popupSettingsPhraseText')} />
				
				<div className="inputs">
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
				</div>

				<div className="buttons">
					<Button className="c36" text={translate('popupSettingsPhraseBackup')} onClick={this.onCopy} />
					<Button color="red" className="c36" text={translate('popupSettingsLogout')} onClick={this.onLogout} />
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { phrase } = authStore;

		if (phrase) {
			C.WalletConvert(phrase, '', (message: any) => {
				this.setState({ entropy: message.entropy });
			});
		};

		analytics.event('ScreenKeychain', { type: 'BeforeLogout' });
	};

	onFocus () {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();

		phrase.removeClass('isBlurred');
	};

	onBlur () {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));

		phrase.addClass('isBlurred');
		window.getSelection().removeAllRanges();
	};

	onCopy (e: any) {
		this.refPhrase.focus();

		UtilCommon.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: 'Recovery phrase copied to clipboard' });

		analytics.event('KeychainCopy', { type: 'BeforeLogout' });
	};

	onLogout (e: any) {
		const { setPinConfirmed } = this.props;

		window.setTimeout(() => {
			authStore.logout(false);
			UtilCommon.route('/');

			setPinConfirmed(false);
		}, Constant.delay.popup);
	};

});

export default PopupSettingsPageLogout;