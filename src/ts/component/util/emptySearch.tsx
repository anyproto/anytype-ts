import * as React from 'react';
import { UtilCommon } from 'Lib';

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
				<div className="txt" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(text) }} />
			</div>
		);
	};
	
};

export default EmptySearch;
