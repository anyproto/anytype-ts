import React, { forwardRef } from 'react';
import Button from 'Component/form/button';
import * as I from 'Interface';
import Animation from 'Lib/animation';

const HeaderAuthLogout = forwardRef<{}, I.HeaderComponent>((props, ref) => {

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
				<Button 
					iconParam={{ name: 'header/logout' }} 
					color="simple" 
					text={translate('commonLogout')} 
					onClick={onLogout}
				/>
			</div>
		</>
	);
});

export default HeaderAuthLogout;