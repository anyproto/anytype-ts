import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Block } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');

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
							return <Block key={block.header.id} {...block} isDragging={true} number={n} index={i} />
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
	
	show (type: string, ids: string[]) {
		let node = $(ReactDOM.findDOMNode(this));
		node.css({ display: 'none' });
		
		this.setState({ type: type, ids: ids });
	};
	
	hide () {
		let node = $(ReactDOM.findDOMNode(this));
		node.css({ display: 'none' });
		
		this.setState({ type: '', ids: [] });
	};
	
	move (x: number, y: number) {
		let node = $(ReactDOM.findDOMNode(this));
		node.css({ transform: `translate3d(${x}px, ${y}px, 0px)`, display: 'block' });
	};
	
};

export default DragLayer;