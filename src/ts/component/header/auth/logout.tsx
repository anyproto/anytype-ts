import React, { forwardRef } from 'react';
import { Button } from 'Component';
import { observer } from 'mobx-react';
import { Animation, I, S, U, translate } from 'Lib';

const HeaderAuthLogout = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const onLogout = () => {
		S.Auth.logout(true, false);
		Animation.from(() => U.Router.go('/auth/select', { replace: true }));
	};

	return (
		<>
			<div className="side left" />
			<div className="side center">
				<div className="logo" />
			</div>
			<div className="side right">
				<Button icon="logout" color="simple" text={translate('commonLogout')} onClick={onLogout} />
			</div>
		</>
	);
}));

export default HeaderAuthLogout;