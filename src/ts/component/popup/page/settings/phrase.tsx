import * as React from 'react';
import { observer } from 'mobx-react';
import QRCode from 'qrcode.react';
import { Title, Label, Phrase } from 'Component';
import { I, C, S, U, J, translate, analytics, Storage, Renderer } from 'Lib';

interface State {
	entropy: string;
	showCode: boolean;
};

const PopupSettingsPagePhrase = observer(class PopupSettingsPagePhrase extends React.Component<I.PopupSettings, State> {

	node: any = null;
	refPhrase: any = null;
	state = {
		entropy: '',
		showCode: false,
	};

	constructor (props: I.PopupSettings) {
		super(props);

		this.onCode = this.onCode.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onToggle = this.onToggle.bind(this);
	};

	render () {
		const { entropy, showCode } = this.state;
		const theme = S.Common.getThemeClass();

		return (
			<div
				ref={node => this.node = node}
			>
				<Title text={translate('popupSettingsPhraseTitle')} />
				<Label className="description" text={translate('popupSettingsPhraseText')} />
				
				<div className="inputs" onClick={this.onCopy}>
					<Phrase
						ref={ref => this.refPhrase = ref}
						readonly={true}
						isHidden={true}
						checkPin={true}
						onToggle={this.onToggle}
					/>
				</div>

				<Title className="sub" text={translate('popupSettingsMobileQRSubTitle')} />
				<Label className="description" text={translate('popupSettingsMobileQRText')} />

				<div className="qrWrap" onClick={this.onCode}>
					<div className={!showCode ? 'isBlurred' : ''}>
						<QRCode value={showCode ? entropy : translate('popupSettingsCodeStub')} fgColor={J.Theme[theme].qr.foreground} bgColor={J.Theme[theme].qr.bg} size={116} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { account } = S.Auth;

		if (!account) {
			return;
		};

		Renderer.send('keytarGet', account.id).then((value: string) => {
			C.WalletConvert(value, '', (message: any) => {
				if (!message.error.code) {
					this.refPhrase?.setValue(value);
					this.setState({ entropy: message.entropy });
				};
			});
		});

		analytics.event('ScreenKeychain', { type: 'ScreenSettings' });
	};

	onToggle (isHidden: boolean): void {
		if (!isHidden) {
			U.Common.copyToast(translate('commonPhrase'), this.refPhrase.getValue());
			analytics.event('KeychainCopy', { type: 'ScreenSettings' });
		};
	};

	onCopy () {
		this.refPhrase.onToggle();
	};

	onCode () {
		const { showCode } = this.state;
		const pin = Storage.getPin();
		const onSuccess = () => {
			this.setState({ showCode: !showCode });
		};

		pin && !showCode ? S.Popup.open('pin', { data: { onSuccess } }) : onSuccess();
	};

});

export default PopupSettingsPagePhrase;