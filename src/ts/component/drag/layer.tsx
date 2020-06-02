import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block } from 'ts/component';
import { I, M, Util } from 'ts/lib';
import { blockStore } from 'ts/store';

const $ = require('jquery');
const raf = require('raf');

interface Props extends RouteComponentProps<any> {
	rootId: string;
};

interface State {
	type: string;
	width: number;
	ids: string[];
	x: number;
	y: number;
};

class DragLayer extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		type: '',
		width: 0,
		ids: [] as string[],
		x: 0,
		y: 0,
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
		this.move = this.move.bind(this);
	};
	
	render () {
		const { ids, type, width } = this.state;
		const { rootId } = this.props;
		
		if (!type) {
			return null;
		};
		
		let content = null;
		
		switch (type) {
			case I.DragItem.Block:
				const blocks = ids.map((id: string) => {
					let block = blockStore.getLeaf(rootId, id);
					block = new M.Block(Util.objectCopy(block));
					return block;
				});
			
				content = (
					<div className="blocks">
						{blocks.map((block: any, i: number) => {
							return <Block key={i} {...this.props} block={block} rootId={rootId} index={i} />
						})}
					</div>
				);
				break;
		};
		
		return (
			<div id="dragLayer" className="dragLayer" style={{ width: width }}>
				{content}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentDidUpdate () {
		const { type, x, y } = this.state;
		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('.block').attr({ id: '' });
		node.find('.selectable').attr({ id: '' });
		
		if (type) {
			node.css({ left: 0, top: 0 });
			this.move(x, y);
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	show (type: string, ids: string[], component: any, x: number, y: number) {
		if (!this._isMounted) {
			return;
		};
		
		const comp = $(ReactDOM.findDOMNode(component));
		const rect = comp.get(0).getBoundingClientRect() as DOMRect;
		
		this.setState({ type: type, width: rect.width, ids: ids, x: x, y: y });
	};

	hide () {
		if (!this._isMounted) {
			return;
		};
		
		this.setState({ type: '', ids: [] });
	};
	
	move (x: number, y: number) {
		
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this));
			
			let css: any = { left: 0, top: 0, transform: `translate3d(${x + 10}px, ${y + 10}px, 0px)` };
			if (!x && !y) {
				css.left = css.top = '';
			};
			node.css(css);
		});
	};
	
};

export default DragLayer;