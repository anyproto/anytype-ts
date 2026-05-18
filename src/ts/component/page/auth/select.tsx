import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Frame, Button, Header, Footer, Error, Label } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';
import Animation from 'Lib/animation';

const PageAuthSelect = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const registerRef = useRef(null);
	const introBubbleRef = useRef(null);
	const [ error, setError ] = useState('');

	const inflate = (callBack: () => void) => {
		U.Dom.addClass(introBubbleRef.current, 'inflate');
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

			U.Data.onInfo(account.info);
			U.Data.onAuthOnce();

			Storage.set('spaceId', account.info.accountSpaceId);
			Storage.set('multichatsOnboarding', true);
			Storage.setOnboarding('objectDescriptionButton');
			Storage.setOnboarding('typeResetLayout');

			S.Common.showRelativeDatesSet(true);
			S.Common.sidebarViewSet(I.SidebarView.Widgets);

			U.Subscription.createGlobal(() => {
				inflate(() => U.Router.go('/auth/onboard', {}));
			});
		};

		if (account) {
			cb();
			return;
		};

		registerRef.current?.setLoading(true);

		U.Data.accountCreate(error => {
			registerRef.current?.setLoading(false);
			setError(error);
		}, cb);
	};

	useEffect(() => {
		Animation.to(() => {
			U.Dom.renderLinks(nodeRef.current);

			analytics.removeContext();
			analytics.event('ScreenIndex');
		});
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
						<Button ref={registerRef} text={translate('authSelectSignup')} color="accent" size={48} onClick={onRegister} />
					</div>
					<div className="animation">
						<Button text={translate('authSelectLogin')} color="blank" size={48} onClick={onLogin} />
					</div>
				</div>

				<Error text={error} />
			</Frame>
			<Footer {...props} className="animation" component="authDisclaimer" />
		</div>
	);

});

export default PageAuthSelect;
