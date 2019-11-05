import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Block } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');
const raf = require('raf');

interface Props {
	blockStore?: any;
};

interface State {
	type: string;
	ids: string[];
};

@inject('blockStore')
@observer
class DragLayer extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		type: '',
		ids: [] as string[]
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
		this.move = this.move.bind(this);
	};
	
	render () {
		const { blockStore } = this.props;
		const { blocks } = blockStore;
		const { ids, type } = this.state;
		
		let n = 0;
		let content = null;
		
		switch (type) {
			case I.DragItem.Block:
				content = (
					<div className="blocks">
						{ids.map((id: string, i: number) => {
							const block = blocks.find((el: I.Block) => { return el.header.id == id; });
							
							n = Util.incrementBlockNumber(block, n);
							return <Block key={block.header.id} {...block} number={n} index={i} />
						})}
					</div>
				);
				break;
		};
		
		return (
			<div className="dragLayer">
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
		const node = $(ReactDOM.findDOMNode(this));
		
		node.removeClass('show').css({ width: comp.width() });
		this.setState({ type: type, ids: ids });
	};
	
	hide () {
		if (!this._isMounted) {
			return;
		};
			
		let node = $(ReactDOM.findDOMNode(this));
		node.removeClass('show');
		
		this.setState({ type: '', ids: [] });
	};
	
	move (x: number, y: number) {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this));
			node.css({ transform: `translate3d(${x}px, ${y}px, 0px)` }).addClass('show');
		});
	};
	
};

export default DragLayer;