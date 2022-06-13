import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Textarea, Button } from 'ts/component';
import { I, C, translate, analytics } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onConfirmPhrase: () => void;
};

interface State {
	entropy: string;
	showCode: boolean;
};

const QRCode = require('qrcode.react');
const QRColor = {
	'': '#fff',
	dark: '#aca996'
};

const PopupSettingsPagePhrase = observer(class PopupSettingsPagePhrase extends React.Component<Props, State> {

	refPhrase: any = null;
	state = {
		entropy: '',
		showCode: false,
	};

	constructor (props: any) {
		super(props);

		this.onFocusPhrase = this.onFocusPhrase.bind(this);
		this.onBlurPhrase = this.onBlurPhrase.bind(this);
		this.elementBlur = this.elementBlur.bind(this);
	};

	render () {
		const { onConfirmPhrase } = this.props;
		const { entropy, showCode } = this.state;
		const { theme } = commonStore;
		const { phrase } = authStore;

		return (
			<div>
				<Head {...this.props} id="account" name={translate('popupSettingsAccountTitle')} />
				
				<Title text={translate('popupSettingsPhraseTitle')} />
				<Label text={translate('popupSettingsPhraseText')} />
				
				<div className="inputs">
					<Textarea 
						ref={(ref: any) => this.refPhrase = ref} 
						id="phrase" 
						value={translate('popupSettingsPhraseStub')} 
						className="isBlurred"
						onFocus={this.onFocusPhrase} 
						onBlur={this.onBlurPhrase} 
						onCopy={() => { 
							analytics.event('KeychainCopy', { type: onConfirmPhrase ? 'BeforeLogout' : 'ScreenSettings' });
						}}
						placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
						readonly={true} 
					/>
				</div>

				{!onConfirmPhrase ? (
					<div className="path">
						<div className="side left">
							<b>{translate('popupSettingsMobileQRSubTitle')}</b>
							<Label text={translate('popupSettingsMobileQRText')} />
						</div>
						<div className={[ 'side', 'right', (!showCode ? 'isBlurred' : '') ].join(' ')} onClick={() => { this.setState({ showCode: !showCode }); }}>
							<div className="qrWrap">
								<QRCode value={showCode ? entropy : translate('popupSettingsCodeStub')} bgColor={QRColor[theme]} size={100} />
							</div>
						</div>
					</div>
				) : (
					<div className="buttons">
						<Button text={translate('popupSettingsPhraseOk')} onClick={() => { onConfirmPhrase(); }} />
					</div>
				)}
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

		analytics.event('ScreenKeychain', { type: this.props.onConfirmPhrase ? 'BeforeLogout' : 'ScreenSettings' });
	};

	onFocusPhrase (e: any) {
		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();
		this.elementUnblur(e);
	};

	onBlurPhrase (e: any) {
		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));
		this.elementBlur(e);
		window.getSelection().removeAllRanges();
	};

	elementBlur (e: any) {
		$(e.currentTarget).addClass('isBlurred');
	};

	elementUnblur (e: any) {
		$(e.currentTarget).removeClass('isBlurred');
	};

});

export default PopupSettingsPagePhrase;