import * as React from 'react';
import { Icon } from 'Component';
import { Util } from 'Lib';

interface Props {
	limit: number;
	onClick?(e: any): void;
};

class LoadMore extends React.Component<Props, {}> {

	public static defaultProps = {
		limit: 10,
	};

	render () {
		const { limit, onClick } = this.props;

		return (
			<div className="loadMore" onClick={onClick}>
				<Icon />
				<div className="name">Show {limit} more {Util.cntWord(limit, 'object', 'objects')}</div>
			</div>
		);
	};

	
};

export default LoadMore;