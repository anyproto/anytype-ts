import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Frame, Button, Header, Footer, Error } from 'Component';
import { I, U, S, translate, Animation, analytics } from 'Lib';

const PageAuthSelect = forwardRef<{}, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const registerRef = useRef(null);
	const [ error, setError ] = useState('');

	const onLogin = () => {
		Animation.from(() => U.Router.go('/auth/login', {}));
	};

	const onRegister = () => {
		registerRef.current.setLoading(true);

		U.Data.accountCreate(error => {
			registerRef.current.setLoading(false);
			setError(error);
		}, () => Animation.from(() => U.Router.go('/auth/onboard', {})));
	};

	useEffect(() => {
		S.Auth.clearAll();

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

				<div className="buttons">
					<div className="animation">
						<Button text={translate('authSelectLogin')} color="blank" onClick={onLogin} />
					</div>
					<div className="animation">
						<Button ref={registerRef} text={translate('authSelectSignup')} onClick={onRegister} />
					</div>
				</div>

				<Error text={error} />
			</Frame>
			<Footer {...props} className="animation" component="authDisclaimer" />
		</div>
	);

});

export default PageAuthSelect;