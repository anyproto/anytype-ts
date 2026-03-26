import React, { forwardRef } from 'react';
import * as I from 'Interface';

const HeaderMainEmpty = forwardRef<{}, I.HeaderComponent>((props, ref) => {
	
	const { renderLeftIcons } = props;

	return (
		<>
			<div className="side left">{renderLeftIcons(true, true)}</div>
			<div className="side center" />
			<div className="side right" />
		</>
	);

});

export default HeaderMainEmpty;
