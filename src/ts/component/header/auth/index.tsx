import React, { forwardRef } from 'react';
import { Icon } from 'Component';
import { S } from 'Lib';

const HeaderAuthIndex = forwardRef(() => {

	return (
		<>
			<div className="side left" />
			<div className="side center" />
			<div className="side right">
				<Icon className="settings withBackground" onClick={() => S.Popup.open('settingsOnboarding', {})} />
			</div>
		</>
	);
});

export default HeaderAuthIndex;