import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, DotIndicator, SimplePhrase, Error, Icon, IconObject } from 'Component';
import { I, translate, Animation, C, DataUtil, Storage, Util, Renderer, analytics, Preview, keyboard } from 'Lib';
import { authStore, blockStore, commonStore, popupStore } from 'Store';
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

const ANIMATION_CN = 'animation';
const STORAGE_INFO_CN = 'storageInfo';

const PageAuthOnboard = observer(class PageAuthOnboard extends React.Component<I.PageComponent, State> {
	soulContentRef: any = null;
	state: State = {
		stage: OnboardStage.VOID,
		keyPhraseCopied: false,
		iconOption: Util.rand(1, Constant.iconCnt)
	}

	componentDidMount (): void {
		Animation.to();
		this.createWallet();
		$(window).on('keydown.navigation', (e) => { this.onKeyDown(e); });
	};

	componentWillUnmount(): void {
		$(window).off('keydown.navigation');
	}

	componentDidUpdate (prevProps, prevState): void {
		if (prevState.stage !== this.state.stage) {
			Animation.to();
		}
	}

	render () {
        return (
			<div>
				{this.renderBackButton()}
				<Frame>
					{this.renderProgressIndicator()}
					{this.renderTitle()}
					{this.renderLabel()}
					{this.renderError()}
					{this.renderContent()}
					{this.renderButtons()}
					{this.renderFooter()}
				</Frame>
			</div>
		);
	};

	renderContent (): JSX.Element {
		const { stage, keyPhraseCopied, iconOption } = this.state;

		if (stage === OnboardStage.KEY_PHRASE) {
			return (
				<div
					className={ANIMATION_CN}
					onClick={this.copyAndUnblurKeyPhrase}
				>
						<SimplePhrase
							isBlurred={!keyPhraseCopied}
							phrase={authStore.phrase}
						/>
				</div>
			);
		}

		if (stage === OnboardStage.SOUL) {
			return (
				<div className={ANIMATION_CN}>
					<input
						type="text"
						placeholder="Enter your name"
						value={authStore.name}
						onChange={e => authStore.nameSet(e.target.value)}
						/>
				</div>
			);
		}


		if (stage === OnboardStage.SOUL_CREATING || stage === OnboardStage.SPACE_CREATING) {
			const cn = ["soulContent", ANIMATION_CN];
			if (stage === OnboardStage.SOUL_CREATING) {
				cn.push("soulCreating");
			}
			if (stage === OnboardStage.SPACE_CREATING) {
				cn.push("spaceCreating");
			}
			return (
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
				</div>
			);
		}

		return null;
	}

	renderLabel (): JSX.Element {
		const { stage } = this.state;

		if (stage === OnboardStage.SOUL_CREATING || stage === OnboardStage.SPACE_CREATING) {
			return null;
		}

		return (
			<Label
				className={ANIMATION_CN}
				text={this.getText("Label")}
				onClick={stage === OnboardStage.KEY_PHRASE ? this.showKeyPhraseTooltip : null }
			/>
		);
	}

	renderTitle (): JSX.Element {
		return <Title className={ANIMATION_CN} text={this.getText("Title")} />;
	}

	renderProgressIndicator (): JSX.Element {
		const { stage } = this.state;

		if (stage === OnboardStage.SOUL_CREATING || stage === OnboardStage.SPACE_CREATING) {
			return null;
		}

		return  <div className={ANIMATION_CN}><DotIndicator activeIndex={this.state.stage} count={4} /></div>;
	}

	renderBackButton (): JSX.Element {
		if (this.canMoveBackward()) {
			return <Icon className="back" onClick={this.onBack} />;
		}

		return null;
	}

	renderError (): JSX.Element {
		const { error } = this.state;

		return  <Error className={ANIMATION_CN} text={error} />;;
	}

	renderButtons (): JSX.Element {
		const { stage, keyPhraseCopied } = this.state;

		if (stage === OnboardStage.SOUL_CREATING || stage === OnboardStage.SPACE_CREATING) {
			return null;
		}

		const submitText = stage === OnboardStage.VOID || (stage === OnboardStage.KEY_PHRASE && keyPhraseCopied) ? translate(`authOnboardSubmit`) : this.getText("Submit");

		const submit = <Button
			className={[ANIMATION_CN, this.canMoveForward() ? "" : "disabled"].join(" ")}
			text={submitText}
			onClick={this.guardedOnNext}
		/>

		const moreInfo = stage === OnboardStage.KEY_PHRASE ?
			(<span
				className={[ANIMATION_CN, "moreInfo"].join(" ")}
				onClick={this.showKeyPhraseInfoPopup}
			>More info
			</span>) : null;

		return (
			<div className="buttons">
				{submit}
				{moreInfo}
			</div>
		);
	}

	renderFooter () {
		const { stage } = this.state;

		if (stage === OnboardStage.KEY_PHRASE || stage === OnboardStage.OFFLINE) {
			return (
				<span
					className={[ANIMATION_CN, STORAGE_INFO_CN, "bottom"].join(" ")}
					onClick={this.showAccountDataTooltip}>
						<Icon className="dataLocation" />
						Account data location
				</span>
			);
		}

		return null;
	}

	getText(name: string) {
		const { stage } = this.state;

		const stageNameMap = {
			[OnboardStage.VOID]: 'Void',
			[OnboardStage.KEY_PHRASE]: 'KeyPhrase',
			[OnboardStage.OFFLINE]: 'Offline',
			[OnboardStage.SOUL]: 'Soul',
			[OnboardStage.SOUL_CREATING]: 'SoulCreating',
			[OnboardStage.SPACE_CREATING]: 'SpaceCreating',
		};

		return translate(`authOnboard${stageNameMap[stage]}${name}`);
	}

	onKeyDown = (e) => {
		keyboard.shortcut('enter', e, this.guardedOnNext);
	};

	/** Like onNext, but only moves forward if it is a legal state change  */
	guardedOnNext = () => {
		if (this.canMoveForward()) {
			this.onNext()
		}
	}

	/** Guard to prevent illegal state change */
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

	/** Moves the Onboarding Flow one stage forward
	 * Should not be triggered directly by UI without checking
	 * if state change is allowed.
	 *
	*/
	onNext = () => {
		const { stage, keyPhraseCopied } = this.state;

		if (stage === OnboardStage.KEY_PHRASE && !keyPhraseCopied) {
			this.copyAndUnblurKeyPhrase();
			return;
		}

		if (stage === OnboardStage.SOUL) {
			this.createAccount();
			setTimeout(() => this.onNext(), 5000);
		}

		if (stage === OnboardStage.SOUL_CREATING) {
			setTimeout(() => this.onNext(), 5000);
		}

		if (stage === OnboardStage.SPACE_CREATING) {
			// TODO navigate to Usecases Screen
			Util.route('/');
			return;
		}

		Animation.from(() => { this.setState(prev => ({ ...prev, stage: prev.stage + 1 })) });
	}

	/** Guard to prevent illegal state change */
	canMoveBackward = (): boolean => {
		const { stage } = this.state;
		return stage <= OnboardStage.SOUL;
	}

	/** Moves the Onboarding Flow one stage backward, or exits it entirely */
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

	/** Copies key phrase to clipboard and shows a toast */
	copyAndUnblurKeyPhrase = () => {
		this.setState({ keyPhraseCopied: true });
		Util.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: translate('toastRecoveryCopiedClipboard') });
	}

	/** Shows a tooltip that tells the user how to keep their Key Phrase secure */
	showKeyPhraseTooltip = () => {
		Preview.tooltipShow(
			translate('authOnboardKeyPhraseTooltip'),
			$('.label'),
			I.MenuDirection.Bottom,
			I.MenuDirection.None
		);
	}

	/** Shows a simple popup that educates the user about their account keyphrase */
	showKeyPhraseInfoPopup = () => {
		popupStore.open('confirm', {
            data: {
                title: translate('authOnboardKeyPhraseMoreInfoPopupTitle'),
                text: translate('authOnboardKeyPhraseMoreInfoPopupContent'),
                textConfirm: 'Okay',
				canConfirm: true,
				canCancel: false,
                onConfirm: () => {
					popupStore.close("confirm");
				},
            },
        });
	}

	/** Shows a tooltip that specififies where the Users account data is stored on their machine */
	showAccountDataTooltip = () => {
		const { accountPath } = authStore;
		const text = `${translate('authOnboardAccountDataLocationTooltip')}:<br/>${accountPath}`
		Preview.tooltipShow(
			text,
			$('.' + STORAGE_INFO_CN),
			I.MenuDirection.Top,
			I.MenuDirection.None
		);
	}
});

export default PageAuthOnboard;