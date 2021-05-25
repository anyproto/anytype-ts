import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, DataUtil } from 'ts/lib';

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
		
		let cn = [ 'block', DataUtil.blockClass({ type: type, content: { style: style } }) ];
		let content = null;
		
		switch (type) {
			case I.BlockType.IconPage:
				content = <ContentIcon {...this.props} />;
				break;
				
			case I.BlockType.Text:
				content = <ContentText {...this.props} />;
				break;
								
			case I.BlockType.Link:
				content = <ContentLink {...this.props} />;
				break;

			case I.BlockType.Div:
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