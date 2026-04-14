import React, { forwardRef } from 'react';
import { Label } from 'Component';
import * as I from 'Interface';

interface Props {
	type: I.ProgressType;
	label: string;
};

const ProgressText = forwardRef<{}, Props>(({ 
	label = '', 
	type = I.ProgressType.None,
}, ref) => {

	const list = S.Progress.getList(it => it.type == type);

	if (!list.length) {
		return null;
	};

	const percent = S.Progress.getPercent(list);

	return (
		<div className="progressText">
			<Label text={`${percent}% ${label}`} />
		</div>
	);

});

export default ProgressText;