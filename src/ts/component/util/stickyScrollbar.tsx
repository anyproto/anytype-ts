import React, { forwardRef } from 'react';

interface Props {
	isInline?: boolean;
};

const StickyScrollbar = forwardRef<HTMLDivElement, Props>(({
	isInline = false,
}, ref) => {

	if (isInline) {
		return null;
	};

	return (
		<div id="stickyScrollbar" className="stickyScrollbar" ref={ref}>
			<div id="stickyScrollbarTrack" className="stickyScrollbarTrack"></div>
		</div>
	);

});

export default StickyScrollbar;
