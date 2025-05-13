import React, { forwardRef, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, Phrase, Icon, Input, Error } from 'Component';
import { I, C, S, U, J, translate, Animation, analytics, keyboard, Renderer, Onboarding, Storage } from 'Lib';

enum Stage {
	Phrase	 = 0,
	Name	 = 1,
	Email	 = 2,
};

const PageAuthOnboard = observer(forwardRef<{}, I.PageComponent>(() => {

	const { account } = S.Auth;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);
	const phraseRef = useRef(null);
	const nextRef = useRef(null);
	const nameRef = useRef(null);
	const emailRef = useRef(null);
	const [ stage, setStage ] = useState(Stage.Phrase);
	const [ phraseVisible, setPhraseVisible ] = useState(false);
	const [ error, setError ] = useState('');
	const cnb = [ 'c48' ];

	const unbind = () => {
		$(window).off('keydown.onboarding');
	};

	const rebind = () => {
		const node = $(nodeRef.current);
		const tooltipPhrase = node.find('#tooltipPhrase');

		unbind();
		$(window).on('keydown.onboarding', e => onKeyDown(e));
		tooltipPhrase.off('click').on('click', () => onPhraseTooltip());
	};

	const onKeyDown = e => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			onForward();
		});
	};

	// Guard to prevent illegal state change
	const canMoveForward = (): boolean => {
		return !!Stage[stage] && !nextRef.current?.isLoading();
	};

	// Guard to prevent illegal state change
	const canMoveBack = (): boolean => {
		return stage <= Stage.Email;
	};

	const onAuth = () => {
		const routeParam = {
			replace: true,
			onRouteChange: () => {
				S.Common.showRelativeDatesSet(true);
				S.Common.getRef('mainAnimation')?.destroy();
				U.Space.initSpaceState();

				const newRouteParam = { replace: true };

				if (S.Auth.startingId) {
					U.Object.getById(S.Auth.startingId, {}, object => {
						if (object) {
							U.Object.openRoute(object, newRouteParam);
						} else {
							U.Space.openDashboard(newRouteParam);
						};
					});
				} else {
					U.Space.openDashboard(newRouteParam);
				};

				Storage.set('primitivesOnboarding', true);
				Storage.setOnboarding('objectDescriptionButton');
				Storage.setOnboarding('typeResetLayout');

				Onboarding.start('basics', false);
			},
		};

		U.Data.onInfo(account.info);
		U.Data.onAuthWithoutSpace(routeParam);
		U.Data.onAuthOnce(true);
	};

	// Moves the Onboarding Flow one stage forward if possible
	const onForward = () => {
		if (!canMoveForward()) {
			return;
		};

		const needEmail = U.Data.isAnytypeNetwork() && S.Common.isOnline;

		switch (stage) {
			case Stage.Phrase: {
				Animation.from(() => setStage(stage + 1));
				break;
			};

			case Stage.Name: {
				const name = nameRef.current?.getValue();
				const cb = () => {
					Animation.from(() => {
						nextRef.current?.setLoading(false);

						if (needEmail) {
							setStage(stage + 1);
						} else {
							onAuth();
						};
					});
				};

				const details = { 
					name: translate('commonEntrySpace'), 
					iconOption: U.Common.rand(1, J.Constant.count.icon),
				};

				C.WorkspaceSetInfo(S.Common.space, details, () => {
					if (name) {
						nextRef.current?.setLoading(true);
						U.Object.setName(S.Block.profile, name, cb);
					} else {
						cb();
						analytics.event('ScreenOnboardingSkipName');
					};	
				});
				break;
			};

			case Stage.Email: {
				const email = emailRef.current?.getValue();

				if (email) {
					nextRef.current?.setLoading(true);
					
					C.MembershipGetVerificationEmail(email, false, false, true, (message: any) => {
						nextRef.current?.setLoading(false);

						if (message.error.code) {
							setError(message.error.description);
							return;
						};

						analytics.event('ScreenOnboardingEnterEmail', { middleTime: message.middleTime });
					});

					onAuth();
				} else {
					onAuth();
					analytics.event('ScreenOnboardingSkipEmail');
				};
				break;
			};
		};
	};

	// Moves the Onboarding Flow one stage backward, or exits it entirely
	const onBack = () => {
		if (!canMoveBack()) {
			return;
		};

		if (stage == Stage.Phrase) {
			Animation.from(() => U.Router.go('/', { replace: true }));
		} else {
			setStage(stage - 1);
		};
	};

	const onShowPhrase = () => {
		if (phraseVisible) {
			onForward();
		} else {
			phraseRef.current?.onToggle();
			setPhraseVisible(true);

			analytics.event('ClickOnboarding', { type: 'ShowAndCopy', step: Stage[stage] });
		};
	};

	const onEmailKeyUp = (e: KeyboardEvent, v: string) => {
		const isValid = U.Common.checkEmail(v);

		$(nextRef.current?.getNode()).toggleClass('disabled', !isValid);
	};

	const onCopy = () => {
		U.Common.copyToast(translate('commonPhrase'), phraseRef.current?.getValue());
		analytics.event('KeychainCopy', { type: 'Onboarding' });
	};

	const onPhraseTooltip = () => {
		S.Popup.open('phrase', {});
		analytics.event('ClickOnboarding', { type: 'MoreInfo', step: Stage[stage] });
	};

	if (!canMoveForward()) {
		cnb.push('disabled');
	};

	let content = null;
	let buttons = null;

	switch (stage) {
		case Stage.Phrase: {
			const text = phraseVisible ? translate('commonNext') : translate('authOnboardPhraseSubmit');

			content = (
				<Phrase
					ref={phraseRef}
					className="animation"
					readonly={true}
					isHidden={!phraseVisible}
					onCopy={onCopy}
					onClick={onCopy}
				/>
			);

			buttons = (
				<>
					<div className="animation">
						<Button ref={nextRef} className={cnb.join(' ')} text={text} onClick={onShowPhrase} />
					</div>

					{!phraseVisible ? (
						<div className="animation">
							<Button color="blank" className="c48" text={translate('commonSkip')} onClick={onForward} />
						</div>
					) : ''}
				</>
			);
			break;
		};

		case Stage.Name: {
			content = (
				<div className="inputWrapper animation">
					<Input
						key="name"
						ref={nameRef}
						focusOnMount={true}
						placeholder={translate('authOnboardNamePlaceholder')}
						maxLength={255}
					/>
				</div>
			);

			buttons = (
				<div className="animation">
					<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonContinue')} onClick={onForward} />
				</div>
			);
			break;
		};

		case Stage.Email: {
			cnb.push('disabled');

			content = (
				<div className="inputWrapper animation">
					<Input
						key="email"
						ref={emailRef}
						focusOnMount={true}
						placeholder={translate('authOnboardEmailPlaceholder')}
						maxLength={255}
						onKeyUp={onEmailKeyUp}
					/>
				</div>
			);

			buttons = (
				<>
					<div className="animation">
						<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonContinue')} onClick={onForward} />
					</div>
					<div className="animation">
						<Button color="blank" className="c48" text={translate('commonSkip')} onClick={onForward} />
					</div>
				</>
			);
			break;
		};
	};

	const init = () => {
		Animation.to();
		frameRef.current.resize();
		rebind();
	};

	useEffect(() => {
		init();
		return () => unbind();
	}, []);

	useEffect(() => {
		init();

		if (account && (stage == Stage.Phrase)) {
			Renderer.send('keytarGet', account.id).then(value => phraseRef.current?.setValue(value));
		};

		analytics.event('ScreenOnboarding', { step: Stage[stage] });
	}, [ stage ]);

	return (
		<div 
			ref={nodeRef} 
			className={`stage${Stage[stage]}`}
		>
			{canMoveBack() ? <Icon className="arrow back" onClick={onBack} /> : ''}

			<Frame ref={frameRef}>
				<Title className="animation" text={translate(`authOnboard${Stage[stage]}Title`)} />
				<Label id="label" className="animation" text={translate(`authOnboard${Stage[stage]}Label`)} />

				{content}
				<Error className="animation" text={error} />
				<div className="buttons">{buttons}</div>
			</Frame>
		</div>
	);

}));

export default PageAuthOnboard;