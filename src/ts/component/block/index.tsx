import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, Util } from 'ts/lib';
import { Block as Child, Icon } from 'ts/component';

import BlockDataview from './dataview';
import BlockText from './text';
import BlockImage from './image';
import BlockIcon from './icon';
import BlockVideo from './video';
import BlockFile from './file';
import BlockBookmark from './bookmark';

interface Props extends I.Block {
	index: number;
	number: number;
};

interface State {
	toggled: boolean;
}; 

class Block extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		toggled: false
	};
	
	constructor (props: any) {
		super(props);
		
		this.onToggle = this.onToggle.bind(this);
	};

	render () {
		const { header, content, children, index } = this.props;
		const { id, type } = header;
		const { style, toggleable } = content;
		const { toggled } = this.state;
		
		let n = 0;
		let cn = [ 'block', 'index' + index ];
		let BlockComponent: React.ReactType<{}>;
		
		switch (type) {
			default:
			case I.BlockType.Text:
				cn.push('blockText');
				if (toggleable) {
					cn.push('canToggle');
				};
				
				BlockComponent = () => <BlockText toggled={toggled} onToggle={this.onToggle} {...this.props} />;
				break;
				
			case I.BlockType.Layout:
				cn.push('blockLayout c' + style);
				BlockComponent = () => <div/>;
				break;
				
			case I.BlockType.Image:
				cn.push('blockImage');
				BlockComponent = BlockImage;
				break;
				
			case I.BlockType.Icon:
				cn.push('blockIcon');
				BlockComponent = BlockIcon;
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
				<div className="wrapMenu">
					<Icon className="dnd" />
				</div>
					
				<div className="wrapContent">
					<BlockComponent {...this.props} />
						
					<div className={[ 'children', (toggled ? 'active' : '') ].join('')}>
						{children.map((item: any, i: number) => {
							n = Util.incrementBlockNumber(item, n);
							return (
								<Child key={item.header.id} {...item} number={n} index={i} />
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
	
	onToggle (e: any) {
		this.setState({ toggled: !this.state.toggled });
	};
	
};

export default Block;