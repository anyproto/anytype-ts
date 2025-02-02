import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, keyboard } from 'Lib';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { renderLeftIcons } = props;

	return (
		<>
			<div className="side left">{renderLeftIcons()}</div>
			<div className="side center" />
			<div className="side right" />
		</>
	);

}));

export default HeaderMainSettings;
