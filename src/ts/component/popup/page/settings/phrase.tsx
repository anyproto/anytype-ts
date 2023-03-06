import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import QRCode from 'qrcode.react';
import { Title, Label, Textarea, Button } from 'Component';
import { I, C, translate, analytics, Util, Preview } from 'Lib';
import { commonStore, authStore } from 'Store';
import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

interface State {
	entropy: string;
	showCode: boolean;
};

const QRColor = {
	'': '#fff',
	dark: '#b6b6b6',
};

const PopupSettingsPagePhrase = observer(class PopupSettingsPagePhrase extends React.Component<Props, State> {

	node: any = null;
	refPhrase: any = null;
	state = {
		entropy: '',
		showCode: false,
	};

	constructor (props: Props) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCode = this.onCode.bind(this);
	};

	render () {
		const { entropy, showCode } = this.state;
		const { theme } = commonStore;

		return (
			<div
				ref={node => this.node = node}
			>
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
							onCopy={() => { analytics.event('KeychainCopy', { type: 'ScreenSettings' }); }}
							placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
							readonly={true} 
						/>
					</div>
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

	onFocus () {
		const node = $(this.node);
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();

		Util.clipboardCopy({ text: authStore.phrase });
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