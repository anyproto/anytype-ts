import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input } from 'ts/component';
import { I, Util, dispatcher, focus } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
	blockStore?: any;
};

const $ = require('jquery');

@inject('commonStore')
@inject('blockStore')
@observer
class MenuBlockMore extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { commonStore, blockStore, param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });

		if (!block) {
			return null;
		};
		
		const { content } = block;
		const { style } = content;
		
		const actions = [
			{ id: 'move', icon: 'move', name: 'Move to' },
			{ id: 'copy', icon: 'copy', name: 'Duplicate' },
			{ id: 'remove', icon: 'remove', name: 'Delete' },
		];
		
		const Item = (item: any) => (
			<div id={'block-action-item-' + item.id} className="item" onClick={(e: any) => { this.onClick(e, item); }}>
				{item.icon ? <Icon className={item.icon} /> : ''}
				<div className="name">{item.name}</div>
			</div>
		);
		
		return (
			<div>
				{actions.map((action: any, i: number) => {
					return <Item key={i} {...action} />;
				})}
			</div>
		);
	};
	
	onClick (e: any, item: any) {
		const { commonStore, blockStore, param } = this.props;
		const { data } = param;
		const { blockId, rootId, onSelect } = data;
		const { blocks, root } = blockStore;
		const block = blocks[rootId].find((it: I.Block) => { return it.id == blockId; });
		const length = block.content.text.length;
		
		commonStore.menuClose(this.props.id);
		if (onSelect) {
			onSelect(item);
		};
		
		switch (item.id) {
			case 'move':
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'move', 
						rootId: root,
						onConfirm: (id: string) => {
							console.log('Move', id);
						},
					}, 
				});
				break;
				
			case 'copy':
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'copy', 
						rootId: root,
						onConfirm: (id: string) => {
							let request = {
								contextId: rootId,
								blockId: blockId,
								targetId: blockId,
								position: I.BlockPosition.After,
							};
							
							dispatcher.call('blockDuplicate', request, (errorCode: any, message: any) => {
								focus.set(message.blockId, { from: length, to: length });
								focus.apply();
							});
						},
					}, 
				});
				break;
				
			case 'remove':
				let request: any = {
					contextId: rootId,
					targets: [
						{ blockId: blockId },
					],
				};
				dispatcher.call('blockUnlink', request, (errorCode: any, message: any) => {});
				break;
		};
	};

};

export default MenuBlockMore;