import * as React from 'react';
import { Marker } from 'ts/component';
import { I } from 'ts/lib';

interface Props {
	text?: string;
	style?: I.TextStyle;
	checked?: boolean;
	color?: string;
};

class ContentText extends React.Component<Props, {}> {

	public static defaultProps = {
		text: '&nbsp;',
		color: 'default',
	};

	render () {
		const { text, style, checked, color } = this.props;
		
		let marker = null;
		let additional = null;

		switch (style) {
			case I.TextStyle.Quote:
				additional = (
					<div className="line" />
				);
				break;
				
			case I.TextStyle.Bulleted:
				marker = { type: I.TextStyle.Bulleted, className: 'bullet', active: false };
				break;
				
			case I.TextStyle.Numbered:
				marker = { type: I.TextStyle.Numbered, className: 'number', active: false };
				break;
				
			case I.TextStyle.Toggle:
				marker = { type: I.TextStyle.Toggle, className: 'toggle', active: false };
				break;
				
			case I.TextStyle.Checkbox:
				marker = { type: I.TextStyle.Checkbox, className: 'check', active: checked };
				break;
		};
		
		return (
			<div className="flex">
				<div className="markers">
					{marker ? <Marker {...marker} color={color} /> : ''}
				</div>
				{additional}
				<div className="wrap" dangerouslySetInnerHTML={{ __html: text }} />
			</div>
		);
	};
	
};

export default ContentText;