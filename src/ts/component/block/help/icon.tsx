import React, { forwardRef } from 'react';
import { IconObject } from 'Component';

interface Props {
	icon?: string;
};

const ContentIcon = forwardRef<HTMLDivElement, Props>(({ icon = '' }, ref) => {

	return <IconObject size={96} object={{ iconEmoji: icon }} />;

});

export default ContentIcon;