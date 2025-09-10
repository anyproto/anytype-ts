import React, { forwardRef, useRef, useEffect, useState } from 'react';
import $ from 'jquery';
import { Frame, Button, Header, Footer, Error, Label } from 'Component';
import { I, U, S, translate, Animation, analytics } from 'Lib';
import { observer } from 'mobx-react';

const PageAuthSelect = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const registerRef = useRef(null);
	const introBubbleRef = useRef(null);
	const [ error, setError ] = useState('');

	const inflate = (callBack: () => void) => {
		$(introBubbleRef.current).addClass('inflate');
		window.setTimeout(callBack, 1000);
	};

	const onLogin = () => {
		inflate(() => U.Router.go('/auth/login', {}));
	};

	const onRegister = () => {
		const { account } = S.Auth;
		const cb = () => inflate(() => U.Router.go('/auth/onboard', {}));

		if (account) {
			cb();
			return;
		};

		registerRef.current.setLoading(true);

		U.Data.accountCreate(error => {
			registerRef.current.setLoading(false);
			setError(error);
		}, cb);
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