import * as React from 'react';
import { Block } from 'ts/component';
import { I, keyBoard, Key, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props {
	blockStore?: any;
	editorStore?: any;
	dataset?: any;
};

@inject('blockStore')
@inject('editorStore')
@observer
class EditorPage extends React.Component<Props, {}> {

	direction: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
	};

	render () {
		const { blockStore } = this.props;
		const { blocks } = blockStore;
		const tree = this.getTree('', blocks);
		
		let n = 0;
		return (
			<div className="editor">
				<div className="blocks">
					{tree.map((item: I.Block, i: number) => { 
						n = Util.incrementBlockNumber(item, n);
						return <Block 
							key={item.header.id} {...item} number={n} index={i}
							{...this.props}
							onKeyDown={this.onKeyDown} 
							onKeyUp={this.onKeyUp} 
						/>
					})}
				</div>
			</div>
		);
	};
	
	getTree (rootId: string, list: I.Block[]) {
		let ret: any = [];
		for (let item of list) {
			let obj = Util.objectCopy(item);
			
			if (!obj.header.id || (rootId != obj.header.parentId)) {
				continue;
			};
			
			obj.childBlocks = this.getTree(obj.header.id, list);
			ret.push(obj);
		};
		return ret;
	};
	
	onKeyDown (e: any) {
		const { blockStore, editorStore, dataset } = this.props;
		const { focused, range } = editorStore;
		const { blocks } = blockStore;
		const { selection } = dataset;
		
		const block = blocks.find((item: I.Block) => { return item.header.id == focused; });
		const index = blocks.findIndex((item: I.Block) => { return item.header.id == focused; });
		
		const { content } = block;
		const { text } = content;
		
		let k = e.which;
		
		if (
			((range.start == 0) && (k == Key.up)) ||
			((range.end == text.length) && (k == Key.down))
		) {
			e.preventDefault();
			e.stopPropagation();
			
			if (e.shiftKey) {
				window.getSelection().empty();
				
				this.direction = k == Key.up ? -1 : 1;
				selection.set([ focused ]);
			};
		};
		
		keyBoard.keyDownBlock(e);
	};
	
	onKeyUp (e: any) {
		keyBoard.keyUpBlock(e);
	};
	
};

export default EditorPage;