import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, DotIndicator, Phrase, Icon, Input, Error } from 'Component';
import { I, C, S, U, J, translate, Animation, analytics, keyboard, Renderer, Onboarding, Storage } from 'Lib';
import CanvasWorkerBridge from './animation/canvasWorkerBridge';

enum Stage {
	Phrase	 = 0,
	Soul	 = 1,
};

const PageAuthOnboard = observer(forwardRef<{}, I.PageComponent>(() => {

	const { account } = S.Auth;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);
	const phraseRef = useRef(null);
	const nextRef = useRef(null);
	const nameRef = useRef(null);
	const [ stage, setStage ] = useState(Stage.Phrase);
	const [ phraseVisible, setPhraseVisible ] = useState(false);
	const [ error, setError ] = useState('');
	const cnb = [];

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
		return stage <= Stage.Soul;
	};

	// Moves the Onboarding Flow one stage forward if possible
	const onForward = () => {
		if (!canMoveForward()) {
			return;
		};

		if (stage == Stage.Phrase) {
			Animation.from(() => setStage(stage + 1));
		};

		if (stage == Stage.Phrase) {
			Animation.from(() => setStage(stage + 1));
		};

		if (stage == Stage.Soul) {
			const name = nameRef.current?.getValue();
			const cb = () => {
				Animation.from(() => {
					nextRef.current?.setLoading(false);

					const routeParam = {
						replace: true, 
						onRouteChange: () => {
							S.Common.showRelativeDatesSet(true);

							U.Space.initSpaceState();

							if (S.Auth.startingId) {
								U.Object.getById(S.Auth.startingId, {}, object => {
									if (object) {
										U.Object.openRoute(object, { replace: true });
									} else {
										U.Space.openDashboard({ replace: true });
									};
								});
							} else {
								U.Space.openDashboard({ replace: true });
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

	const onCopy = () => {
		U.Common.copyToast(translate('commonPhrase'), phraseRef.current?.getValue());
		analytics.event('KeychainCopy', { type: 'Onboarding' });
	};

	const onPhraseTooltip = () => {
		S.Popup.open('phrase', {});
		analytics.event('ClickOnboarding', { type: 'MoreInfo', step: Stage[stage] });
	};

	const setErrorHandler = (error: string) => {
		nextRef.current?.setLoading(false);
		setError(error);
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
							<Button color="blank" text={translate('authOnboardPhraseNotNow')} onClick={onForward} />
						</div>
					) : ''}
				</>
			);
			break;
		};

		case Stage.Soul: {
			content = (
				<div className="inputWrapper animation">
					<Input
						ref={nameRef}
						focusOnMount={true}
						placeholder={translate('commonYourName')}
						maxLength={255}
					/>
				</div>
			);

			buttons = (
				<div className="animation">
					<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonDone')} onClick={onForward} />
				</div>
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
	}, [ stage ]);

	useEffect(() => {
		analytics.event('ScreenOnboarding', { step: Stage[stage] });
	});

	return (
		<div 
			ref={nodeRef} 
			className={`stage${Stage[stage]}`}
		>
			{canMoveBack() ? <Icon className="arrow back" onClick={onBack} /> : ''}

			<Frame ref={frameRef}>
				<DotIndicator className="animation" index={stage} count={2} />
				<Title className="animation" text={translate(`authOnboard${Stage[stage]}Title`)} />
				<Label id="label" className="animation" text={translate(`authOnboard${Stage[stage]}Label`)} />

				{content}

				<Error className="animation" text={error} />
				<div className="buttons">{buttons}</div>
			</Frame>

			<CanvasWorkerBridge state={0} />
		</div>
	);

}));

export default PageAuthOnboard;
