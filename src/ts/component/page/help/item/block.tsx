import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Smile } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	type: I.BlockType;
	style?: I.TextStyle;
	icon?: string;
};

import ContentIcon from './icon';
import ContentTitle from './title';
import ContentText from './text';
import ContentLink from './link';

class Block extends React.Component<Props, {}> {

	render () {
		const { type, style } = this.props;
		
		let cn = [ 'block' ];
		let content = null;
		
		switch (type) {
			case I.BlockType.Icon:
				cn.push('blockIcon');
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
		};
		
		return (
			<div className={cn.join(' ')}>
				<div className="wrapContent">{content}</div>
			</div>
		);
	};
	
};

export default Block;