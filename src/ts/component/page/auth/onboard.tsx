import React, { forwardRef, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, Icon, Input, Error, Header, Phrase } from 'Component';
import { I, C, S, U, translate, Animation, analytics, keyboard, Renderer, Onboarding } from 'Lib';

enum Stage {
	Phrase 		= 0,
	Email	 	= 1,
	Persona 	= 2,
	UseCase		= 3,
};

const PageAuthOnboard = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { account } = S.Auth;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);
	const nextRef = useRef(null);
	const phraseRef = useRef(null);
	const emailRef = useRef(null);
	const shuffled = useRef({ role: null, purpose: null });
	const selected = useRef({ role: null, purpose: null });
	const [ stage, setStage ] = useState(Stage.Phrase);
	const [ phraseVisible, setPhraseVisible ] = useState(false);
	const [ error, setError ] = useState('');
	const [ dummy, setDummy ] = useState(0);
	const options = {
		role: [ 'student', 'manager', 'softwareDeveloper', 'writer', 'designer', 'artist', 'marketer', 'consultant', 'entrepreneur', 'researcher' ],
		purpose: [ 'messaging', 'knowledge', 'noteTaking', 'projects', 'lifePlanning', 'habitTracking', 'teamWork' ],
	};
	const cnb = [ 'c48' ];
	const needEmail = U.Data.isAnytypeNetwork() && S.Common.isOnline;

	const unbind = () => {
		$(window).off('keydown.onboarding');
	};

	const rebind = () => {
		unbind();
		$(window).on('keydown.onboarding', e => onKeyDown(e));
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
		return stage <= Stage.UseCase;
	};

	const onAuth = () => {
		U.Router.switchSpace(S.Common.space, '', false, {
			onFadeIn: () => {
				Onboarding.startCommon(props.isPopup);
				analytics.event('OpenAccount');
			},
		}, false);
	};

	// Moves the Onboarding Flow one stage forward if possible
	const onForward = () => {
		if (!canMoveForward()) {
			return;
		};

		switch (stage) {
			case Stage.Phrase: {
				Animation.from(() => setStage(stage + (needEmail ? 1 : 2)));
				break;
			};

			case Stage.Email: {
				if (!needEmail) {
					Animation.from(() => setStage(stage + 1));
					break;
				};

				const email = emailRef.current?.getValue();

				if (email) {
					nextRef.current?.setLoading(true);
					
					C.MembershipV2SubscribeToUpdates(email, (message: any) => {
						nextRef.current?.setLoading(false);

						if (message.error.code) {
							setError(message.error.description);
							return;
						};

						Animation.from(() => setStage(stage + 1));

						analytics.event('ScreenOnboardingEnterEmail', { middleTime: message.middleTime });
					});
				} else {
					Animation.from(() => setStage(stage + 1));
					analytics.event('ScreenOnboardingSkipEmail');
				};
				break;
			};

			case Stage.Persona: {
				Animation.from(() => setStage(stage + 1));

				if (selected.current.role) {
					const items = getItems('role');
					const type = items.find(it => it.id == selected.current.role).type;

					analytics.event('ClickOnboarding', { step: 'Persona', type });
				};
				break;
			};

			case Stage.UseCase: {
				onAuth();

				if (selected.current.purpose) {
					const items = getItems('purpose');
					const type = items.find(it => it.id == selected.current.purpose).type;

					analytics.event('ClickOnboarding', { step: 'UseCase', type });
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
			Animation.from(() => U.Router.go('/auth/select', { replace: true }));
		} else {
			setStage(stage - 1);
		};
	};

	const onPhraseCopy = () => {
		if (!phraseVisible) {
			phraseRef.current?.onToggle();
			setPhraseVisible(true);
		};

		U.Common.copyToast(translate('commonPhrase'), phraseRef.current?.getValue());
		analytics.event('KeychainCopy', { type: 'Onboarding' });
	};

	const onLearnMore = () => {
		S.Popup.open('phrase', {});
		analytics.event('ClickOnboarding', { type: 'MoreInfo', step: Stage[stage] });
	};

	const onEmailKeyUp = (e: KeyboardEvent, v: string) => {
		const isValid = U.String.matchEmail(v);

		$(nextRef.current?.getNode()).toggleClass('disabled', !isValid);
	};

	const shuffleItems = (stage: string) => {
		const s = options[stage].map(value => ({ value, sort: Math.random() }))
			.sort((a, b) => a.sort - b.sort)
			.map(({ value }) => value);

		s.push('other');

		shuffled.current[stage] = s;

		return s;
	};

	const getItems = (stage: string) => {
		const items = shuffled.current[stage] ? shuffled.current[stage] : shuffleItems(stage);

		return items.map(it => {
			const type = U.String.toUpperCamelCase(it);

			return { id: it, name: translate(`authOnboardOptions${type}`), type, stage };
		});
	};

	const onItemClick = (item: any) => {
		const { id, stage } = item;
		selected.current[stage] = item.id;

		setDummy(dummy + 1);
	};

	const itemsMapper = (item: any) => {
		const { id, name, stage } = item;
		const s = selected.current[stage];
		const isSelected = s == item.id;

		return (
			<div className={[ 'option', 'animation', isSelected ? 'selected' : '' ].join(' ')} key={id} onClick={() => onItemClick(item)}>
				<Icon className={id} />
				<Label text={name} />
			</div>
		);
	};

	if (!canMoveForward()) {
		cnb.push('disabled');
	};

	let content = null;
	let additional = null;
	let buttons = null;

	switch (stage) {
		case Stage.Phrase: {
			content = (
				<Phrase
					ref={phraseRef}
					className="animation"
					isHidden={!phraseVisible}
					onCopy={onPhraseCopy}
					onClick={onPhraseCopy}
					readonly={true}
					tooltipCopy={translate('pageAuthOnboardCopyKey')}
				/>
			);

			additional = (
				<div className="learnMore animation" onClick={onLearnMore}>
					<Icon />
					<Label text={translate('commonLearnMore')} />
				</div>
			);

			buttons = (
				<>
					<div className="animation">
						<Button 
							ref={nextRef} 
							className={cnb.join(' ')}
							text={phraseVisible ? translate('commonContinue') : translate('authOnboardPhraseRevealAndCopy')} 
							color="accent" 
							onClick={phraseVisible ? onForward : onPhraseCopy}
						/>
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
						<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonContinue')} color="accent" onClick={onForward} />
					</div>
					<div className="animation">
						<Button color="blank" className="c48" text={translate('commonSkip')} onClick={onForward} />
					</div>
				</>
			);
			break;
		};

		case Stage.Persona: {
			if (!selected.current.role) {
				cnb.push('disabled');
			};

			content = (
				<div className="optionsWrapper">
					{getItems('role').map(itemsMapper)}
				</div>
			);

			buttons = (
				<>
					<div className="animation">
						<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonContinue')} color="accent" onClick={onForward} />
					</div>
					<div className="animation">
						<Button color="blank" className="c48" text={translate('commonSkip')} onClick={onForward} />
					</div>
				</>
			);
			break;
		};

		case Stage.UseCase: {
			if (!selected.current.purpose){
				cnb.push('disabled');
			};

			content = (
				<div className="optionsWrapper">
					{getItems('purpose').map(itemsMapper)}
				</div>
			);

			buttons = (
				<>
					<div className="animation">
						<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonDone')} color="accent" onClick={onForward} />
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
			Renderer.send('keytarGet', account.id).then((value: string) => {
				if (value) {
					phraseRef.current?.setValue(value);
				};
			}).catch((err: any) => {
				console.error('[Onboard] Error retrieving phrase from keychain:', err);
			});
		};

		analytics.event('ScreenOnboarding', { step: Stage[stage] });
	}, [ stage ]);

	return (
		<div 
			ref={nodeRef} 
			className={`stage${Stage[stage]}`}
		>
			<Header {...props} component="authIndex" onBack={onBack} />

			<Frame ref={frameRef}>
				<Title className="animation" text={translate(`authOnboard${Stage[stage]}Title`)} />
				<Label id="label" className="description animation" text={translate(`authOnboard${Stage[stage]}Label`)} />
				{additional}

				{content}
				<Error className="animation" text={error} />
				<div className="buttons">{buttons}</div>
			</Frame>
		</div>
	);

}));

export default PageAuthOnboard;
