import * as React from 'react';
import { observer } from 'mobx-react';
import QRCode from 'qrcode.react';
import { Title, Label, Textarea, Phrase } from 'Component';
import { I, C, translate, analytics, UtilCommon, Preview } from 'Lib';
import { commonStore, authStore } from 'Store';

interface State {
	entropy: string;
	showCode: boolean;
	phraseCopied: boolean;
};

const QRColor = {
	'': '#fff',
	dark: '#b6b6b6',
};

const PopupSettingsPagePhrase = observer(class PopupSettingsPagePhrase extends React.Component<I.PopupSettings, State> {

	node: any = null;
	refPhrase: any = null;
	state = {
		entropy: '',
		showCode: false,
		phraseCopied: false
	};

	constructor (props: I.PopupSettings) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCode = this.onCode.bind(this);
		this.onCopy = this.onCopy.bind(this);
	};

	render () {
		const { entropy, showCode, phraseCopied } = this.state;
		const theme = commonStore.getThemeClass();

		return (
			<div
				ref={node => this.node = node}
			>
				<Title text={translate('popupSettingsPhraseTitle')} />
				<Label className="description" text={translate('popupSettingsPhraseText')} />
				
				<div className="inputs" onClick={this.onCopy}>
					<Phrase
						ref={(ref) => (this.refPhrase = ref)}
						value={authStore.phrase}
						readonly={true}
						isHidden={!phraseCopied}
					/>
				</div>

				<Title className="sub" text={translate('popupSettingsMobileQRSubTitle')} />
				<Label className="description" text={translate('popupSettingsMobileQRText')} />

				<div className="qrWrap" onClick={this.onCode}>
					<div className={!showCode ? 'isBlurred' : ''}>
						<QRCode value={showCode ? entropy : translate('popupSettingsCodeStub')} bgColor={QRColor[theme]} size={116} />
					</div>
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

		analytics.event('ScreenKeychain', { type: 'ScreenSettings' });
	};

	onCopy = () => {
		this.refPhrase.onToggle();
		this.setState({ phraseCopied: true });
		UtilCommon.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: translate('toastRecoveryCopiedClipboard') });
	};

	onFocus () {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();

		UtilCommon.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: 'Recovery phrase copied to clipboard' });

		phrase.removeClass('isBlurred');
		analytics.event('KeychainCopy', { type: 'ScreenSettings' });
	};

	onBlur () {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));

		phrase.addClass('isBlurred');
		window.getSelection().removeAllRanges();
	};

	onCode () {
		 this.setState({ showCode: !this.state.showCode });
	};

});

export default PopupSettingsPagePhrase;