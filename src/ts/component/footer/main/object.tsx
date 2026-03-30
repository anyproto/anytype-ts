import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import * as I from 'Interface';

const FooterMainObject = observer(forwardRef<{}, I.FooterComponent>((props, ref) => {

	return (
		<div className="buttons" />
	);

}));

export default FooterMainObject;
