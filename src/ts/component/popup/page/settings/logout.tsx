import * as React from 'react';
import { Title, Label, Button, Phrase } from 'Component';
import { I, C, S, U, translate, analytics, Renderer } from 'Lib';
import { observer } from 'mobx-react';

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

		this.onCopy = this.onCopy.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onToggle = this.onToggle.bind(this);
	};

	render () {
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

				<div className="buttons">
					<Button className="c36" text={translate('popupSettingsPhraseBackup')} onClick={this.onCopy} />
					<Button color="red" className="c36" text={translate('popupSettingsLogout')} onClick={this.onLogout} />
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

		analytics.event('ScreenKeychain', { type: 'BeforeLogout' });
	};

	onToggle (isHidden: boolean): void {
		if (!isHidden) {
			U.Common.copyToast(translate('commonPhrase'), this.refPhrase.getValue());
			analytics.event('KeychainCopy', { type: 'BeforeLogout' });
		};
	};

	onCopy () {
		this.refPhrase.onToggle();
	};

	onLogout () {
		this.props.setPinConfirmed(false);
		analytics.event('LogOut');

		U.Router.go('/', { 
			replace: true, 
			animate: true,
			onRouteChange: () => {
				S.Auth.logout(true, false);
			},
		});
	};

});

export default PopupSettingsPageLogout;
