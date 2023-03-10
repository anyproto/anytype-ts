import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, Header, DotIndicator, SimplePhrase, Error, Icon, IconObject } from 'Component';
import { I, translate, Animation, C, DataUtil, Storage, Util, Renderer, analytics, Preview, keyboard } from 'Lib';
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
	error?: string;
	iconOption: number;
}

const PageAuthOnboard = observer(class PageAuthOnboard extends React.Component<I.PageComponent, State> {
	soulContentRef: any = null;
	state: State = {
		stage: OnboardStage.VOID,
		keyPhraseCopied: false,
		iconOption: Util.rand(1, Constant.iconCnt)
	}
	
	render () {
		const { stage, error, iconOption } = this.state;

		// Mapping the Stages to text.json keys
		const stageNameMap = {
			[OnboardStage.VOID]: "Void",
			[OnboardStage.KEY_PHRASE]: "KeyPhrase",
			[OnboardStage.OFFLINE]: "Offline",
			[OnboardStage.SOUL]: "Soul",
			[OnboardStage.SOUL_CREATING]: "SoulCreating",
			[OnboardStage.SPACE_CREATING]: "SpaceCreating",
		}

		const backButton = this.canMoveBackward() ? <Icon className="back" onClick={this.onBack} /> : null;
		let dotIndicator = <DotIndicator activeIndex={this.state.stage} count={4} />;
		const title = <Title className="animation" text={translate(`authOnboard${stageNameMap[stage]}Title`)} />;
		let label = <Label className="animation" text={translate(`authOnboard${stageNameMap[stage]}Label`)} />;
		let submit = <Button text={translate(`authOnboard${stageNameMap[stage]}Submit`)} onClick={this.onNext} />;
		let accountStorageInfo = null;
		let accountNameField = null;
		let moreInfo = null;
		let keyPhrase = null;
		let soulContent = null;

		if (stage === OnboardStage.VOID || (stage === OnboardStage.KEY_PHRASE && this.state.keyPhraseCopied)) {
			submit = <Button text={translate(`authOnboardSubmit`)} onClick={this.onNext} />;
		}

		if (stage === OnboardStage.KEY_PHRASE) {
			keyPhrase = <div className="animation" onClick={this.copyAndUnblurKeyPhrase}><SimplePhrase isBlurred={!this.state.keyPhraseCopied} phrase={authStore.phrase}/></div>;
			moreInfo = <span className="animation moreInfo" onClick={this.onMoreInfoPopup}>More info</span>;
		}

		if (stage === OnboardStage.KEY_PHRASE || stage === OnboardStage.OFFLINE) {
			accountStorageInfo = <span className="animation storageInfo bottom" onClick={this.onAccountDataLocation}><Icon className="dataLocation" />Account data location</span>
			label = <Label className="animation" text={translate(`authOnboard${stageNameMap[stage]}Label`)} onClick={this.onKeyPhraseTooltip}  />;
		}

		if (stage === OnboardStage.SOUL) {
			accountNameField = <div className="animation"><input type="text" placeholder="Enter your name" onChange={e => authStore.nameSet(e.target.value)} /></div>
			submit = <Button className={this.canMoveForward() ? "" : "disabled"} text={translate(`authOnboard${stageNameMap[stage]}Submit`)} onClick={this.onNext} />;
		}


		if (stage === OnboardStage.SOUL_CREATING || stage === OnboardStage.SPACE_CREATING) {
			label = null;
			submit = null;
			dotIndicator = null;
			const cn = ["soulContent", "animation"];
			if (stage === OnboardStage.SOUL_CREATING) {
				cn.push("soulCreating");
			}
			if (stage === OnboardStage.SPACE_CREATING) {
				cn.push("spaceCreating");
			}
			soulContent = (
				<div ref={ref => { this.soulContentRef = ref; }} className={cn.join(" ")}>
					<div className="account">
						<IconObject object={{iconOption, layout: I.ObjectLayout.Human}} size={48} />
						<span className="accountName">{authStore.name}</span>
					</div>
					<div className="lineLeft"/> 
					<div className="lineRight"/> 
					<div className="space">
						<div className="spaceIcon">
							<IconObject object={{iconOption, layout: I.ObjectLayout.Human}} size={42} />
						</div>
						<span className="spaceName">Personal Space</span>
					</div>
				</div>);
		}

        return (
			<div>
				<Header {...this.props} component="authIndex" />
				{backButton}
				<Frame>
					{dotIndicator}
					{title}
					{label}	
					{accountNameField}
					{soulContent}
					<Error text={error} />
					{keyPhrase}
					<div className="buttons">
						<div className="animation">
							{submit}
						</div>
						{moreInfo}
					</div>
					{accountStorageInfo}
				</Frame>
			</div>
		);
	};

	componentDidMount (): void {
		Animation.to();
		this.createWallet();
		$(window).on('keydown.navigation', (e: any) => { this.onKeyDown(e); });
	};

	componentWillUnmount(): void {
		$(window).off('keydown.navigation');
	}
	
	componentDidUpdate (prevProps, prevState): void {
		if (prevState.stage !== this.state.stage) {
			Animation.to();
		}
	}

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => { this.onNext(); });
	};
	

	canMoveForward = (): boolean => {
		const { stage } = this.state;
		const nameNotEmpty = authStore.name && authStore.name.length > 0;
		return (
			   stage === OnboardStage.VOID
			|| stage === OnboardStage.KEY_PHRASE
			|| stage === OnboardStage.OFFLINE
			|| (stage === OnboardStage.SOUL && nameNotEmpty)
		)
	}

	onNext = () => {
		if (!this.canMoveForward()) {
			return;
		}
		const { stage, keyPhraseCopied } = this.state;

		if (stage === OnboardStage.KEY_PHRASE && !keyPhraseCopied) {
			this.copyAndUnblurKeyPhrase();
			return;
		}

		if (stage === OnboardStage.SOUL) {
			// this.createAccount();
			setTimeout(() => this.onNext(), 5000);
		}

		if (stage === OnboardStage.SOUL_CREATING) {
			setTimeout(() => this.onNext(), 5000);
		}

		if (stage === OnboardStage.SPACE_CREATING) {
			// TODO navigate to Usecases Screen
			Util.route('/auth/use-cases');
			return;
		}

		Animation.from(() => { this.setState(prev => ({ ...prev, stage: prev.stage + 1 })) });
	}

	canMoveBackward = (): boolean => {
		const { stage } = this.state;
		return stage <= OnboardStage.SOUL;
	}

	onBack = () => {
		if (!this.canMoveBackward()) {
			return;
		}
		if (this.state.stage === OnboardStage.VOID) {
			Util.route('/auth/invite');
		} else {
			Animation.from(() => { this.setState(prev => ({ ...prev, stage: prev.stage - 1 })) });
		}
	}

	createWallet = () => {
		const { walletPath } = authStore;
		commonStore.defaultTypeSet(Constant.typeId.note); // TODO necessary?
		C.WalletCreate(walletPath, message => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			}
			authStore.phraseSet(message.mnemonic);
		});
	}

	createAccount = () => {
		const { accountPath, name, code } = authStore;
		const { iconOption } = this.state;

		DataUtil.createSession(message => {
			if (message.error.code) {
				const error = Errors.AccountCreate[message.error.code] || message.error.description;
				this.setState({ error });
			}

			C.AccountCreate(name, "", accountPath, code, iconOption, message => {
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

	copyAndUnblurKeyPhrase = () => {
		this.setState({ keyPhraseCopied: true });
		Util.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: 'Recovery phrase copied to clipboard' });
	}

	onKeyPhraseTooltip = () => {
		Preview.tooltipShow(translate('authOnboardKeyPhraseTooltip'), $('.label'), I.MenuDirection.Bottom, I.MenuDirection.None)
	}

	onMoreInfoPopup = () => {
		// popupStore.open('', {});
	}

	onAccountDataLocation = () => {
		const { accountPath } = authStore;
		const text = `${translate('authOnboardAccountDataLocationTooltip')}:<br/>${accountPath}`
		Preview.tooltipShow(text, $('.storageInfo'), I.MenuDirection.Top, I.MenuDirection.None)
	}
});

export default PageAuthOnboard;