import React, { forwardRef, useRef, useEffect } from 'react';
import { Frame, Label, Button, Header, Footer } from 'Component';
import { I, U, translate, Animation, analytics } from 'Lib';

const PageAuthSelect = forwardRef<{}, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);

	const onLogin = () => {
		Animation.from(() => U.Router.go('/auth/login', {}));
	};

	const onRegister = () => {
		Animation.from(() => U.Router.go('/auth/onboard', {}));
	};

	useEffect(() => {
		Animation.to(() => {
			U.Common.renderLinks($(nodeRef.current));

			analytics.removeContext();
			analytics.event('ScreenIndex');
		});
	}, []);

	return (
		<div ref={nodeRef}>
			<Header {...props} component="authIndex" />
			<Frame>
				<div className="logo animation" />
				<Label className="descr animation" text={translate('authSelectLabel')} />

				<div className="buttons">
					<div className="animation">
						<Button text={translate('authSelectSignup')} onClick={onRegister} />
					</div>
					<div className="animation">
						<Button text={translate('authSelectLogin')} color="blank" onClick={onLogin} />
					</div>
				</div>
			</Frame>
			<Footer {...props} className="animation" component="authDisclaimer" />
		</div>
	);

});

export default PageAuthSelect;