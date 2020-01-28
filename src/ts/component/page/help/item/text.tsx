import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props {
	text?: string;
	style?: I.TextStyle;
};

class ContentText extends React.Component<Props, {}> {

	render () {
		const { text, style } = this.props;
		
		const Marker = (item: any) => (
			<div className={[ 'marker', item.className, (item.active ? 'active' : '') ].join(' ')} onClick={item.onClick}>
				<span><Icon /></span>
			</div>
		);

		let markers: any[] = [];
		switch (style) {
			case I.TextStyle.Bulleted:
				markers.push({ type: I.TextStyle.Bulleted, className: 'bullet', active: false, onClick: () => {} });
				break;
		};
		
		return (
			<div className="flex">
				<div className="markers">
					{markers.map((item: any, i: number) => (
						<Marker key={i} {...item} />
					))}
				</div>
				<div className="wrap" dangerouslySetInnerHTML={{ __html: text }} />
			</div>
		);
	};
	
};

export default ContentText;