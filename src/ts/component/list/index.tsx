import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconUser, Smile } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';

interface Props {
	blockStore?: any;
	onSelect?(e: any, id: string): void;
	onAdd?(e: any): void;
	helperContainer?(): any;
};

@inject('blockStore')
@observer
class ListIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { blockStore, onSelect, onAdd, helperContainer } = this.props;
		const { blocks } = blockStore;
		const length = blocks.length;
		
		const Item = SortableElement((item: any) => {
			return (
				<div className="item" onClick={(e: any) => { onSelect(e, item.id); }}>
					<Smile className="c48" icon={item.icon} size={24} />
					<div className="name">{item.name}</div>
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
				pressDelay={50}
				list={blocks} 
				helperContainer={helperContainer} 
				onSortEnd={this.onSortEnd} 
			/>
		);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { blockStore } = this.props;
		
		blockStore.documentSort(oldIndex, newIndex);
	};
	
};

export default ListIndex;