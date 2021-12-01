import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block } from 'ts/component';
import { I, M, Util } from 'ts/lib';
import { blockStore, dbStore } from 'ts/store';

import RelationItem from 'ts/component/menu/item/relationView';

interface Props extends RouteComponentProps<any> {
	rootId: string;
};

interface State {
	type: I.DragItem;
	width: number;
	ids: string[];
};

const $ = require('jquery');
const Constant = require('json/constant.json');

class DragLayer extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		type: I.DragItem.None,
		width: 0,
		ids: [] as string[],
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
	};
	
	render () {
		let { type, width } = this.state;
		let { rootId } = this.props;
		let content = null;
		let ids = this.state.ids.slice(0, 10);
		let items: any[] = [];
		
		switch (type) {
			case I.DragItem.Block:
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

			case I.DragItem.Relation:
				const block = blockStore.getLeaf(rootId, rootId);

				items = ids.map((relationKey: string) => {
					return dbStore.getRelation(rootId, rootId, relationKey);
				});

				console.log(block);
				console.log(items);

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
										onEdit={() => {}}
										onRef={() => {}}
										onFav={() => {}}
										readonly={true}
										canEdit={false}
										canFav={false}
										isFeatured={false}
										classNameWrap=""
										onCellClick={() => {}}
										onCellChange={() => {}}
										optionCommand={() => {}}
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
	
	show (type: I.DragItem, ids: string[], component: any, x: number, y: number) {
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

		this.setState({ type: I.DragItem.None, ids: [] });
	};
	
};

export default DragLayer;