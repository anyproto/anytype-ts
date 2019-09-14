import * as React from 'react';

interface Props {
	num: number;
	image?: string;
};

class Cover extends React.Component<Props, {}> {

	private static defaultProps = {
		num: 1
	};

	render () {
		const { num, image } = this.props;
		
		let cn = [ 'cover' ];
		let style: any = {};
		
		if (num) {
			cn.push('c' + num);
		};
		if (image) {
			style.backgroundImage = 'url("' + image + '")';
		};
		
		return (
			<div className={cn.join(' ')} style={style} />
		);
	};
	
};

export default Cover;