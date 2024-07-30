import * as React from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, DotIndicator, Phrase, Icon, Input, Error } from 'Component';
import { I, C, S, U, translate, Animation, analytics, keyboard, Renderer, Storage, Action } from 'Lib';
import CanvasWorkerBridge from './animation/canvasWorkerBridge';

enum Stage {
	Vault	 = 0,
	Phrase	 = 1,
	Soul	 = 2,
};

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
	refName: Input = null;

	state: State = {
		stage: Stage.Vault,
		phraseVisible: false,
		error: '',
	};

	isDelayed = false;
	isCreating = false;

	constructor (props: I.PageComponent) {
		super(props);

		this.onForward = this.onForward.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onShowPhrase = this.onShowPhrase.bind(this);
		this.setError = this.setError.bind(this);
	};

	render () {
		const { stage, phraseVisible, error } = this.state;
		const cnb = [];

		if (!this.canMoveForward()) {
			cnb.push('disabled');
		};

		let content = null;
		let buttons = null;
		let more = null;

		switch (stage) {
			case Stage.Vault: {
				buttons = (
					<div className="animation">
						<Button ref={ref => this.refNext = ref} className={cnb.join(' ')} text={translate('authOnboardVaultButton')} onClick={this.onForward} />
					</div>
				);
				break;
			};

			case Stage.Phrase: {
				const text = phraseVisible ? translate('commonNext') : translate('authOnboardPhraseSubmit');

				content = (
					<Phrase
						ref={ref => this.refPhrase = ref}
						className="animation"
						readonly={true}
						isHidden={!phraseVisible}
						onCopy={this.onCopy}
						onClick={this.onCopy}
					/>
				);

				buttons = (
					<React.Fragment>
						<div className="animation">
							<Button ref={ref => this.refNext = ref} className={cnb.join(' ')} text={text} onClick={this.onShowPhrase} />
						</div>

						{!phraseVisible ? (
							<div className="animation">
								<Button color="blank" text={translate('commonSkip')} onClick={this.onForward} />
							</div>
						) : ''}
					</React.Fragment>
				);

				if (!phraseVisible) {
					more = <div className="moreInfo animation">{translate('authOnboardMoreInfo')}</div>;
				};
				break;
			};

			case Stage.Soul: {
				content = (
					<div className="inputWrapper animation">
						<Input
							ref={ref => this.refName = ref}
							focusOnMount={true}
							placeholder={translate('defaultNamePage')}
							maxLength={255}
						/>
					</div>
				);

				buttons = (
					<div className="animation">
						<Button ref={ref => this.refNext = ref} className={cnb.join(' ')} text={translate('authOnboardSoulButton')} onClick={this.onForward} />
					</div>
				);
				break;
			};
		};

		return (
			<div 
				ref={(ref) => (this.node = ref)} 
				className={`stage${Stage[stage]}`}
			>
				{this.canMoveBack() ? <Icon className="arrow back" onClick={this.onBack} /> : ''}

				<Frame ref={(ref) => (this.refFrame = ref)}>
					<DotIndicator className="animation" index={stage} count={3} />
					<Title className="animation" text={translate(`authOnboard${Stage[stage]}Title`)} />
					<Label id="label" className="animation" text={translate(`authOnboard${Stage[stage]}Label`)} />

					{content}

					<Error className="animation" text={error} />
					<div className="buttons">{buttons}</div>
					{more}
				</Frame>

				<CanvasWorkerBridge state={0} />
			</div>
		);
	};

	componentDidMount (): void {
		const { stage } = this.state;

		Animation.to();
		this.rebind();

		analytics.event('ScreenOnboarding', { step: Stage[stage] });
	};

	componentDidUpdate (_, prevState): void {
		const { stage } = this.state;
		const { account } = S.Auth;

		if (prevState.stage != stage) {
			Animation.to();
			analytics.event('ScreenOnboarding', { step: Stage[stage] });
		};

		if (account && (stage == Stage.Phrase)) {
			Renderer.send('keytarGet', account.id).then(value => this.refPhrase.setValue(value));
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
		keyboard.shortcut('enter', e, this.onForward);
	};

	/** Guard to prevent illegal state change */
	canMoveForward (): boolean {
		return !this.isDelayed && !!Stage[this.state.stage];
	};

	/** Guard to prevent illegal state change */
	canMoveBack (): boolean {
		return this.state.stage <= Stage.Soul;
	};

	/** Moves the Onboarding Flow one stage forward if possible */
	onForward () {
		if (!this.canMoveForward()) {
			return;
		};

		const { stage } = this.state;
		const { account } = S.Auth;

		if (stage == Stage.Vault) {
			const cb = () => {
				Animation.from(() => {
					this.setState({ stage: stage + 1 });
					this.refNext?.setLoading(false);
				});
			};

			if (account) {
				cb();
			} else {
				this.refNext?.setLoading(true);
				U.Data.accountCreate(this.setError, cb);
			};
		};

		if (!account) {
			return;
		};

		if (stage == Stage.Phrase) {
			Animation.from(() => { 
				this.setState({ stage: stage + 1 });
			});
		};

		if (stage == Stage.Soul) {
			const name = this.refName.getValue();

			const cb = () => {
				Animation.from(() => {
					this.refNext?.setLoading(false);

					const routeParam = {
						replace: true, 
						animate: true,
						onFadeIn: () => {
							Storage.initPinnedTypes();
							S.Common.fullscreenObjectSet(true);
						},
					};

					U.Data.onAuth({ routeParam });
					U.Data.onAuthOnce(true);
				});
			};

			if (name) {
				this.refNext?.setLoading(true);
				this.accountUpdate(name, cb);
			} else {
				cb();
				analytics.event('ScreenOnboardingSkipName');
			};	
		};
	};

	/** Moves the Onboarding Flow one stage backward, or exits it entirely */
	onBack () {
		if (!this.canMoveBack()) {
			return;
		};

		const { stage } = this.state;

		if (stage == Stage.Vault) {
			Animation.from(() => U.Router.go('/', { replace: true }));
		} else {
			this.setState({ stage: stage - 1 });
		};
	};

	onShowPhrase () {
		const { stage, phraseVisible } = this.state;

		if (phraseVisible) {
			this.onForward();
		} else {
			this.refPhrase.onToggle();
			this.setState({ phraseVisible: true });

			analytics.event('ClickOnboarding', { type: 'ShowAndCopy', step: Stage[stage] });
		};
	};

	accountUpdate = (name: string, callBack?: () => void): void => {
		U.Object.setName(S.Block.profile, name, () => {
			C.WorkspaceSetInfo(S.Common.space, { name }, callBack);
		});
	};

	/** Copies key phrase to clipboard and shows a toast */
	onCopy () {
		U.Common.copyToast(translate('commonPhrase'), this.refPhrase.getValue());
		analytics.event('KeychainCopy', { type: 'Onboarding' });
	};

	/** Shows a tooltip that tells the user how to keep their Key Phrase secure */
	onPhraseTooltip () {
		S.Popup.open('phrase', {});
		analytics.event('ClickOnboarding', { type: 'MoreInfo', step: Stage[this.state.stage] });
	};

	setError (error: string) {
		this.refNext?.setLoading(false);
		this.setState({ error });
	};

});

export default PageAuthOnboard;
