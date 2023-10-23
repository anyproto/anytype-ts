import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, DotIndicator, Phrase, Icon, Input } from 'Component';
import { I, translate, Animation, C, UtilCommon, analytics, Preview, keyboard, UtilObject, UtilRouter } from 'Lib';
import { authStore, commonStore, popupStore, menuStore, blockStore } from 'Store';
import CanvasWorkerBridge from './animation/canvasWorkerBridge';
import { OnboardStage as Stage } from './animation/constants';

type State = {
	stage: Stage;
	phraseCopied: boolean;
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
		phraseCopied: false,
	};

	render () {
		const { stage, phraseCopied } = this.state;
		const { config } = commonStore;
		const cnb = [ 'animation' ];

		if (!this.canMoveForward()) {
			cnb.push('disabled');
		};

		let text = this.getText('Submit');
		let content = null;
		let footer = null;

		switch (stage) {
			case Stage.Void: {
				text = translate('commonNext');

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
				break;
			};

			case Stage.Phrase: {
				if (phraseCopied) {
					text = translate('authOnboardGoApp');
				};

				content = (
					<div className="animation" onClick={this.onCopy}>
						<Phrase
							ref={(ref) => (this.refPhrase = ref)}
							value={authStore.phrase}
							readonly={true}
							isHidden={!phraseCopied}
						/>
					</div>
				);

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
					<Title className="animation" text={this.getText('Title')} />
					<Label id="label" className="animation" text={this.getText('Label')} />

					{content}

					<div className="buttons">
						<Button ref={ref => this.refNext = ref} className={cnb.join(' ')} text={text} onClick={this.onNext} />
					</div>
				</Frame>

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
		$(window).on('keydown.onboarding', (e) => this.onKeyDown(e));

		tooltipPhrase.off('mouseenter mouseleave');
		tooltipPhrase.on('mouseenter', () => this.onPhraseTooltip());
		tooltipPhrase.on('mouseleave', () => Preview.tooltipHide());
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
		if ([ Stage.Void, Stage.Phrase ].includes(stage)) {
			ret = true;
		};
		return ret;
	};

	/** Guard to prevent illegal state change */
	canMoveBack = (): boolean => {
		return this.state.stage <= Stage.Phrase;
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

		if (stage == Stage.Void) {
			this.refNext.setLoading(true);
		};

		const incrementOnboarding = (cb?) => {
			this.setState({ stage: stage + 1 }, cb);
		};

		Animation.from(() => {
			this.refNext.setLoading(false);

			if (stage == Stage.Void) {
				this.accountUpdate(() => incrementOnboarding());
				return;
			};

			if (stage == Stage.Phrase) {
				UtilObject.openHome('route', { replace: true, animate: true });
				return;
			};
		});
	};

	/** Moves the Onboarding Flow one stage backward, or exits it entirely */
	onBack = () => {
		if (!this.canMoveBack()) {
			return;
		};

		const { stage } = this.state;

		if (stage == Stage.Void) {
			Animation.from(() => UtilRouter.go('/', { replace: true }));
			return;
		};

		this.setState({ stage: stage - 1 });
	};

	accountUpdate = (callBack: () => void) => {
		const { name } = authStore;

		UtilObject.setName(blockStore.profile, name, () => {
			C.WorkspaceSetInfo(commonStore.space, { name }, callBack);
		});
	};

	/** Copies key phrase to clipboard and shows a toast */
	onCopy = () => {
		UtilCommon.copyToast(translate('commonPhrase'), authStore.phrase);
		analytics.event('KeychainCopy', { type: 'Onboarding' });
	};

	/** Shows a tooltip that tells the user how to keep their Key Phrase secure */
	onPhraseTooltip = () => {
		const node = $(this.node);
		const element = node.find('#tooltipPhrase');

		Preview.tooltipShow({
			delay: 150,
			text: translate('authOnboardPhraseTooltip'),
			element,
			typeY: I.MenuDirection.Bottom,
			typeX: I.MenuDirection.Center,
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