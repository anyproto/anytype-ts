import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I } from 'ts/lib';

import BlockDataview from './dataview';
import BlockText from './text';
import BlockImage from './image';
import BlockVideo from './video';
import BlockFile from './file';

interface Props extends I.Block {};

class Block extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
		const { header, content } = this.props;
		const { id, type } = header;
		
		let cn = [ 'block' ];
		let BlockComponent: React.ReactType<{}>;
		
		switch (type) {
			default:
			case I.BlockType.Text:
				cn.push('blockText');
				BlockComponent = BlockText;
				break;
				
			case I.BlockType.Image:
				cn.push('blockImage');
				BlockComponent = BlockImage;
				break;
				
			case I.BlockType.Video:
				cn.push('blockVideo');
				BlockComponent = BlockVideo;
				break;
				
			case I.BlockType.File:
				cn.push('blockFile');
				BlockComponent = BlockFile;
				break;
			
			case I.BlockType.Dataview:
				cn.push('blockDataview');
				BlockComponent = BlockDataview;
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

	componentWillUnmount () {
		this._isMounted = false;
	};
	
};

export default Block;