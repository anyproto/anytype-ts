import * as React from 'react';

interface Props {
	text: string;
	className?: string;
};

class Label extends React.Component<Props, {}> {

	render () {
		let className = [ 'label' ];
		if (this.props.className) {
			className.push(this.props.className);
		};
		
		return (
			<div className={className.join(' ')} dangerouslySetInnerHTML={{ __html: this.props.text }} />
		);
	};
	
};

export default Label;