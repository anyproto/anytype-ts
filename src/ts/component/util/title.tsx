import * as React from 'react';

interface Props {
	text: string;
	className?: string;
};

class Title extends React.Component<Props, object> {

	render () {
		const { text, className } = this.props;
		
		let cn = [ 'title' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')} dangerouslySetInnerHTML={{ __html: text }} />
		);
	};
	
};

export default Title;