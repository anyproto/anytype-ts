import React, { forwardRef } from 'react';
import ContentIcon from './icon';
import ContentText from './text';
import ContentLink from './link';
import * as I from 'Interface';

interface Props {
	type?: I.BlockType;
	style?: any;
	icon?: string;
	align?: I.BlockHAlign;
	isToggled?: boolean;
	onRowClick?: (e: any) => void;
};

const Block = forwardRef<HTMLDivElement, Props>((props, ref) => {

	const {
		type = I.BlockType.Text,
		style = I.TextStyle.Paragraph,
		align = I.BlockHAlign.Left,
		isToggled = false,
		onRowClick,
	} = props;
	const cn = [ 'block', U.Data.blockClass({ type: type, content: { style: style } }), `align${align}` ];

	if (isToggled) {
		cn.push('isToggled');
	};

	let content = null;

	switch (type) {
		case I.BlockType.IconPage: {
			content = <ContentIcon {...props} />;
			break;
		};

		case I.BlockType.Text: {
			content = <ContentText {...props} />;
			break;
		};

		case I.BlockType.Link: {
			content = <ContentLink {...props} />;
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

	const interactiveProps = onRowClick ? { onClick: onRowClick } : {};

	return (
		<div className={cn.join(' ')} {...interactiveProps}>
			<div className="wrapContent">
				<div className="selectionTarget">
					<div className="dropTarget">
						{content}
					</div>
				</div>
			</div>
		</div>
	);

});

export default Block;
