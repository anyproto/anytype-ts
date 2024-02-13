import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, DotIndicator, Phrase, Icon, Input, Error } from 'Component';
import { I, translate, Animation, C, UtilCommon, analytics, keyboard, UtilRouter, UtilData, Renderer, UtilObject, Action, Storage } from 'Lib';
import { authStore, commonStore, popupStore, menuStore, blockStore } from 'Store';
import CanvasWorkerBridge from './animation/canvasWorkerBridge';
import { OnboardStage as Stage } from './animation/constants';
import Constant from 'json/constant.json';

type State = {
	stage: Stage;
	phraseVisible: boolean;
	error: string;
};

const PageAuthOnboard = observer(class PageAuthOnboard extends React.Component<I.PageComponent, State> {

	node: HTMLDivElement = null;
	refFrame: Frame = null;
	refPhrase: Phrase = null;
	refNext: Button = null;
	isDelayed = false;
	isCreating = false;

	state: State = {
		stage: Stage.Void,
		phraseVisible: false,
		error: '',
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onNext = this.onNext.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onAccountPath = this.onAccountPath.bind(this);
		this.onShowPhrase = this.onShowPhrase.bind(this);
	};

	render () {
		const { stage, phraseVisible, error } = this.state;
		const { config } = commonStore;
		const cnb = [];

		if (!this.canMoveForward()) {
			cnb.push('disabled');
		};

		let content = null;
		let footer = null;
		let buttons = null;
		let more = null;

		switch (stage) {
			case Stage.Void: {
				content = (
					<div className="inputWrapper animation">
						<Input
							focusOnMount
							type="text"
							placeholder={translate('defaultNamePage')}
							value={authStore.name}
							onKeyUp={(e, v) => authStore.nameSet(v)}
							maxLength={255}
						/>
					</div>
				);

				buttons = (
					<div className="animation">
						<Button ref={ref => this.refNext = ref} className={cnb.join(' ')} text={translate('commonNext')} onClick={this.onNext} />
					</div>
				);
				break;
			};

			case Stage.Phrase: {
				const text = phraseVisible ? translate('authOnboardGoApp') : translate('authOnboardPhraseSubmit');

				content = (
					<div className="animation" onClick={this.onCopy}>
						<Phrase
							ref={ref => this.refPhrase = ref}
							value={authStore.phrase}
							readonly={true}
							isHidden={!phraseVisible}
							onCopy={this.onCopy}
						/>
					</div>
				);

				buttons = (
					<React.Fragment>
						<div className="animation">
							<Button ref={ref => this.refNext = ref} className={cnb.join(' ')} text={text} onClick={this.onShowPhrase} />
						</div>
						{!phraseVisible ? (
							<div className="animation">
								<Button color="blank" text={translate('commonSkip')} onClick={this.onNext} />
							</div>
						) : ''}
					</React.Fragment>
				);

				if (!phraseVisible) {
					more = <div className="moreInfo animation">{translate('authOnboardMoreInfo')}</div>;
				};

				if (config.experimental) {
					footer = (
						<div id="accountPath" className="animation small bottom" onClick={this.onAccountPath}>
							<Icon className="gear" />
							{translate('pageAuthOnboardAccountDataLocation')}
						</div>
					);
				};
				break;
			};
		};

		return (
			<div ref={(ref) => (this.node = ref)}>
				{this.canMoveBack() ? <Icon className="arrow back" onClick={this.onBack} /> : ''}

				<Frame ref={(ref) => (this.refFrame = ref)}>
					<DotIndicator className="animation" index={stage} count={2} />
					<Title className="animation" text={translate(`authOnboard${Stage[stage]}Title`)} />
					<Label id="label" className="animation" text={translate(`authOnboard${Stage[stage]}Label`)} />

					{content}

					<Error className="animation" text={error} />

					<div className="buttons">{buttons}</div>

					{more}
				</Frame>

				{footer}

				<CanvasWorkerBridge state={Stage.Void} />
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
		const tooltipPhrase = node.find('#tooltipPhrase');

		this.unbind();
		$(window).on('keydown.onboarding', e => this.onKeyDown(e));

		tooltipPhrase.off('click').on('click', () => this.onPhraseTooltip());
	};

	onKeyDown (e) {
		keyboard.shortcut('enter', e, this.onNext);
	};

	/** Guard to prevent illegal state change */
	canMoveForward (): boolean {
		const { stage } = this.state;

		if (this.isDelayed) {
			return false;
		};

		let ret = false;
		if ([ Stage.Void, Stage.Phrase ].includes(stage)) {
			ret = true;
		};
		return ret;
	};

	/** Guard to prevent illegal state change */
	canMoveBack (): boolean {
		return this.state.stage <= Stage.Phrase;
	};

	/** Moves the Onboarding Flow one stage forward if possible */
	onNext () {
		if (!this.canMoveForward()) {
			return;
		};

		const { stage } = this.state;
		const { account, name } = authStore;
		const next = () => {
			Animation.from(() => {
				this.refNext.setLoading(false);
				this.setState({ stage: stage + 1 });
			});
		};

		if (stage == Stage.Void) {
			this.refNext.setLoading(true);

			if (account) {
				this.accountUpdate(() => next());
			} else {
				this.accountCreate(() => next());
			};
		} else {
			Animation.from(() => UtilData.onAuth({ routeParam: { replace: true, animate: true } }, () => {
				Storage.initPinnedTypes();
			}));

			if (!name) {
				analytics.event('ScreenOnboardingSkipName');
			};
		};
	};

	onShowPhrase () {
		const { stage, phraseVisible } = this.state;

		if (phraseVisible) {
			this.onNext();
		} else {
			this.refPhrase.onToggle();
			this.setState({ phraseVisible: true });

			analytics.event('ClickOnboarding', { type: 'ShowAndCopy', step: stage });
		};
	};

	/** Moves the Onboarding Flow one stage backward, or exits it entirely */
	onBack () {
		if (!this.canMoveBack()) {
			return;
		};

		const { stage } = this.state;

		if (stage == Stage.Void) {
			Animation.from(() => UtilRouter.go('/', { replace: true }));
		} else {
			this.setState({ stage: stage - 1 });
		};
	};

	accountCreate (callBack?: () => void) {
		this.refNext.setLoading(true);

		const { name, walletPath, networkConfig } = authStore;
		const { mode, path } = networkConfig;

		C.WalletCreate(walletPath, (message) => {
			if (message.error.code) {
				this.setError(message.error.description);
				return;
			};

			authStore.phraseSet(message.mnemonic);

			UtilData.createSession((message) => {
				if (message.error.code) {
					this.setError(message.error.description);
					return;
				};

				const { accountPath, phrase } = authStore;

				C.AccountCreate(name, '', accountPath, UtilCommon.rand(1, Constant.iconCnt), mode, path, (message) => {
					if (message.error.code) {
						this.setError(message.error.description);
						return;
					};

					authStore.accountSet(message.account);
					commonStore.configSet(message.account.config, false);
					commonStore.isSidebarFixedSet(true);

					UtilData.onInfo(message.account.info);
					Renderer.send('keytarSet', message.account.id, phrase);

					analytics.event('CreateAccount', { middleTime: message.middleTime });
					analytics.event('CreateSpace', { middleTime: message.middleTime, usecase: I.Usecase.GetStarted });

					C.WorkspaceSetInfo(commonStore.space, { name }, () => {
						Action.importUsecase(commonStore.space, I.Usecase.GetStarted, callBack);
					});
				});
			});
		});
	};

	accountUpdate = (callBack?: () => void): void => {
		const { name } = authStore;

		UtilObject.setName(blockStore.profile, name, () => {
			C.WorkspaceSetInfo(commonStore.space, { name }, callBack);
		});
	};

	/** Copies key phrase to clipboard and shows a toast */
	onCopy () {
		UtilCommon.copyToast(translate('commonPhrase'), authStore.phrase);
		analytics.event('KeychainCopy', { type: 'Onboarding' });
	};

	/** Shows a tooltip that tells the user how to keep their Key Phrase secure */
	onPhraseTooltip () {
		popupStore.open('phrase', {});
	};

	/** Shows a tooltip that specififies where the Users account data is stored on their machine */
	onAccountPath () {
		menuStore.open('accountPath', {
			element: '#accountPath',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Center,
			offsetY: -20,
		});
	};

	setError (error: string) {
		this.refNext?.setLoading(false);
		this.setState({ error });
	};

});

export default PageAuthOnboard;