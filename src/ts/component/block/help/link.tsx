import React, { forwardRef } from 'react';
import { IconObject } from 'Component';

interface Props {
	icon?: string;
	name?: string;
	contentId?: string;
};

const ContentLink = forwardRef<HTMLDivElement, Props>(({ icon = '', name = '', contentId = '' }, ref) => {

	return (
		<>
			<IconObject object={{ iconEmoji: icon }} />
			<div className="name" onClick={() => U.Router.go(`/help/${contentId}`, {})}>
				{name}
			</div>
		</>
	);

});

export default ContentLink;