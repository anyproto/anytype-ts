import * as React from 'react';
import { U } from 'Lib';

interface Props {
	text: string;
	style?: any;
};

class EmptySearch extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { text, style } = this.props;
		
		return (
			<div ref={node => this.node = node} style={style} className="emptySearch">
				<div className="txt" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} />
			</div>
		);
	};
	
};

export default EmptySearch;
