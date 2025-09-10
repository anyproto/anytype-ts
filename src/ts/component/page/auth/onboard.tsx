import React, { forwardRef, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, Icon, Input, Error, Header } from 'Component';
import { I, C, S, U, J, translate, Animation, analytics, keyboard, Renderer, Onboarding, Storage } from 'Lib';

enum Stage {
	Email	 = 0,
	Persona 	 = 1,
	UseCase  = 2,
};

const PageAuthOnboard = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { account } = S.Auth;
	const { redirect } = S.Common;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);
	const nextRef = useRef(null);
	const emailRef = useRef(null);
	const shuffled = useRef({ role: null, purpose: null });
	const selected = useRef({ role: null, purpose: null });
	const [ stage, setStage ] = useState(Stage.Email);
	const [ error, setError ] = useState('');
	const [ dummy, setDummy ] = useState(0);
	const options = {
		role: [ 'student', 'manager', 'softwareDeveloper', 'writer', 'designer', 'artist', 'marketer', 'consultant', 'entrepreneur', 'researcher' ],
		purpose: [ 'messaging', 'knowledge', 'noteTaking', 'projects', 'lifePlanning', 'habitTracking', 'teamWork' ],
	};
	const cnb = [ 'c48' ];

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
		const routeParam = {
			replace: true,
			onRouteChange: () => {
				S.Common.showRelativeDatesSet(true);
				U.Space.initSpaceState();

				const routeParam = { replace: true };

				Storage.set('primitivesOnboarding', true);
				Storage.setOnboarding('objectDescriptionButton');
				Storage.setOnboarding('typeResetLayout');

				if (redirect) {
					U.Router.go(redirect, routeParam);
					S.Common.redirectSet('');
					return;
				};

				if (S.Auth.startingId) {
					U.Object.getById(S.Auth.startingId, {}, object => {
						if (object) {
							U.Object.openRoute(object, routeParam);
						} else {
							U.Space.openDashboard(routeParam);
						};
					});
				} else {
					U.Space.openDashboard(routeParam);
				};

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

		if (stage == Stage.Email) {
			Animation.from(() => U.Router.go('/', { replace: true }));
		} else {
			setStage(stage - 1);
		};
	};

	const onEmailKeyUp = (e: KeyboardEvent, v: string) => {
		const isValid = U.Common.matchEmail(v);

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
			const type = U.Common.toUpperCamelCase(it);

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
	let buttons = null;

	switch (stage) {
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
						<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonContinue')} color="accent" onClick={() => onForward()} />
					</div>
					{/*<div className="animation">*/}
					{/*	<Button color="blank" className="c48" text={translate('commonSkip')} onClick={() => onForward()} />*/}
					{/*</div>*/}
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
						<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonContinue')} color="accent" onClick={() => onForward()} />
					</div>
					<div className="animation">
						<Button color="blank" className="c48" text={translate('commonSkip')} onClick={() => onForward()} />
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
						<Button ref={nextRef} className={cnb.join(' ')} text={translate('commonDone')} color="accent" onClick={() => onForward()} />
					</div>
					<div className="animation">
						<Button color="blank" className="c48" text={translate('commonSkip')} onClick={() => onForward()} />
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

				{content}
				<Error className="animation" text={error} />
				<div className="buttons">{buttons}</div>
			</Frame>
		</div>
	);

}));

export default PageAuthOnboard;
