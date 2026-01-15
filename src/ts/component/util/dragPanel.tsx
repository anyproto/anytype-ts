import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { S, U } from 'Lib';

const DragPanel = observer(forwardRef<{}, {}>((props, ref) => {

	const { singleTab, isFullScreen } = S.Common;

	// Only render on macOS when singleTab is active and not in fullscreen
	if (!U.Common.isPlatformMac() || !singleTab || isFullScreen) {
		return null;
	};

	return (
		<div id="dragPanel" />
	);

}));

export default DragPanel;
