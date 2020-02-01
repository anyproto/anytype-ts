import * as React from 'react';

interface Props {
	num?: number;
	image?: string;
	className?: string;
};

class Cover extends React.Component<Props, {}> {

	private static defaultProps = {
	};

	render () {
		const { num, image, className } = this.props;
		
		let cn = [ 'cover' ];
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
			<div className={cn.join(' ')} style={style} />
		);
	};
	
};

export default Cover;