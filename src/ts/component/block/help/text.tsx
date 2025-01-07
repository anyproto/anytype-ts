import React, { forwardRef } from 'react';
import { Marker, IconObject } from 'Component';
import { I, U } from 'Lib';

interface Props {
	text?: string;
	style?: I.TextStyle;
	checked?: boolean;
	color?: string;
	icon?: string;
};

const ContentText = forwardRef<HTMLDivElement, Props>(({ 
	text = '&nbsp;', 
	style = I.TextStyle.Paragraph, 
	checked = false, 
	color = 'default', 
	icon = '',
}, ref) => {

	let marker = null;
	let additional = null;

	switch (style) {
		case I.TextStyle.Quote: {
			additional = <div className="line" />;
			break;
		};

		case I.TextStyle.Callout: {
			additional = <IconObject object={{ iconEmoji: icon, layout: I.ObjectLayout.Page }} />;
			break;
		};
			
		case I.TextStyle.Bulleted: {
			marker = { type: I.MarkerType.Bulleted, className: 'bullet', active: false };
			break;
		};
			
		case I.TextStyle.Numbered: {
			marker = { type: I.MarkerType.Numbered, className: 'number', active: false };
			break;
		};
			
		case I.TextStyle.Toggle: {
			marker = { type: I.MarkerType.Toggle, className: 'toggle', active: false };
			break;
		};
			
		case I.TextStyle.Checkbox: {
			marker = { type: I.MarkerType.Checkbox, className: 'check', active: checked };
			break;
		};
	};
	
	return (
		<div className="flex">
			<div className="markers">
				{marker ? <Marker {...marker} color={color} /> : ''}
			</div>
			{additional}
			<div className="wrap" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} />
		</div>
	);

});

export default ContentText;