import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Block } from 'ts/component';
import { I, M, Util } from 'ts/lib';
import { blockStore, dbStore } from 'ts/store';

import RelationItem from 'ts/component/menu/item/relationView';

interface State {
	rootId: string;
	type: I.DropType;
	width: number;
	ids: string[];
};

const $ = require('jquery');
const Constant = require('json/constant.json');

class DragLayer extends React.Component<{}, State> {
	
	_isMounted: boolean = false;
	state = {
		rootId: '',
		type: I.DropType.None,
		width: 0,
		ids: [] as string[],
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
	};
	
	render () {
		let { rootId, type, width } = this.state;
		let content = null;
		let ids = this.state.ids.slice(0, 10);
		let items: any[] = [];
		
		switch (type) {
			case I.DropType.Block:
				items = ids.map((id: string) => {
					const block = blockStore.getLeaf(rootId, id);
					return new M.Block(Util.objectCopy(block));
				});
			
				content = (
					<div className="blocks">
						{items.map((block: any, i: number) => (
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
						))}
					</div>
				);
				break;

			case I.DropType.Relation:
				const block = blockStore.getLeaf(rootId, rootId);

				items = ids.map((relationKey: string) => {
					return dbStore.getRelationByKey(relationKey);
				}).filter(it => it);

				content = (
					<div className="menus">
						<div className="menu vertical menuBlockRelationView">
							{items.map((item: any, i: number) => {
								return (
									<RelationItem 
										key={'drag-layer-' + item.relationKey} 
										rootId={rootId}
										{...item}
										block={block}
									/>
								);
							})}
						</div>
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
	
	show (rootId: string, type: I.DropType, ids: string[], component: any, x: number, y: number) {
		if (!this._isMounted) {
			return;
		};
		
		const comp = $(ReactDOM.findDOMNode(component));
		const rect = comp.get(0).getBoundingClientRect() as DOMRect;
		
		this.setState({ rootId: rootId, type: type, width: rect.width - Constant.size.blockMenu, ids: ids });
	};

	hide () {
		if (!this._isMounted) {
			return;
		};

		this.setState({ rootId: '', type: I.DropType.None, ids: [] });
	};
	
};

export default DragLayer;