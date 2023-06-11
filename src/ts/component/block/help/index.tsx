import * as React from 'react';
import { I, UtilData } from 'Lib';
import ContentIcon from './icon';
import ContentText from './text';
import ContentLink from './link';

interface Props {
	type: I.BlockType;
	style?: any;
	icon?: string;
	align?: I.BlockHAlign;
};

class Block extends React.Component<Props> {

	public static defaultProps = {
		type: I.BlockType.Text,
		style: I.TextStyle.Paragraph,
		align: I.BlockHAlign.Left,
	};

	render () {
		const { type, style, align } = this.props;
		const cn = [ 'block', UtilData.blockClass({ type: type, content: { style: style } }), 'align' + align ];

		let content = null;
		
		switch (type) {
			case I.BlockType.IconPage: {
				content = <ContentIcon {...this.props} />;
				break;
			};
				
			case I.BlockType.Text: {
				content = <ContentText {...this.props} />;
				break;
			};
								
			case I.BlockType.Link: {
				content = <ContentLink {...this.props} />;
				break;
			};

			case I.BlockType.Div: {
				let inner: any = null;
				switch (style) {
					case I.DivStyle.Line:
						inner = (
							<div className="line" />
						);
						break;

					case I.DivStyle.Dot:
						inner = (
							<div className="dots">
								<div className="dot" />
								<div className="dot" />
								<div className="dot" />
							</div>
						);
						break;
				};
				
				content = <div className="wrap">{inner}</div>;
				break;
			};
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