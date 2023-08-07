import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, DotIndicator, Phrase, Error, Icon, IconObject, Input } from 'Component';
import { I, translate, Animation, C, UtilData, Storage, UtilCommon, Renderer, analytics, Preview, keyboard, UtilObject } from 'Lib';
import { authStore, commonStore, popupStore, menuStore, blockStore } from 'Store';
import Constant from 'json/constant.json';
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

	node: HTMLDivElement = null;
	refFrame: Frame = null;
	refPhrase: Phrase = null;
	refNext = null;
	account: I.Account = null;
	isDelayed = false;

	state: State = {
		stage: Stage.Void,
		animationStage: Stage.Void,
		phraseCopied: false,
		iconOption: UtilCommon.rand(1, Constant.iconCnt),
	};

	render () {
		const { error, stage, animationStage } = this.state;
		const { config } = commonStore;

		let back = null;
		let indicator = null;
		let label = null;
		let footer = null;
		let content = null;

		if (this.canMoveBackward()) {
			back = <Icon className="arrow back" onClick={this.onBack} />;
		};

		if (![ Stage.SoulCreating, Stage.SpaceCreating ].includes(stage)) {
			indicator = <DotIndicator className="animation" index={stage} count={4} />;
			label = <Label id="label" className="animation" text={this.getText('Label')} />;
		};

		if ([ Stage.Phrase, Stage.Offline ].includes(stage) && config.experimental ) {
			footer = (
				<div id="accountPath" className="animation small bottom" onClick={this.onAccountPath}>
					<Icon className="gear" />
					{translate('pageAuthOnboardAccountDataLocation')}
				</div>
			);
		};

		if (error) {
			content = <Error className="animation" text={error} />;
		} else {
			content = (
				<React.Fragment>
					{indicator}
					<Title className="animation" text={this.getText('Title')} />
					{label}
					{this.renderContent()}
					{this.renderButtons()}
					{footer}
				</React.Fragment>
			);
		};

		return (
			<div ref={(ref) => (this.node = ref)}>
				{back}

				<Frame ref={(ref) => (this.refFrame = ref)}>
					{content}
				</Frame>

				<CanvasWorkerBridge state={animationStage} />
			</div>
		);
	};

	renderContent = (): JSX.Element => {
		const { stage, phraseCopied, iconOption } = this.state;

		if (stage == Stage.Phrase) {
			return (
				<div className="animation" onClick={this.onCopy}>
					<Phrase
						ref={(ref) => (this.refPhrase = ref)}
						value={authStore.phrase}
						readonly={true}
						isHidden={!phraseCopied}
					/>
				</div>
			);
		};

		if (stage == Stage.Soul) {
			return (
				<div className="inputWrapper animation">
					<Input
						focusOnMount
						type="text"
						placeholder={translate('pageAuthOnboardEnterYourName')}
						value={authStore.name}
						onKeyUp={(e, v) => authStore.nameSet(v)}
						maxLength={255}
					/>
				</div>
			);
		};

		if ([ Stage.SoulCreating, Stage.SpaceCreating ].includes(stage)) {
			const cn = [ 'soulContent' ];

			if (stage == Stage.SoulCreating) {
				cn.push('soulCreating');
			};

			if (stage == Stage.SpaceCreating) {
				cn.push('spaceCreating');
			};

			return (
				// Hack, because React's diffing algorithm doesnt change the DOM node when only the className changes,
				// so we have to set a different element type to force the DOM to change,
				// otherwise the animation library css styles remain (I tried setting style={{}}, doesnt work)
				// https://legacy.reactjs.org/docs/reconciliation.html
				<section className={cn.join(' ')}>
					<div className="account">
						<IconObject object={{ iconOption, layout: I.ObjectLayout.Human }} size={64} />
						<span className="accountName">
							{authStore.name}
						</span>
					</div>

					<div className="line left" />
					<div className="line right" />

					<div className="space">
						<IconObject object={{ iconOption, layout: I.ObjectLayout.Space }} size={64} />
						<span className="spaceName">{translate('pageAuthOnboardPersonalSpace')}</span>
					</div>
				</section>
			);
		};

		return null;
	};

	renderButtons = (): JSX.Element => {
		const { stage, phraseCopied } = this.state;
		const cn = [ 'animation' ];

		if ([ Stage.SoulCreating, Stage.SpaceCreating ].includes(stage)) {
			return null;
		};

		let text = this.getText('Submit');
		let moreInfo = null;

		if (stage == Stage.Void) {
			text = translate('authOnboardSubmit');
		};

		if ((stage == Stage.Phrase) && phraseCopied) {
			text = translate('authOnboardGoAhead');
		};

		if (stage == Stage.Phrase) {
			moreInfo = <div className="animation small" onClick={this.onPhraseInfo}>{translate('pageAuthOnboardMoreInfo')}</div>;
		};

		if (!this.canMoveForward()) {
			cn.push('disabled');
		};

		return (
			<div className="buttons">
				<Button ref={ref => this.refNext = ref} className={cn.join(' ')} text={text} onClick={this.onNext} />
				{moreInfo}
			</div>
		);
	};

	componentDidMount (): void {
		const { stage } = this.state;

		Animation.to();
		this.rebind();

		analytics.event('ScreenOnboarding', { step: stage });
	};

	componentDidUpdate (_, prevState): void {
		const { stage } = this.state;

		if (prevState.stage != stage) {
			Animation.to();
			analytics.event('ScreenOnboarding', { step: stage });
		};

		this.refFrame?.resize();
		this.rebind();
	};

	componentWillUnmount (): void {
		this.unbind();
	};

	unbind () {
		$(window).off('keydown.onboarding');
	};

	rebind () {
		const node = $(this.node);
		const question = node.find('.questionMark');

		this.unbind();

		$(window).on('keydown.onboarding', (e) => this.onKeyDown(e));

		question.off('mouseenter mouseleave');
		question.on('mouseenter', () => this.onPhraseTooltip());
		question.on('mouseleave', () => Preview.tooltipHide());
	};

	getText = (name: string) => {
		const { stage } = this.state;

		return translate(`authOnboard${Stage[stage]}${name}`);
	};

	onKeyDown = (e) => {
		keyboard.shortcut('enter', e, this.onNext);
	};

	/** Guard to prevent illegal state change */
	canMoveForward = (): boolean => {
		const { stage } = this.state;

		if (this.isDelayed) {
			return false;
		};

		let ret = false;
		if ([ Stage.Void, Stage.Phrase, Stage.Offline ].includes(stage)) {
			ret = true;
		};
		if ((stage == Stage.Soul) && authStore.name) {
			ret = true;
		};
		return ret;
	};

	/** Guard to prevent illegal state change */
	canMoveBackward = (): boolean => {
		return this.state.stage <= Stage.Soul;
	};

	/** Moves the Onboarding Flow one stage forward if possible */
	onNext = () => {
		if (!this.canMoveForward()) {
			return;
		};

		const { stage, phraseCopied } = this.state;

		if (stage == Stage.Phrase && !phraseCopied) {
			this.refPhrase.onToggle();
			this.setState({ phraseCopied: true });
			this.onCopy();

			analytics.event('ClickOnboarding', { type: 'ShowAndCopy', step: stage });
			return;
		};

		const delay = (cb, duration: number) => () => {
			this.isDelayed = true;
			window.setTimeout(() => {
				this.isDelayed = false;
				cb();
			}, duration);
		};
		const incrementAnimation = (cb?) => () => this.setState((prev) => ({ ...prev, animationStage: prev.animationStage + 1 }), cb);
		const incrementOnboarding = (cb?) => () => this.setState((prev) => ({ ...prev, stage: prev.stage + 1 }), cb);

		const run = () => {
			Animation.from(() => {
				// Move animation forward, wait for delay, move onboarding forward
				if (stage == Stage.Void) {
					incrementAnimation(delay(incrementOnboarding(), 100))();
					return;
				};

				// Move animation forward, wait for delay, move onboarding forward
				if (stage == Stage.Phrase) {
					incrementAnimation(delay(incrementOnboarding(), 1000))();
					return;
				};

				// Move animation forward, wait for delay, move animation forward again, then move onboarding forward
				if (stage == Stage.Offline) {
					const second = delay(incrementOnboarding(), 500);
					const first = delay(incrementAnimation(second), 2400);

					incrementAnimation(first)();
					return;
				};

				// Wait for delay, move onboarding forward, wait for delay, move onboarding forward again
				if (stage == Stage.Soul) {
					const second = delay(incrementOnboarding(this.accountUpdate), 3000);
					const first = delay(incrementOnboarding(second), 1000);

					first();
					return;
				};
			});
		};

		if (stage == Stage.Void) {
			this.refNext.setLoading(true);
			this.accountCreate(() => {
				this.refNext.setLoading(false);
				run();
			});
		} else {
			run();
		};
	};

	/** Moves the Onboarding Flow one stage backward, or exits it entirely */
	onBack = () => {
		if (!this.canMoveBackward()) {
			return;
		};

		const { stage, animationStage } = this.state;

		if (stage == Stage.Void) {
			UtilCommon.route('/', { replace: true });
			return;
		};

		let nextStage = stage - 1;
		let nextAnimation = animationStage - 1;

		if (animationStage == Stage.SoulCreating) {
			nextAnimation = Stage.Offline;
		};

		if (animationStage == Stage.Offline) {
			nextAnimation = Stage.Void;
		};

		this.setState((prev) => ({
			...prev,
			animationStage: nextAnimation,
			stage: nextStage,
		}));
	};

	accountCreate = (callBack?: () => void): void => {
		if (this.account) {
			callBack();
			return;
		};

		C.WalletCreate(authStore.walletPath, (message) => {
			if (message.error.code) {
				this.showErrorAndExit(message);
				return;
			};

			authStore.phraseSet(message.mnemonic);

			UtilData.createSession((message) => {
				if (message.error.code) {
					this.showErrorAndExit(message);
					return;
				};

				const { iconOption } = this.state;
				const { accountPath, phrase } = authStore;

				C.AccountCreate('', '', accountPath, iconOption, (message) => {
					if (message.error.code) {
						this.showErrorAndExit(message);
						return;
					};

					this.account = message.account;

					commonStore.infoSet(message.account.info);
					commonStore.configSet(message.account.config, false);

					Renderer.send('keytarSet', message.account.id, phrase);
					Storage.set('timeRegister', UtilCommon.time());
					analytics.event('CreateAccount', { middleTime: message.middleTime });

					if (callBack) {
						callBack();
					};
				});
			});
		});
	};

	accountUpdate = () => {
		const { profile } = blockStore;
		const { workspace } = commonStore;
		const { name } = authStore;

		authStore.accountSet(this.account);

		UtilObject.setName(profile, name, () => {
			UtilObject.setName(workspace, name);

			window.setTimeout(() => {
				commonStore.redirectSet('/main/usecase');
				UtilData.onAuth(this.account, { routeParam: { replace: true, animate: true } });
			}, 2000);
		});
	};

	/** Shows an error message and reroutes to the index page after a delay */
	showErrorAndExit = (message) => {
		this.setState({ error: message.error.description }, () => window.setTimeout(() => UtilCommon.route('/', { replace: true }), 3000));
	};

	/** Copies key phrase to clipboard and shows a toast */
	onCopy = () => {
		UtilCommon.copyToast(translate('commonPhrase'), authStore.phrase);
		analytics.event('KeychainCopy', { type: 'Onboarding' });
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
			typeX: I.MenuDirection.Center,
		});
	};

	/** Shows a simple popup that educates the user about their account keyphrase */
	onPhraseInfo = () => {
		const { stage } = this.state;

		popupStore.open('confirm', {
			data: {
				text: translate('authOnboardPhraseMoreInfoPopupContent'),
				textConfirm: translate('commonOkay'),
				canConfirm: true,
				canCancel: false,
				onConfirm: () => {
					popupStore.close('confirm');
				},
			},
		});

		analytics.event('ClickOnboarding', { type: 'MoreInfo', step: stage });
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