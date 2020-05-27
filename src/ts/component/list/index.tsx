import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconUser, Smile } from 'ts/component';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, Util} from 'ts/lib';

interface Props {
	onSelect?(e: any, item: any): void;
	onAdd?(e: any): void;
	onMore?(e: any, id: string): void;
	onSortEnd?(result: any): void;
	helperContainer?(): any;
};

const Constant = require('json/constant.json');

@observer
class ListIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { onSelect, onAdd, onMore, helperContainer } = this.props;
		const { root } = blockStore;
		const element = blockStore.getLeaf(root, root);
		
		if (!element) {
			return null;
		};
		
		const childrenIds = blockStore.getChildrenIds(root, root);
		const length = childrenIds.length;
		const children = blockStore.getChildren(root, root, (it: any) => {
			const details = blockStore.getDetails(root, it.content.targetBlockId);
			return !details.isArchived;
		});
		const map = blockStore.getDetailsMap(root);
		const size = map.size;
		
		const Item = SortableElement((item: any) => {
			const content = item.content || {};
			const details = blockStore.getDetails(root, content.targetBlockId);
			const { name, iconEmoji, iconImage } = details;

			let icon = iconEmoji;
			if (content.style == I.LinkStyle.Archive) {
				icon = (
					<div className="smile c48">
						<Icon className="archive" />
					</div>
				);
			} else {
				icon = <Smile className="c48" icon={iconEmoji} hash={iconImage} size={24} />;
			};
			
			return (
				<div id={'item-' + item.id} className="item" onClick={(e: any) => { onSelect(e, item); }}>
					{icon}
					<div className="name">{name}</div>
					<Icon id={'button-' + item.id + '-more'} className="more" onMouseDown={(e: any) => { onMore(e, item.id); }} />
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
				list={children} 
				helperClass="dragging"
				getContainer={helperContainer}
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