import React, { forwardRef } from 'react';
import { IconObject } from 'Component';
import * as I from 'Interface';

const WidgetSpace = forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview) {
		return null;
	};

	const cn = [ U.Data.spaceClass(spaceview.spaceType) ];

	return (
		<div className={cn.join(' ')}>
			<div className="iconHead">
				<IconObject
					size={64}
					iconSize={64}
					object={spaceview}
					onClick={() => U.Space.openDashboard()}
				/>
			</div>
		</div>
	);

});

export default WidgetSpace;
