import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconObject, ObjectName } from 'ts/component';
import { blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, DataUtil } from 'ts/lib';

interface Props {
	canDrag: boolean;
	getList?(): void;
	onClick?(e: any, item: any): void;
	onSelect?(e: any, item: any): void;
	onAdd?(e: any): void;
	onMore?(e: any, item: any): void;
	onSortStart?(param: any): void;
	onSortEnd?(result: any): void;
	helperContainer?(): any;
}

const $ = require('jquery');

const ListIndex = observer(class ListIndex extends React.Component<Props, {}> {
	
	timeout: number = 0;

	render () {
		const { onClick, onSelect, onMore, helperContainer, getList, onSortStart, onSortEnd, canDrag } = this.props;
		const { root } = blockStore;
		const element = blockStore.getLeaf(root, root);
		
		if (!element) {
			return null;
		};

		const childrenIds = blockStore.getChildrenIds(root, root);
		const length = childrenIds.length;
		const children = getList();
		
		const Item = SortableElement((item: any) => {
			let object: any = null;
			let targetId = '';
			let icon = null;

			if (item.isBlock) {
				object = item._object_;
				targetId = item.content.targetBlockId;
			} else {
				object = item;
				targetId = item.id;
			};

			let { id, _empty_, layout, name, iconEmoji, iconImage, snippet } = object;
			let type = dbStore.getObjectType(object.type);
			let cn = [ 'item', DataUtil.layoutClass(id, layout) ];
			
			if (_empty_) {
				return (
					<div className="item isLoading" data-target-id={targetId}>
						<div className="iconObject c48 animatedBackground" />
						<div className="line lineName animatedBackground" />
						<div className="line lineType animatedBackground" />
					</div>
				);
			};

			if ([ I.ObjectLayout.Task, I.ObjectLayout.Bookmark ].includes(layout)) {
				icon = <IconObject size={18} object={object} canEdit={true} onCheckbox={(e: any) => { this.onCheckbox(e, object); }} />;
			} else {
				icon = <IconObject size={48} object={object} />;
			};

			return (
				<div 
					id={'item-' + item.id} 
					className={cn.join(' ')} 
					onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
					onMouseLeave={(e: any) => { this.onMouseLeave(e, item); }}
					data-id={item.id}
					data-target-block-id={targetId}
				>
					{icon}

					<ObjectName object={object} />
					<div className="type">{type ? type.name : ''}</div>

					<Icon id={'button-' + item.id + '-more'} tooltip="Actions" className="more" onClick={(e: any) => { onMore(e, item); }} />
					<Icon className="checkbox" onClick={(e: any) => { onSelect(e, item); }} />

					<div className="click" onClick={(e: any) => { onClick(e, item); }} onContextMenu={(e: any) => { onMore(e, item); }} />
				</div>
			);
		});
		
		let List = SortableContainer((item: any) => {
			return (
				<React.Fragment>
					{item.list.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} disabled={!canDrag} />
					))}
				</React.Fragment>
			);
		});

		return (
			<div className="list">
				<List 
					axis="xy" 
					transitionDuration={150}
					distance={10}
					list={children} 
					helperClass="isDragging"
					getContainer={helperContainer}
					helperContainer={helperContainer} 
					onSortStart={onSortStart}
					onSortEnd={onSortEnd} 
				/>
			</div>
		);
	};

	componentDidUpdate () {
		$(window).trigger('resize');
	};

	onCheckbox (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		DataUtil.pageSetDone(item.id, !item.done);
	};
	
	onMouseEnter (e: any, item: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#item-' + item.id);

		window.clearTimeout(this.timeout);
		node.find('.item.hover').removeClass('hover');
		el.addClass('hover');
	};

	onMouseLeave (e: any, item: any) {
		const node = $(ReactDOM.findDOMNode(this));

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			node.find('.item.hover').removeClass('hover');
		}, 100);
	};
	
});

export default ListIndex;