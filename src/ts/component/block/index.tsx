import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { Block as Child, Icon, DropTarget } from 'ts/component';

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
	dataset?: any;
};

interface State {
	toggled: boolean;
};

const $ = require('jquery');

class Block extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		toggled: false
	};
	
	constructor (props: any) {
		super(props);
		
		this.onToggle = this.onToggle.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDrop = this.onDrop.bind(this);
	};

	render () {
		const { header, content, childBlocks, index } = this.props;
		const { id, type } = header;
		const { style, toggleable } = content;
		const { toggled } = this.state;
		
		let n = 0;
		let canDrop = true;
		let cn = [ 'block', 'index' + index, 'selectable' ];
		
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
				canDrop = false;
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
				
			case I.BlockType.Div:
				cn.push('blockDiv');
				BlockComponent = () => <div className="div" />;
				break;
		};
		
		let wrapMenu = (
			<div className="wrapMenu">
				<div className="icon dnd" draggable={true} onDragStart={this.onDragStart} />
			</div>
		);
		
		let wrapContent = (
			<div className="wrapContent">
				<DropTarget id={header.id} type={I.DragItem.Block} onDrop={this.onDrop}>
					<BlockComponent {...this.props} />
				</DropTarget>
					
				<div className={[ 'children', (toggled ? 'active' : '') ].join(' ')}>
					{childBlocks.map((item: any, i: number) => {
						n = Util.incrementBlockNumber(item, n);
						return <Child key={item.header.id} {...this.props} {...item} number={n} index={i} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div id={'block-' + id} className={cn.join(' ')} data-id={id}>
				{wrapMenu}
				{wrapContent}
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
	
	onDragStart (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		node.addClass('isDragging');
		
		if (this.props.dataset) {
			let ids = [ this.props.header.id ];
			if (this.props.dataset.selection && this.props.dataset.selection.ids.length) {
				ids = this.props.dataset.selection.ids;
			};
			if (this.props.dataset.onDragStart) {
				this.props.dataset.onDragStart(e, I.DragItem.Block, ids, this);				
			};
		};
	};
	
	onDrop (e: any, type: string, id: string, direction: string) {
		if (this.props.dataset && this.props.dataset.onDrop) {
			this.props.dataset.onDrop(e, type, id, direction);			
		};
	};
	
};

export default Block;