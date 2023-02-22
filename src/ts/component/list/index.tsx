import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconObject, ObjectName } from 'Component';
import { blockStore, dbStore } from 'Store';
import { I, Util, DataUtil, ObjectUtil, translate } from 'Lib';
import Constant from 'json/constant.json';

interface Props {
	canDrag: boolean;
	getList?(): any[];
	onClick?(e: any, item: any): void;
	onSelect?(e: any, item: any): void;
	onAdd?(e: any): void;
	onMore?(e: any, item: any): void;
	onSortStart?(param: any): void;
	onSortEnd?(result: any): void;
	helperContainer?(): any;
};

const ListIndex = observer(class ListIndex extends React.Component<Props> {
	
	node: any = null;
	timeout = 0;

	render () {
		const { onClick, onSelect, onMore, helperContainer, getList, onSortStart, onSortEnd, canDrag } = this.props;
		const { root } = blockStore;
		const element = blockStore.getLeaf(root, root);
		
		if (!element) {
			return null;
		};

		const { offset, total } = dbStore.getMeta(Constant.subId.index, '');
		const records = dbStore.getRecords(Constant.subId.index, '');
		const childrenIds = blockStore.getChildrenIds(root, root);
		const length = childrenIds.length;
		const children = getList();

		// Subscriptions
		children.forEach((item: any) => {
			const object = item.isBlock ? item._object_ : item;
			const type = dbStore.getType(object.type);

			const { name, isDeleted } = type || {};
		});
		
		const Item = SortableElement((item: any) => {
			const object = item.isBlock ? item._object_ : item;
			const targetId = item.isBlock ? item.content.targetBlockId : item.id;
			const { id, _empty_, layout, name, iconEmoji, iconImage, snippet } = object;
			const type = dbStore.getType(object.type);
			const cn = [ 'item', DataUtil.layoutClass(id, layout) ];
			

			if (_empty_) {
				return (
					<div 
						className="item isLoading" 
						{...Util.dataProps({ 'target-id': targetId })}
					>
						<div className="iconObject c48 animatedBackground" />
						<div className="line lineName animatedBackground" />
						<div className="line lineType animatedBackground" />
					</div>
				);
			};

			let icon = null;
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
					{...Util.dataProps({ id: item.id, 'target-block-id': targetId })}
				>
					{icon}

					<ObjectName object={object} />
					<div className="type">{!type || type.isDeleted ? translate('commonDeletedType') : type.name}</div>

					<Icon id={'button-' + item.id + '-more'} tooltip="Actions" className="more" onClick={(e: any) => { onMore(e, item); }} />
					<Icon className="checkbox" onClick={(e: any) => { onSelect(e, item); }} />

					<div className="click" onClick={(e: any) => { onClick(e, item); }} onContextMenu={(e: any) => { onMore(e, item); }} />
				</div>
			);
		});
		
		let List = SortableContainer((item: any) => {
			return (
				<React.Fragment>
					{children.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} disabled={!canDrag} />
					))}
				</React.Fragment>
			);
		});

		return (
			<div 
				ref={node => this.node = node}
				className="list"
			>
				<List 
					axis="xy" 
					transitionDuration={150}
					distance={10}
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

		ObjectUtil.setDone(item.id, !item.done);
	};
	
	onMouseEnter (e: any, item: any) {
		const node = $(this.node);
		const el = node.find('#item-' + item.id);

		window.clearTimeout(this.timeout);
		node.find('.item.hover').removeClass('hover');
		el.addClass('hover');
	};

	onMouseLeave (e: any, item: any) {
		const node = $(this.node);

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			node.find('.item.hover').removeClass('hover');
		}, 100);
	};
	
});

export default ListIndex;