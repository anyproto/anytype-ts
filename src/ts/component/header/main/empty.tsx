import React, { forwardRef } from 'react';
import { I } from 'Lib';

const HeaderMainEmpty = forwardRef<{}, I.HeaderComponent>((props, ref) => {
	
	const { renderLeftIcons } = props;

	return (
		<>
			<div className="side left">{renderLeftIcons()}</div>
			<div className="side center" />
			<div className="side right" />
		</>
	);

});

export default HeaderMainEmpty;