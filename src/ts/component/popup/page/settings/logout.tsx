import * as React from 'react';
import { Title, Label, Button, Phrase } from 'Component';
import { I, C, translate, analytics, UtilCommon, UtilRouter, Renderer } from 'Lib';
import { authStore } from 'Store';
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
						value={authStore.phrase}
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
		const { phrase } = authStore;

		if (phrase) {
			C.WalletConvert(phrase, '', (message: any) => {
				this.setState({ entropy: message.entropy });
			});
		};

		analytics.event('ScreenKeychain', { type: 'BeforeLogout' });
	};

	onToggle (isHidden: boolean): void {
		if (!isHidden) {
			UtilCommon.copyToast(translate('commonPhrase'), authStore.phrase);
			analytics.event('KeychainCopy', { type: 'BeforeLogout' });
		};
	};

	onCopy () {
		this.refPhrase.onToggle();
	};

	onLogout () {
		const { setPinConfirmed } = this.props;

		UtilRouter.go('/', { 
			replace: true, 
			animate: true,
			onFadeIn: () => {
				authStore.logout(true, false);
				setPinConfirmed(false);
			},
		});
	};

});

export default PopupSettingsPageLogout;
