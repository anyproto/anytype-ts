import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Block, Icon } from 'ts/component';
import { I, keyBoard, Key, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { throttle } from 'lodash';

interface Props {
	blockStore?: any;
	editorStore?: any;
	dataset?: any;
};

const Constant = require('json/constant.json');
const $ = require('jquery');

@inject('blockStore')
@inject('editorStore')
@observer
class EditorPage extends React.Component<Props, {}> {

	direction: number = 0;
	timeoutHover: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
	};

	render () {
		const { blockStore } = this.props;
		const { blocks } = blockStore;
		const tree = blockStore.getTree('', blocks);
		
		let n = 0;
		return (
			<div className="editor">
				<div className="blocks">
					<Icon id="add" className="add" />
				
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
	
	componentDidMount () {
		const win = $(window);
		
		this.unbind();
		win.on('mousemove.editor', throttle((e: any) => { this.onMouseMove(e); }, 10));
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('mousemove.editor');
	};
	
	onMouseMove (e: any) {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const container = $('.pageMainEdit');
		const blocks = node.find('.block');
		const rectContainer = (container.get(0) as Element).getBoundingClientRect() as DOMRect;
		const st = win.scrollTop();
		const add = node.find('#add');
		const { pageX, pageY } = e;
		const offset = 100;
		
		let hovered: any = null;
			
		blocks.each((i: number, item: any) => {
			item = $(item);
			
			let rect = $(item).get(0).getBoundingClientRect() as DOMRect;
			let { x, y, width, height } = rect;
			y += st;

			if ((pageX >= x) && (pageX <= x + width) && (pageY >= y) && (pageY <= y + height)) {
				hovered = item;
			};
		});
		
		
		let rect = { x: 0, y: 0, width: 0, height: 0 };
		if (hovered) {
			rect = (hovered.get(0) as Element).getBoundingClientRect() as DOMRect; 
		};
		
		let { x, y, width, height } = rect;
		y += st;
		
		window.clearTimeout(this.timeoutHover);
		
		if ((pageX >= x) && (pageX <= x + Constant.size.blockMenu) && (pageY >= offset) && (pageY <= st + rectContainer.height - offset)) {
			let dir = pageY < (y + height / 2) ? 'top': 'bottom';
			
			add.css({ opacity: 1, left: rect.x - rectContainer.x + 2, top: pageY - 10 });
			blocks.addClass('showMenu').removeClass('isAdding top bottom');
			
			if (hovered && (pageX <= x + 20)) {
				hovered.addClass('isAdding ' + dir);
			};
		} else {
			this.timeoutHover = window.setTimeout(() => {
				add.css({ opacity: 0 });
				blocks.removeClass('showMenu isAdding top bottom');
			}, 10);
		};
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