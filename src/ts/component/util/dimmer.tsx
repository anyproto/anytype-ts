import * as React from 'react';

interface Props {
	className?: string;
	onClick?(e: any): void;
};

class Dimmer extends React.Component<Props> {
	

	render () {
		const { className, onClick } = this.props;
		const cn = [ 'dimmer' ];

		if (className) {
			cn.push(className);
		};
		
		return <div id="dimmer" className={cn.join(' ')} onClick={onClick} />;
	};
	
};

export default Dimmer;