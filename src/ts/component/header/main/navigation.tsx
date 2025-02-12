import React, { forwardRef } from 'react';
import { I } from 'Lib';

const HeaderMainNavigation = forwardRef<{}, I.HeaderComponent>((props, ref) => {
	
	const { renderLeftIcons, renderTabs } = props;

	return (
		<>
			<div className="side left">{renderLeftIcons(true)}</div>
			<div className="side center">{renderTabs()}</div>
			<div className="side right" />
		</>
	);

});

export default HeaderMainNavigation;
