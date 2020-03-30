import * as React from 'react';

interface Props {
	id?: string;
	num?: number;
	image?: string;
	className?: string;
	type?: number;
	onClick?(e: any): void;
};

class Cover extends React.Component<Props, {}> {

	private static defaultProps = {
		type: 0
	};

	render () {
		const { id, num, image, type, className, onClick } = this.props;
		
		let cn = [ 'cover', 'type' + type ];
		let style: any = {};
		
		if (num) {
			cn.push('c' + num);
		};
		if (className) {
			cn.push(className);
		};
		if ((num == -1) && image) {
			style.backgroundImage = 'url("' + image + '")';
		};
		
		return (
			<div id={id} className={cn.join(' ')} onClick={onClick} style={style} />
		);
	};
	
};

export default Cover;