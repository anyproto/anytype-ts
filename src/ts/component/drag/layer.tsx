import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block } from 'ts/component';
import { I, M, Util } from 'ts/lib';
import { blockStore } from 'ts/store';

const $ = require('jquery');
const Constant = require('json/constant.json');

interface Props extends RouteComponentProps<any> {
	rootId: string;
};

interface State {
	type: string;
	width: number;
	ids: string[];
};

class DragLayer extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		type: '',
		width: 0,
		ids: [] as string[],
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
	};
	
	render () {
		let { ids, type, width } = this.state;
		let { rootId } = this.props;
		let content = null;
		
		switch (type) {
			case I.DragItem.Block:
				const blocks = ids.slice(0, 10).map((id: string) => {
					let block = blockStore.getLeaf(rootId, id);
					block = new M.Block(Util.objectCopy(block));
					return block;
				});
			
				content = (
					<div className="blocks">
						{blocks.map((block: any, i: number) => {
							return (
								<Block 
									key={'drag-layer-' + block.id} 
									{...this.props} 
									block={block} 
									rootId={rootId} 
									index={i} 
									readonly={true} 
									isDragging={true}
									getWrapperWidth={() => { return Constant.size.editor; }} 
								/>
							);
						})}
					</div>
				);
				break;
		};
		
		return (
			<div id="dragLayer" className="dragLayer" style={{ width: width }}>
				<div className="inner">
					{content}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentDidUpdate () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('.block').attr({ id: '' });
		node.find('.selectable').attr({ id: '' });
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
		
		this.setState({ type: type, width: rect.width - Constant.size.blockMenu, ids: ids });
	};

	hide () {
		if (!this._isMounted) {
			return;
		};

		this.setState({ type: '', ids: [] });
	};
	
};

export default DragLayer;