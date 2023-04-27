import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, DotIndicator, Phrase, Error, Icon, IconObject, Input } from 'Component';
import { I, translate, Animation, C, DataUtil, Storage, Util, Renderer, analytics, Preview, keyboard } from 'Lib';
import { authStore, commonStore, popupStore, menuStore } from 'Store';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';
import CanvasWorkerBridge from './animation/canvasWorkerBridge';
import { OnboardStage as Stage } from './animation/constants';

type State = {
	stage: Stage;
	animationStage: Stage;
	phraseCopied: boolean;
	error?: string;
	iconOption: number;
};

const PageAuthOnboard = observer(class PageAuthOnboard extends React.Component<I.PageComponent, State> {

	node = null;
	refFrame = null;
	refPhrase = null;

	state: State = {
		stage: Stage.Void,
		animationStage: Stage.Void,
		phraseCopied: false,
		iconOption: Util.rand(1, Constant.iconCnt)
	};

	render () {
		const { error, stage, animationStage } = this.state;
		const { config } = commonStore;

		let back = null;
		let indicator = null;
		let label = null;
		let footer = null;

		if (this.canMoveBackward()) {
			back = <Icon className="arrow back" onClick={this.onBack} />;
		};

		if (![ Stage.SoulCreating, Stage.SpaceCreating ].includes(stage)) {
			indicator = <DotIndicator className="animation" index={stage} count={4} />;
			label = <Label id="label" className="animation" text={this.getText('Label')} />;
		};

		if ([ Stage.KeyPhrase, Stage.Offline ].includes(stage) && config.experimental) {
			footer = (
				<div id="accountPath" className="animation small bottom" onClick={this.onAccountPath}>
					<Icon className="gear" />
					Account data location
				</div>
			);
		};

        return (
			<div ref={ref => this.node = ref}>
				{back}
				<Frame ref={ref => this.refFrame = ref}>
					{indicator}
					<Title className="animation" text={this.getText('Title')} />
					{label}
					<Error className="animation" text={error} />
					{this.renderContent()}
					{this.renderButtons()}
					{footer}
				</Frame>
				<CanvasWorkerBridge state={animationStage} />
			</div>
		);
	};

	renderContent = (): JSX.Element => {
		const { stage, phraseCopied, iconOption } = this.state;

		if (stage == Stage.KeyPhrase) {
			return (
				<div className="animation" onClick={this.onCopy}>
					<Phrase ref={ref => this.refPhrase = ref} value={authStore.phrase} readonly={true} isHidden={!phraseCopied} />
				</div>
			);
		};

		if (stage == Stage.Soul) {
			return (
				<div className="animation">
					<Input
						focusOnMount
						type="text"
						placeholder="Enter your name"
						value={authStore.name}
						onKeyUp={(e, v) => authStore.nameSet(v)}
					/>
				</div>
			);
		};

		if ([ Stage.SoulCreating, Stage.SpaceCreating ].includes(stage)) {
			const cn = [ 'soulContent', 'animation', 'not-from' ];

			if (stage == Stage.SoulCreating) {
				cn.push('soulCreating');
			};

			if (stage == Stage.SpaceCreating) {
				cn.push('spaceCreating');
			};

			return (
				<div className={cn.join(' ')}>
					<div className="account">
						<IconObject object={{ iconOption, layout: I.ObjectLayout.Human }} size={48} />
						<span className="accountName">{authStore.name}</span>
					</div>

					<div className="line left" />
					<div className="line right" />

					<div className="space">
						<IconObject object={{ iconOption, layout: I.ObjectLayout.Space }} size={48} />
						<span className="spaceName">Personal Space</span>
					</div>
				</div>
			);
		};

		return null;
	};

	renderButtons = (): JSX.Element => {
		const { stage, phraseCopied } = this.state;

		if ([ Stage.SoulCreating, Stage.SpaceCreating ].includes(stage)) {
			return null;
		};

		let text = this.getText('Submit');
		let moreInfo = null;

		if ((stage == Stage.Void) || (stage == Stage.KeyPhrase && phraseCopied)) {
			text = translate('authOnboardSubmit');
		};

		if (stage == Stage.KeyPhrase) {
			moreInfo = <div className="animation small" onClick={this.onPhraseInfo}>More info</div>;
		};

		return (
			<div className="buttons">
				<Button
					className={[ 'animation', (this.canMoveForward() ? '' : 'disabled') ].join(' ')}
					text={text}
					onClick={this.guardedOnNext}
				/>
				{moreInfo}
			</div>
		);
	}

	componentDidMount (): void {
		Animation.to();

		this.walletCreate();
		this.rebind();
	};

	componentDidUpdate (prevProps, prevState): void {
		if (prevState.stage !== this.state.stage) {
			Animation.to();
		};

		if (this.refFrame) {
			this.refFrame.resize();
		};

		this.rebind();
	};

	componentWillUnmount(): void {
		this.unbind();
	};

	unbind () {
		$(window).off('keydown.onboarding');
	};

	rebind () {
		const node = $(this.node);
		const question = node.find('.questionMark');

		this.unbind();

		$(window).on('keydown.onboarding', (e) => { this.onKeyDown(e); });

		question.off('mouseenter mouseleave');
		question.on('mouseenter', () => this.onPhraseTooltip());
		question.on('mouseleave', () => Preview.tooltipHide());
	};

	getText = (name: string) => {
		const { stage } = this.state;

		const stageNameMap = {
			[ Stage.Void ]: 'Void',
			[ Stage.KeyPhrase ]: 'Phrase',
			[ Stage.Offline ]: 'Offline',
			[ Stage.Soul ]: 'Soul',
			[ Stage.SoulCreating ]: 'SoulCreating',
			[ Stage.SpaceCreating ]: 'SpaceCreating',
		};

		return translate(`authOnboard${stageNameMap[stage]}${name}`);
	}

	onKeyDown = (e) => {
		keyboard.shortcut('enter', e, this.guardedOnNext);
	};

	/** Like onNext, but only moves forward if it is a legal state change  */
	guardedOnNext = () => {
		if (this.canMoveForward()) {
			this.onNext();
		};
	};

	/** Guard to prevent illegal state change */
	canMoveForward = (): boolean => {
		const { stage } = this.state;

		let ret = false;
		if ([ Stage.Void, Stage.KeyPhrase, Stage.Offline ].includes(stage)) {
			ret = true;
		};
		if ((stage == Stage.Soul) && authStore.name) {
			ret = true;
		};
		return ret;
	};

	/** Guard to prevent illegal state change */
	canMoveBackward = (): boolean => {
		const { stage } = this.state;
		return stage <= Stage.Soul;
	};

	/** Moves the Onboarding Flow one stage forward
	 * Should not be triggered directly by UI without checking
	 * if state change is allowed.
	 *
	*/

	onNext = () => {
		const { stage, phraseCopied } = this.state;

		if ((stage == Stage.KeyPhrase) && !phraseCopied) {
			this.refPhrase.toggleVisibility();
			authStore.phraseSet(this.refPhrase.getValue());
			this.setState({ phraseCopied: true });
			this.onCopy();
			return;
		};

		if (stage == Stage.SpaceCreating) {
			this.createAccount();
			return;
		};

		/* 
			We want the onboarding stage to lag behind the animation stage by duration,
			but once we get to the Soul Creating, we dont want to update the animation anymore, and 
			instead we want it to lag behind the Animation Stage by a full step. Afterwards, the final animation stemp
			happens when the account is created, just before routing to the post-auth page.
		*/
		Animation.from(() => {
			const duration = 3000;
			if (stage == Stage.SoulCreating) {
				window.setTimeout(() => this.setState(prev => ({ ...prev, stage: prev.stage + 1 }), this.onNext), duration);
				return;
			}

			this.setState(prev => ({ ...prev, animationStage: prev.animationStage + 1 }),
			() => {
				window.setTimeout(() => {
					this.setState(prev => ({ ...prev, stage: prev.stage + 1 }), () => {
						if (Stage.Soul == stage) window.setTimeout(this.onNext, duration);
					});
				}, duration)
			})
		});
	}

	/** Moves the Onboarding Flow one stage backward, or exits it entirely */
	onBack = () => {
		if (!this.canMoveBackward()) {
			return;
		};

		const { stage } = this.state;

		if (stage == Stage.Void) {
			Util.route('/auth/invite');
		} else {
			Animation.from(() => { this.setState(prev => ({ ...prev, animationStage: prev.animationStage - 1, stage: prev.stage })) });
		};
	};

	walletCreate = () => {
		C.WalletCreate(authStore.walletPath, message => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			authStore.phraseSet(message.mnemonic);
		});
	};

	createAccount = () => {
		const { accountPath, name, code, phrase } = authStore;
		const { iconOption } = this.state;

		DataUtil.createSession(message => {
			if (message.error.code) {
				const error = Errors.AccountCreate[message.error.code] || message.error.description;
				this.setState({ error });
				return;
			};

			C.AccountCreate(name, '', accountPath, code, iconOption, message => {
				if (message.error.code) {
					const error = Errors.AccountCreate[message.error.code] || message.error.description;
					this.setState({ error });
					return;
				};

				if (message.config) {
					commonStore.configSet(message.config, false);
				};

				Renderer.send('keytarSet', message.account.id, phrase);
				authStore.previewSet('');

				Storage.set('timeRegister', Util.time());
				DataUtil.onAuth(message.account, () => { this.setState(prev => ({ ...prev, animationStage: prev.animationStage + 1 }), () => { Util.route('/main/usecase'); }) });

				analytics.event('CreateAccount');
			});
		});
	};

	/** Copies key phrase to clipboard and shows a toast */
	onCopy = () => {
		Util.clipboardCopy({ text: authStore.phrase });
		Preview.toastShow({ text: translate('toastRecoveryCopiedClipboard') });
	};

	/** Shows a tooltip that tells the user how to keep their Key Phrase secure */
	onPhraseTooltip = () => {
		const node = $(this.node);
		const label = node.find('#label');

		Preview.tooltipShow({
			delay: 150,
			text: translate('authOnboardPhraseTooltip'),
			element: label,
			typeY: I.MenuDirection.Bottom,
			typeX: I.MenuDirection.Center
		});
	};

	/** Shows a simple popup that educates the user about their account keyphrase */
	onPhraseInfo = () => {
		popupStore.open('confirm', {
            data: {
                text: translate('authOnboardPhraseMoreInfoPopupContent'),
                textConfirm: translate('commonOk'),
				canConfirm: true,
				canCancel: false,
                onConfirm: () => { popupStore.close('confirm'); },
            },
        });
	};

	/** Shows a tooltip that specififies where the Users account data is stored on their machine */
	onAccountPath = () => {
		menuStore.open('accountPath', {
			element: '#accountPath',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Center,
			offsetY: -20,
		});
	};

});

export default PageAuthOnboard;