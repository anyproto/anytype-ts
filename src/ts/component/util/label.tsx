import * as React from 'react';

interface Props {
	text: string;
	className?: string;
};

class Label extends React.Component<Props, {}> {

	render () {
		const { text, className } = this.props;
		
		let cn = [ 'label' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')} dangerouslySetInnerHTML={{ __html: text }} />
		);
	};
	
};

export default Label;