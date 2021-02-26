import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconObject } from 'ts/component';
import { blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, DataUtil } from 'ts/lib';

interface Props {
	getList?(): void;
	onSelect?(e: any, item: any): void;
	onAdd?(e: any): void;
	onMore?(e: any, item: any): void;
	onSortEnd?(result: any): void;
	helperContainer?(): any;
};

const $ = require('jquery');

@observer
class ListIndex extends React.Component<Props, {}> {
	
	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { onSelect, onAdd, onMore, helperContainer, getList } = this.props;
		const { root } = blockStore;
		const element = blockStore.getLeaf(root, root);
		
		if (!element) {
			return null;
		};
		
		const childrenIds = blockStore.getChildrenIds(root, root);
		const length = childrenIds.length;
		const children = getList();
		const map = blockStore.getDetailsMap(root);
		const size = map.size;
		
		const Item = SortableElement((item: any) => {
			const content = item.content || {};
			const object = blockStore.getDetails(root, content.targetBlockId);
			const { _objectEmpty_, name, layout, iconEmoji, iconImage } = object;
			const objectType: any = dbStore.getObjectType(object.type);
			const cn = [ 'item' ];

			if (_objectEmpty_) {
				return (
					<div className="item">
						<div className="iconObject c48" />
						<div className="line animatedBackground" />
					</div>
				);
			};

			let icon = null;
			let showMenu = true;
			let btn = null;

			if (content.style == I.LinkStyle.Archive) {
				icon = <IconObject size={48} object={{ layout: I.ObjectLayout.Page, iconEmoji: ':wastebasket:' }} />;
				showMenu = false;
			} else 
			if (layout == I.ObjectLayout.Task) {
				cn.push('isTask');
				icon = <IconObject size={20} object={object} canEdit={true} onCheckbox={(e: any) => { this.onCheckbox(e, object); }} />;
			} else {
				icon = <IconObject size={48} object={object} />;
			};

			if (showMenu) {
				btn = <Icon id={'button-' + item.id + '-more'} tooltip="Actions" className="more" onClick={(e: any) => { onMore(e, item); }} />;
			};

			return (
				<div 
					id={'item-' + item.id} 
					className={cn.join(' ')} 
					onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
					onMouseLeave={(e: any) => { this.onMouseLeave(e, item); }}
				>
					{icon}
					<div className="name">{name}</div>
					<div className="type">{objectType ? objectType.name : ''}</div>
					{btn}
					<div className="click" onClick={(e: any) => { onSelect(e, item); }} onContextMenu={(e: any) => { 
						if (showMenu) {
							onMore(e, item); 
						};
					}} />
				</div>
			);
		});
		
		const List = SortableContainer((item: any) => {
			return (
				<React.Fragment>
					{item.list.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} />
					))}
				</React.Fragment>
			);
		});
		
		return (
			<div>
				<List 
					axis="xy" 
					transitionDuration={150}
					distance={10}
					list={children} 
					helperClass="isDragging"
					getContainer={helperContainer}
					helperContainer={helperContainer} 
					onSortEnd={this.onSortEnd} 
				/>
			</div>
		);
	};

	onCheckbox (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		DataUtil.pageSetDone(item.id, !item.done);
	};
	
	onSortEnd (result: any) {
		const { onSortEnd } = this.props;
		onSortEnd(result);
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
	
};

export default ListIndex;