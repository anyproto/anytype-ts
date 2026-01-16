import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import $ from 'jquery';
import { Frame, Button, Header, Footer, Error, Label } from 'Component';
import { I, U, S, translate, Animation, analytics, Storage, Renderer } from 'Lib';
import { observer } from 'mobx-react';

const PageAuthSelect = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const registerRef = useRef(null);
	const introBubbleRef = useRef(null);
	const [ error, setError ] = useState('');
	const { authInProgress } = S.Auth;

	const onAuthInProgress = useCallback((e: any, inProgress: boolean) => {
		S.Auth.setAuthInProgress(inProgress);
		if (inProgress) {
			setError(translate('pageAuthLoginInProgress'));
			registerRef.current?.setLoading(false);
		};
	}, []);

	const inflate = (callBack: () => void) => {
		$(introBubbleRef.current).addClass('inflate');
		window.setTimeout(callBack, 1000);
	};

	const onLogin = () => {
		inflate(() => U.Router.go('/auth/login', {}));
	};

	const onRegister = () => {
		const { account } = S.Auth;
		const cb = () => {
			const { account } = S.Auth;
			if (!account) {
				return;
			};

			Renderer.send('authEnd');

			U.Data.onInfo(account.info);
			U.Data.onAuthOnce();

			Storage.set('spaceId', account.info.accountSpaceId);
			S.Common.showRelativeDatesSet(true);

			Storage.set('multichatsOnboarding', true);
			Storage.setOnboarding('objectDescriptionButton');
			Storage.setOnboarding('typeResetLayout');

			U.Subscription.createGlobal(() => {
				inflate(() => U.Router.go('/auth/onboard', {}));
			});
		};

		if (account) {
			cb();
			return;
		};

		if (authInProgress) {
			setError(translate('pageAuthLoginInProgress'));
			return;
		};

		if (!Renderer.send('authStart')) {
			setError(translate('pageAuthLoginInProgress'));
			return;
		};

		registerRef.current?.setLoading(true);

		U.Data.accountCreate(error => {
			registerRef.current?.setLoading(false);
			setError(error);
			if (error) {
				Renderer.send('authEnd');
			};
		}, cb);
	};

	useEffect(() => {
		const inProgress = Renderer.send('getAuthStatus');
		S.Auth.setAuthInProgress(inProgress);
		if (inProgress) {
			setError(translate('pageAuthLoginInProgress'));
		};

		Renderer.on('auth-in-progress', onAuthInProgress);

		Animation.to(() => {
			U.Common.renderLinks($(nodeRef.current));

			analytics.removeContext();
			analytics.event('ScreenIndex');
		});

		return () => Renderer.remove('auth-in-progress');
	}, []);

	return (
		<div ref={nodeRef}>
			<Header {...props} component="authIndex" />
			
			<Frame>
				<div className="intro animation">
					<Label className="line1" text={translate('authSelectIntroLine1')} />
					<Label className="line2" text={translate('authSelectIntroLine2')} />

					<div ref={introBubbleRef} className="bubbleWrapper">
						<div className="bubble">
							<div className="img" />
						</div>
					</div>
				</div>

				<div className="buttons">
					<div className="animation">
						<Button ref={registerRef} text={translate('authSelectSignup')} color="accent" className="c48" onClick={onRegister} />
					</div>
					<div className="animation">
						<Button text={translate('authSelectLogin')} color="blank" className="c48" onClick={onLogin} />
					</div>
				</div>

				<Error text={error} />
			</Frame>
			<Footer {...props} className="animation" component="authDisclaimer" />
		</div>
	);

}));

export default PageAuthSelect;
