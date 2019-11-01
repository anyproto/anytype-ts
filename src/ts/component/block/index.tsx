import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { Block as Child, Icon } from 'ts/component';

import { DropTarget, DragSource } from 'react-dnd';
import { NativeTypes, getEmptyImage } from 'react-dnd-html5-backend';
import { flow } from 'lodash';

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
	connectDragSource: any;
	connectDropTarget: any;
	connectDragPreview: any;
	isDragging: boolean;
	isOver: boolean;
};

interface State {
	toggled: boolean;
};

const $ = require('jquery');
const { FILE } = NativeTypes;

const source = {
	beginDrag (props: any, monitor: any, component: any) {
		const position = monitor.getClientOffset();
		
		let node = $(ReactDOM.findDOMNode(component));
		let bounds = node.get(0).getBoundingClientRect();
		
		return ({
			bounds,
			list: [ props ]
		});
	},

	endDrag (props: any, monitor: any) {
	}
};

const sourceCollect = (connect: any, monitor: any) => ({
	connectDragPreview: connect.dragPreview(),
	connectDragSource: connect.dragSource(),
	isDragging: monitor.isDragging()
});

const target  = {
	drop (props: any, monitor: any, component: any) {
	},

	hover (props: any, monitor: any, component: any) {
		const item = monitor.getItem();
		const itemType = monitor.getItemType();
		const position = monitor.getClientOffset();
	}
};

const targetCollect = (connect: any, monitor: any) => {
	return {
		connectDropTarget: connect.dropTarget(),
		isOver: monitor.isOver()
	};
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
		const { header, content, children, index, connectDragSource, connectDropTarget, isDragging, isOver } = this.props;
		const { id, type } = header;
		const { style, toggleable } = content;
		const { toggled } = this.state;
		
		let n = 0;
		let canDrop = true;
		let cn = [ 'block', 'index' + index, (isOver ? 'isOver' : '') ];
		
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
		};
		
		let wrapMenu = (
			<div className="wrapMenu">
				{connectDragSource(<div className="icon dnd" />)}
			</div>
		);
		
		let wrapContent = (
			<div className="wrapContent">
				{connectDropTarget(
					<div className="dropTarget">
						<BlockComponent {...this.props} />
					</div>
				)}
					
				<div className={[ 'children', (toggled ? 'active' : '') ].join('')}>
					{children.map((item: any, i: number) => {
						n = Util.incrementBlockNumber(item, n);
						return <Child key={item.header.id} {...item} number={n} index={i} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div id={'block-' + id} className={cn.join(' ')}>
				{wrapMenu}
				{wrapContent}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		this.props.connectDragPreview(getEmptyImage(), {});
	};

	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onToggle (e: any) {
		this.setState({ toggled: !this.state.toggled });
	};
	
};

export default flow([
	DragSource(I.DragItem.Block, source, sourceCollect),
	DropTarget([ I.DragItem.Block, FILE ], target, targetCollect),
])(Block);