import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Textarea, Button } from 'Component';
import { I, C, translate, analytics, Util } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

interface State {
	entropy: string;
	showCode: boolean;
};

const QRCode = require('qrcode.react');
const QRColor = {
	'': '#fff',
	dark: '#aca996',
};

const PopupSettingsPagePhrase = observer(class PopupSettingsPagePhrase extends React.Component<Props, State> {

	refPhrase: any = null;
	state = {
		entropy: '',
		showCode: false,
	};

	constructor (props: any) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onCode = this.onCode.bind(this);
	};

	render () {
		const { entropy, showCode } = this.state;
		const { theme } = commonStore;
		const { phrase } = authStore;

		return (
			<div>
				<Head {...this.props} returnTo="account" name={translate('popupSettingsAccountTitle')} />
				
				<Title text={translate('popupSettingsPhraseTitle')} />
				<Label text={translate('popupSettingsPhraseText')} />
				
				<div className="inputs">
					<div className="textareaWrap">
						<Textarea 
							ref={(ref: any) => this.refPhrase = ref} 
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

					<Button color="blank" text={translate('popupSettingsPhraseCopy')} onClick={this.onCopy} />
				</div>

				<div className="sides">
					<div className="side left">
						<b>{translate('popupSettingsMobileQRSubTitle')}</b>
						<Label text={translate('popupSettingsMobileQRText')} />
					</div>

					<div className={[ 'side', 'right', (!showCode ? 'isBlurred' : '') ].join(' ')} onClick={this.onCode}>
						<div className="qrWrap">
							<QRCode value={showCode ? entropy : translate('popupSettingsCodeStub')} bgColor={QRColor[theme]} size={100} />
						</div>
					</div>
				</div>

				<Button color="blank" text={translate('popupSettingsPhraseShowQR')} onClick={this.onCode} />

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
		const node = $(ReactDOM.findDOMNode(this));
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();

		phrase.removeClass('isBlurred');
	};

	onBlur () {
		const node = $(ReactDOM.findDOMNode(this));
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));

		phrase.addClass('isBlurred');
		window.getSelection().removeAllRanges();
	};

	onCopy (e: any) {
		this.refPhrase.focus();
		Util.clipboardCopy({ text: authStore.phrase });

		analytics.event('KeychainCopy', { type: 'ScreenSettings' });
	};

	onCode () {
		 this.setState({ showCode: !this.state.showCode });
	};

});

export default PopupSettingsPagePhrase;