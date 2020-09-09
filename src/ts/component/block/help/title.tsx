import * as React from 'react';

interface Props {
	text?: string;
};

class ContentTitle extends React.Component<Props, {}> {

	render () {
		const { text } = this.props;
		
		return (
			<div className="flex">
				<div className="wrap" dangerouslySetInnerHTML={{ __html: text }} />
			</div>
		);
	};
	
};

export default ContentTitle;