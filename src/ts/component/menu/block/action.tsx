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
class MenuBlockAction extends React.Component<Props, {}> {
	
	timeout: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onOver = this.onOver.bind(this);
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
		
		const sections = [
			{ 
				children: [
					{ id: 'turn', icon: 'turn', name: 'Turn into', arrow: true },
					{ id: 'color', icon: 'color', name: 'Change color', arrow: true },
					{ id: 'move', icon: 'move', name: 'Move to' },
					{ id: 'copy', icon: 'copy', name: 'Duplicate' },
					{ id: 'remove', icon: 'remove', name: 'Delete' },
				] 
			},
			{ 
				children: [
					{ id: 'comment', icon: 'comment', name: 'Comment' },
				]
			}
		];
		
		let color = (
			<div className={[ 'inner' ].join(' ')}>A</div>
		);
		
		const Section = (item: any) => (
			<div className="section">
				{item.children.map((action: any, i: number) => {
					return <Item key={i} {...action} />;
				})}
			</div>
		);
		
		const Item = (item: any) => {
			let icon = item.icon;
			let inner = item.icon == 'color' ? color: null;
			if (icon == 'turn') {
				icon = Util.styleIcon(style);
			};
			
			return (
				<div id={'block-action-item-' + item.id} className="item" onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
					{item.icon ? <Icon className={icon} inner={inner} /> : ''}
					<div className="name">{item.name}</div>
					{item.arrow ? <Icon className="arrow" /> : ''}
				</div>
			);
		};
		
		return (
			<div>
				{sections.map((section: any, i: number) => {
					return <Section key={i} {...section} />;
				})}
			</div>
		);
	};
	
	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};
	
	onOver (e: any, item: any) {
		const { blockStore, commonStore, param } = this.props;
		const { data } = param;
		const { onSelect, blockId, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((it: I.Block) => { return it.id == blockId; });
		const length = block.content.text.length;
		
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#block-action-item-' + item.id);
		const offsetX = node.outerWidth();
		const offsetY = node.offset().top - el.offset().top;
		
		node.find('.item.active').removeClass('active');
		el.addClass('active');
		
		commonStore.menuClose('blockStyle');
		commonStore.menuClose('blockColor');
		
		if (!item.arrow) {
			return;
		};
		
		let menuParam: I.MenuParam = {
			element: 'block-action-item-' + item.id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: offsetY - 40,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {},
		};
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			switch (item.id) {
				case 'turn':
					menuParam.data.onSelect = (style: I.TextStyle) => {
						let request: any = {
							contextId: rootId,
							blockId: blockId,
							style: style,
						};
						dispatcher.call('blockSetTextStyle', request, (errorCode: any, message: any) => {
							focus.set(message.blockId, { from: length, to: length });
							focus.apply();
						});
						commonStore.menuClose(this.props.id);
					};
					
					commonStore.menuOpen('blockStyle', menuParam);
					break;
					
				case 'color':
					menuParam.data.onChangeText = (color: string) => {
						console.log('text', color);
					};
					menuParam.data.onChangeBg = (color: string) => {
						console.log('bg', color);
					};
					
					commonStore.menuOpen('blockColor', menuParam);
					break;
			};
		}, 250);
	};
	
	onClick (e: any, item: any) {
		const { commonStore, blockStore, param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const { blocks, root } = blockStore;
		const block = blocks[rootId].find((it: I.Block) => { return it.id == blockId; });
		const length = block.content.text.length;
		
		commonStore.menuClose(this.props.id);
		
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

export default MenuBlockAction;