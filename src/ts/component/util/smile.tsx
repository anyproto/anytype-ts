import * as React from 'react';
import { Emoji } from 'emoji-mart';

interface Props {
	icon: string;
	size?: number;
	className?: string;
};

class Smile extends React.Component<Props, {}> {
	
	private static defaultProps = {
		size: 18
	};
	
	render() {
		const { icon, size, className } = this.props;
		
		let cn = [ 'smile' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')}>
				{icon ? <Emoji emoji={icon} set="apple" size={size} /> : ''}
			</div>
		);
	};
	
};

export default Smile;