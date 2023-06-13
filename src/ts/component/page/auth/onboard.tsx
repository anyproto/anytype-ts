import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, DotIndicator, Phrase, Error, Icon, IconObject, Input } from 'Component';
import { I, translate, Animation, C, UtilData, Storage, UtilCommon, Renderer, analytics, Preview, keyboard, UtilObject } from 'Lib';
import { authStore, commonStore, popupStore, menuStore, blockStore } from 'Store';
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

	node: HTMLDivElement = null;
	refFrame: Frame = null;
	refPhrase: Phrase = null;
	account: I.Account = null;

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

		if (this.canMoveBackward()) {
			back = <Icon className="arrow back" onClick={this.onBack} />;
		};

		if (![Stage.SoulCreating, Stage.SpaceCreating].includes(stage)) {
			indicator = <DotIndicator className="animation" index={stage} count={4} />;
			label = <Label id="label" className="animation" text={this.getText('Label')} />;
		};

		if ( [Stage.Phrase, Stage.Offline].includes(stage) && config.experimental ) {
			footer = (
				<div id="accountPath" className="animation small bottom" onClick={this.onAccountPath}>
					<Icon className="gear" />
					Account data location
				</div>
			);
		};

		if (error) {
			return (
				<div>
					<Frame ref={ref => this.refFrame = ref}>
						<Error className="animation" text={error} />
					</Frame>
					<CanvasWorkerBridge state={animationStage} />
				</div>
			);
		};

		return (
			<div ref={(ref) => (this.node = ref)}>
				{back}

				<Frame ref={(ref) => (this.refFrame = ref)}>
					{indicator}
					<Title className="animation" text={this.getText('Title')} />
					{label}
					{this.renderContent()}
					{this.renderButtons()}
					{footer}
				</Frame>

				<CanvasWorkerBridge state={animationStage} />
				<div className="fadeInOverlay" />
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
						placeholder="Enter your name"
						value={authStore.name}
						onKeyUp={(e, v) => authStore.nameSet(v)}
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
						<span className="spaceName">Personal Space</span>
					</div>
				</section>
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

		if (stage == Stage.Void || (stage == Stage.Phrase && phraseCopied)) {
			text = translate('authOnboardSubmit');
		};

		if (stage == Stage.Phrase) {
			moreInfo = <div className="animation small" onClick={this.onPhraseInfo}>More info</div>;
		};

		return (
			<div className="buttons">
				<Button
					className={['animation', this.canMoveForward() ? '' : 'disabled'].join(' ')}
					text={text}
					onClick={this.onNext}
				/>
				{moreInfo}
			</div>
		);
	};

	componentDidMount (): void {
		Animation.to();
		this.rebind();
	};

	componentDidUpdate (_, prevState): void {
		const { stage } = this.state;

		if (prevState.stage != stage) {
			Animation.to();
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

		let ret = false;
		if ([Stage.Void, Stage.Phrase, Stage.Offline].includes(stage)) {
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
			this.refPhrase.toggleVisibility();
			this.setState({ phraseCopied: true });
			this.onCopy();
			return;
		};

		const delay = (cb, duration) => () => window.setTimeout(cb, duration);
		const incrementAnimation = (cb?) => () => this.setState((prev) => ({ ...prev, animationStage: prev.animationStage + 1 }), cb);
		const incrementOnboarding = (cb?) => () => this.setState((prev) => ({ ...prev, stage: prev.stage + 1 }), cb);

		Animation.from(() => {
			// Move animation forward, wait for delay, move onboarding forward
			if (stage == Stage.Void) {
				this.accountCreate(() => {
					incrementAnimation(delay(incrementOnboarding(), 2000))();
				});
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

	/** Moves the Onboarding Flow one stage backward, or exits it entirely */
	onBack = () => {
		if (!this.canMoveBackward()) {
			return;
		};

		const { stage } = this.state;

		if (stage == Stage.Void) {
			UtilCommon.route('/');
			return;
		};

		// jump back two stages for the animation
		if (stage == Stage.Soul) {
			this.setState((prev) => ({
				...prev,
				animationStage: prev.animationStage - 2,
				stage: prev.stage - 1,
			}));
			return;
		};

		// jump back one stage for both
		this.setState((prev) => ({
			...prev,
			animationStage: prev.animationStage - 1,
			stage: prev.stage - 1,
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
					analytics.event('CreateAccount');

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
				UtilData.onAuth(this.account, () => UtilCommon.route('/main/usecase'));
			}, 2000);
		});
	};

	/** Shows an error message and reroutes to the index page after a delay */
	showErrorAndExit = (message) => {
		const error = Errors.AccountCreate[message.error.code] || message.error.description;

		this.setState({ error }, () => window.setTimeout(() => UtilCommon.route('/'), 3000));
	};

	/** Copies key phrase to clipboard and shows a toast */
	onCopy = () => {
		UtilCommon.clipboardCopy({ text: authStore.phrase });
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
			typeX: I.MenuDirection.Center,
		});
	};

	/** Shows a simple popup that educates the user about their account keyphrase */
	onPhraseInfo = () => {
		popupStore.open('confirm', {
			data: {
				text: translate('authOnboardPhraseMoreInfoPopupContent'),
				textConfirm: 'Okay',
				canConfirm: true,
				canCancel: false,
				onConfirm: () => {
					popupStore.close('confirm');
				},
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