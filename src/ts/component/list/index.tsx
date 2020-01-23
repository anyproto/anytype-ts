import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconUser, Smile } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';

interface Props {
	blockStore?: any;
	rootId: string;
	onSelect?(e: any, item: any): void;
	onAdd?(e: any): void;
	onSortEnd?(result: any): void;
	helperContainer?(): any;
};

const Constant = require('json/constant.json');

@inject('blockStore')
@observer
class ListIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { blockStore, onSelect, onAdd, helperContainer, rootId } = this.props;
		const { blocks } = blockStore;
		const tree = blockStore.prepareTree(rootId, blocks[rootId] || []);
		const length = blocks.length;
		
		const Item = SortableElement((item: any) => {
			let content = item.content || {};
			let fields = content.fields || {};
			return (
				<div id={'item-' + item.id} className="item" onClick={(e: any) => { onSelect(e, item); }}>
					<Smile className="c48" icon={fields.icon} size={24} />
					<div className="name">{fields.name}</div>
				</div>
			);
		});
		
		const ItemAdd = SortableElement((item: any) => {
			return (
				<div className="item add" onClick={onAdd}>
					<Icon />
				</div>
			);
		});
		
		const List = SortableContainer((item: any) => {
			return (
				<div>
					{item.list.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} />
					))}
					<ItemAdd index={length + 1} disabled={true} />
				</div>
			);
		});
		
		return (
			<List 
				axis="xy" 
				transitionDuration={150}
				distance={10}
				list={tree} 
				helperClass="dragging"
				helperContainer={helperContainer} 
				onSortEnd={this.onSortEnd} 
			/>
		);
	};
	
	onSortEnd (result: any) {
		const { onSortEnd } = this.props;
		onSortEnd(result);
	};
	
};

export default ListIndex;