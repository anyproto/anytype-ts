import * as React from 'react';

interface Props {
	text: string;
	className?: string;
};

class Title extends React.Component<Props> {

	render () {
		const { text, className } = this.props;
		const cn = [ 'title' ];

		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')} dangerouslySetInnerHTML={{ __html: text }} />
		);
	};
	
};

export default Title;