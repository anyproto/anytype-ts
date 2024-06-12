import * as React from 'react';
import { I } from 'Lib';
import { commonStore } from 'Store';

const Constant = require('json/constant.json');

interface Props {
	id?: string;
	image?: string;
	src?: string;
	className?: string;
	type?: number;
	x?: number;
	y?: number;
	scale?: number;
	withScale?: boolean;
	preview?: boolean;
	children?: React.ReactNode;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
};

class Cover extends React.Component<Props> {

	private static defaultProps = {
		type: 0,
		x: 0.5,
		y: 0.5,
		scale: 0,
	};

	render () {
		const { id, image, src, type, x, y, scale, withScale, className, preview, onClick, onMouseDown, children } = this.props;
		const cn = [ 'cover', 'type' + type, id ];
		const style: any = {};
		
		if (className) {
			cn.push(className);
		};

		if ([ I.CoverType.Upload, I.CoverType.Source ].includes(type) && image) {
			style.backgroundImage = `url("${commonStore.imageUrl(image, Constant.size.cover)}")`;
		};

		if (src) {
			style.backgroundImage = `url("${src}")`;
		};
		
		if (withScale) {
			style.backgroundPosition = `${Math.abs(x * 100)}% ${Math.abs(y * 100)}%`;
			style.backgroundSize = ((scale + 1) * 100) + '%';
		};
		
		return (
			<div className={cn.join(' ')} onClick={onClick} onMouseDown={onMouseDown} style={style}>
				{children}
			</div>
		);
	};
	
};

export default Cover;