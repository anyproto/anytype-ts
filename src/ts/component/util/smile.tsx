import * as React from 'react';
import { Emoji } from 'emoji-mart';

interface Props {
	icon: string;
	size: number;
};

class Smile extends React.Component<Props, {}> {
	
	private static defaultProps = {
		size: 18
	};
	
	render() {
		const { icon, size } = this.props;
		
		return (
			<div className="smile" {...this.props}>
				{icon ? <Emoji emoji={icon} set="apple" size={size} /> : ''}
			</div>
		);
	};
	
};

export default Smile;