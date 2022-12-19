import * as React from 'react';

interface Props {
	text: string;
};

class Error extends React.Component<Props, object> {

	public static defaultProps = {
		text: ''
	};

	render () {
		let { text } = this.props;
		
		return (
			<div className="error" dangerouslySetInnerHTML={{ __html: text }} />
		);
	};
	
};

export default Error;