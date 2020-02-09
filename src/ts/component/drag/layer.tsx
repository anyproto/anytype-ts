import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Block } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');
const raf = require('raf');

interface Props {
	blockStore?: any;
	rootId: string;
};

interface State {
	type: string;
	width: number;
	ids: string[];
};

@inject('blockStore')
@observer
class DragLayer extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		type: '',
		width: 0,
		ids: [] as string[]
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
		this.move = this.move.bind(this);
	};
	
	render () {
		const { ids, type, width } = this.state;
		
		if (!type) {
			return null;
		};
		
		const { blockStore, rootId } = this.props;
		const { blocks } = blockStore;
		const map = blockStore.getMap(blocks[rootId] || []);
		
		let content = null;
		switch (type) {
			case I.DragItem.Block:
				content = (
					<div className="blocks">
						{ids.map((id: string, i: number) => {
							const block = map[id] || {};
							
							return <Block key={id} {...block} rootId={rootId} index={i} />
						})}
					</div>
				);
				break;
		};
		
		return (
			<div className="dragLayer" style={{ width: width }}>
				{content}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	show (type: string, ids: string[], component: any) {
		if (!this._isMounted) {
			return;
		};
		
		const comp = $(ReactDOM.findDOMNode(component));
		const rect = comp.get(0).getBoundingClientRect() as DOMRect;
		
		this.setState({ type: type, width: rect.width, ids: ids });
	};
	
	hide () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		
		node.css({ left: '', top: '' });
		this.setState({ type: '', ids: [] });
	};
	
	move (x: number, y: number) {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this));
			const css = x && y ? { left: 0, top: 0, transform: `translate3d(${x + 10}px, ${y + 10}px, 0px)` } : { left: '', top: '' };
			
			node.css(css);
		});
	};
	
};

export default DragLayer;