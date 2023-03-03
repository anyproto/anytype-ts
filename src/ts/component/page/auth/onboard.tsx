import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, Header, Footer, DotIndicator, KeyPhrase, Error, Icon } from 'Component';
import { I, translate, Animation, C, DataUtil, Storage, Util, Renderer, analytics } from 'Lib';
import { authStore, commonStore } from 'Store';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';

enum OnboardStage {
	VOID = 0,
	KEY_PHRASE = 1,
	OFFLINE = 2,
	SOUL = 3,
	SOUL_CREATING = 4,
	SPACE_CREATING = 5,

}

type State = {
	stage: OnboardStage;
	keyPhraseCopied: boolean;
	error?: string
}

const PageAuthOnboard = observer(class PageAuthOnboard extends React.Component<I.PageComponent, State> {
	state: State = {
		stage: OnboardStage.VOID,
		keyPhraseCopied: false,
	}

	constructor (props: I.PageComponent) {
        super(props);
		this.onNext = this.onNext.bind(this);
		this.onBack = this.onBack.bind(this);
		this.createWallet = this.createWallet.bind(this);
		this.createAccount = this.createAccount.bind(this);
		this.onMoreInfoPopup = this.onMoreInfoPopup.bind(this);
		this.onAccountDataLocation = this.onAccountDataLocation.bind(this);
	};
	
	render () {
		const { stage, error } = this.state;

		// Mapping the Stages to text.json keys
		const stageNameMap = {
			[OnboardStage.VOID]: "Void",
			[OnboardStage.KEY_PHRASE]: "KeyPhrase",
			[OnboardStage.OFFLINE]: "Offline",
			[OnboardStage.SOUL]: "Soul",
			[OnboardStage.SOUL_CREATING]: "SoulCreating",
			[OnboardStage.SPACE_CREATING]: "SpaceCreating",
		}

		const title = <Title className="animation" text={translate(`authOnboard${stageNameMap[stage]}Title`)} />;
		let label = <Label className="animation" text={translate(`authOnboard${stageNameMap[stage]}Label`)} />;
		let submit = <Button text={translate(`authOnboard${stageNameMap[stage]}Submit`)} onClick={this.onNext} />;
		let dotIndicator = <DotIndicator activeIndex={this.state.stage} count={4} />;
		let accountStorageInfo = null;
		let accountNameField = null;

		if (stage === OnboardStage.VOID || (stage === OnboardStage.KEY_PHRASE && this.state.keyPhraseCopied)) {
			submit = <Button text={translate(`authOnboardSubmit`)} onClick={this.onNext} />;
		}

		if (stage === OnboardStage.KEY_PHRASE || stage === OnboardStage.OFFLINE) {
			accountStorageInfo = <span className="animation storageInfo bottom" onClick={this.onAccountDataLocation}><Icon className="dataLocation" />Account data location</span>
		}

		if (stage === OnboardStage.SOUL) {
			accountNameField = <div className="animation"><input type="text" placeholder="Account name" onChange={e => authStore.nameSet(e.target.value)} /></div>
			// TODO disabled if no text set
			submit = <Button className="disabled"text={translate(`authOnboard${stageNameMap[stage]}Submit`)} onClick={this.onNext} />;;
		}


		if (stage === OnboardStage.SOUL_CREATING || stage === OnboardStage.SPACE_CREATING) {
			label = null;
			submit = null;
			dotIndicator = null;
		}

        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Icon className="back" onClick={this.onBack} />
				<Frame>
					{dotIndicator}
					{title}
					{label}	
					{accountNameField}
					<Error text={error} />
					{ this.state.stage === OnboardStage.KEY_PHRASE ? <div className="animation"><KeyPhrase/></div> : null }
					<div className="buttons">
						<div className="animation">
							{submit}
						</div>
						{ this.state.stage === OnboardStage.KEY_PHRASE ? <span className="animation moreInfo" onClick={this.onMoreInfoPopup}>More info</span> : null}
					</div>
					{accountStorageInfo}
				</Frame>
			</div>
		);
	};

	componentDidMount (): void {
		Animation.to();
		this.createWallet();
	};

	componentDidUpdate (): void {
		Animation.to();
	}

	async onNext () {
		Animation.from(() => { this.setState(prev => ({ ...prev, stage: prev.stage + 1 })) });
	}
	
	async onBack () {
		if (this.state.stage === OnboardStage.VOID) {
			Util.route('/auth/invite');
		} else {
			Animation.from(() => { this.setState(prev => ({ ...prev, stage: prev.stage - 1 })) });
		}
	}

	createWallet () {
		const { walletPath } = authStore;
		commonStore.defaultTypeSet(Constant.typeId.note); // TODO necessary?
		C.WalletCreate(walletPath, message => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			}
			authStore.phraseSet(message.mnemonic);
		});
	}

	createAccount () {
		const { accountPath, name, icon, code } = authStore;

		DataUtil.createSession(message => {
			if (message.error.code) {
				const error = Errors.AccountCreate[message.error.code] || message.error.description;
				this.setState({ error });
			}

			C.AccountCreate(name, icon, accountPath, code, message => {
				if (message.error.code) {
					const error = Errors.AccountCreate[message.error.code] || message.error.description;
					this.setState({ error });
				}

				if (message.config) {
					commonStore.configSet(message.config, false);
				};

				authStore.accountSet(message.account);
				authStore.previewSet('');
				Storage.set('timeRegister', Util.time());
				Renderer.send('keytarSet', message.account.id, authStore.phrase);
				analytics.event('CreateAccount');
			});
		})
	};

	onMoreInfoPopup () {
		alert("wow");
	}

	onAccountDataLocation () {
		alert("wow");
	}
});

export default PageAuthOnboard;