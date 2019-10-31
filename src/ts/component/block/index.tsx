import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I } from 'ts/lib';
import { Block as Child } from 'ts/component';

import BlockDataview from './dataview';
import BlockText from './text';
import BlockImage from './image';
import BlockVideo from './video';
import BlockFile from './file';
import BlockBookmark from './bookmark';

interface Props extends I.Block {
	number: number;
};

class Block extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
		const { header, content, children } = this.props;
		const { id, type } = header;
		const { style } = content;
		
		let n = 0;
		let cn = [ 'block' ];
		let BlockComponent: React.ReactType<{}>;
		
		switch (type) {
			default:
			case I.BlockType.Text:
				cn.push('blockText');
				BlockComponent = BlockText;
				break;
				
			case I.BlockType.Layout:
				cn.push('blockLayout c' + style);
				BlockComponent = () => (<div/>);
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
				
			case I.BlockType.Bookmark:
				cn.push('blockBookmark');
				BlockComponent = BlockBookmark;
				break;
			
			case I.BlockType.Dataview:
				cn.push('blockDataview');
				BlockComponent = BlockDataview;
				break;
		};
		
		return (
			<div id={'block-' + id} className={cn.join(' ')}>
				<div className="wrapMenu"></div>
					
				<div className="wrapContent">
					<BlockComponent {...this.props} />
						
					<div className="children">
						{children.map((item: any, i: number) => {
							if (item.header.type == I.BlockType.Text) {
								if (item.content.marker == I.MarkerType.Number) {
									n++;
								} else {
									n = 0;
								};
							};
										
							return (
								<Child key={item.header.id} {...item} number={n} />
							);
						})}
					</div>
				</div>
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