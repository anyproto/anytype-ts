import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I } from 'ts/lib';

interface Props extends I.Block {};

import BlockDataview from './dataview';
import BlockText from './text';

class Block extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
		const { header, content } = this.props;
		const { id, type } = header;
		
		let cn = [ 'block' ];
		let BlockComponent: React.ReactType<{}>;
		
		switch (type) {
			case I.BlockType.Dataview:
				cn.push('blockDataview');
				BlockComponent = BlockDataview;
				break;
				
			case I.BlockType.Text:
				cn.push('blockText');
				BlockComponent = BlockText;
				break;
		};
		
		return (
			<div className={cn.join(' ')}>
				<BlockComponent {...this.props} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
};

export default Block;