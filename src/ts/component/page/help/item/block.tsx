import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Smile } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	type: I.BlockType;
	style?: any;
	icon?: string;
};

import ContentIcon from './icon';
import ContentTitle from './title';
import ContentText from './text';
import ContentLink from './link';

class Block extends React.Component<Props, {}> {

	public static defaultProps = {
		type: I.BlockType.Text,
		style: I.TextStyle.Paragraph,
	};

	render () {
		const { type, style } = this.props;
		
		let cn = [ 'block' ];
		let content = null;
		
		switch (type) {
			case I.BlockType.IconPage:
				cn.push('blockIconPage');
				content = <ContentIcon {...this.props} />;
				break;
				
			case I.BlockType.Title:
				cn.push('blockTitle');
				content = <ContentTitle {...this.props} />;
				break;
									
			case I.BlockType.Text:
				cn.push('blockText ' + DataUtil.styleClassText(style));
				content = <ContentText {...this.props} />;
				break;
								
			case I.BlockType.Link:
				cn.push('blockLink');
				content = <ContentLink {...this.props} />;
				break;

			case I.BlockType.Div:
				cn.push('blockDiv c' + style);
				
				let inner: any = null;
				switch (style) {
					case I.DivStyle.Dot:
						inner = (
							<React.Fragment>
								<div className="dot" />
								<div className="dot" />
								<div className="dot" />
							</React.Fragment>
						);
						break;
				};
				
				content = <div className="div">{inner}</div>;
				break;
		};
		
		return (
			<div className={cn.join(' ')}>
				<div className="wrapContent">
					<div className="selectable">
						<div className="dropTarget">
							{content}
						</div>
					</div>
				</div>
			</div>
		);
	};
	
};

export default Block;