import React, { FC } from 'react';
import { I } from 'Lib';

const HeaderMainEmpty: FC<I.HeaderComponent> = (props) => {
	
	const { renderLeftIcons } = props;

	return (
		<>
			<div className="side left">{renderLeftIcons()}</div>
			<div className="side center" />
			<div className="side right" />
		</>
	);

};

export default HeaderMainEmpty;