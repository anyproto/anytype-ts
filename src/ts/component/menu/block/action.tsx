import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input } from 'ts/component';
import { I, dispatcher } from 'ts/lib';
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
	
	refSearch: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
	};
	
	/*
	Red
Purple
Violet
Blue
Light Blue
Aquamarine
Green

Highlight colors
White
Cream
Banana
Peach
Rose
Lavender
Lilac
Sky
Coral
Mint
Stone
	*/

	render () {
		const sections = [
			{ 
				children: [
					{ id: 'turn', icon: 'turn', name: 'Turn into', arrow: true },
					{ id: 'color', icon: 'color', name: 'Change color', arrow: true },
				] 
			},
			{ 
				children: [
					{ id: 'comment', icon: 'comment', name: 'Comment' },
				]
			},
			{ 
				children: [
					{ id: 'move', icon: 'move', name: 'Move to' },
					{ id: 'copy', icon: 'copy', name: 'Duplicate' },
					{ id: 'remove', icon: 'remove', name: 'Delete' },
				]	
			},
		];
		
		const Section = (item: any) => (
			<div className="section">
				{item.children.map((action: any, i: number) => {
					return <Item key={i} {...action} />;
				})}
			</div>
		);
		
		const Item = (item: any) => (
			<div id={'block-action-item-' + item.id} className="item" onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
				{item.icon ? <Icon className={item.icon} /> : ''}
				<div className="name">{item.name}</div>
				{item.arrow ? <Icon className="arrow" /> : ''}
			</div>
		);
		
		return (
			<div>
				<Input ref={(ref: any) => { this.refSearch = ref; }} placeHolder="Search actions..." />
				{sections.map((section: any, i: number) => {
					return <Section key={i} {...section} />;
				})}
			</div>
		);
	};
	
	onOver (e: any, item: any) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onSelect, blockId, rootId } = data;
		
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
		
		window.setTimeout(() => {
			switch (item.id) {
				case 'turn':
					menuParam.data.onSelect = (style: I.TextStyle) => {
						let request: any = {
							contextId: rootId,
							blockId: blockId,
							style: style,
						};
						dispatcher.call('blockSetTextStyle', request, (errorCode: any, message: any) => {});
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
		const { commonStore, blockStore } = this.props;
		const { root } = blockStore;
		
		switch (item.id) {
			case 'move':
				commonStore.menuClose(this.props.id);
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
				commonStore.menuClose(this.props.id);
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'copy', 
						rootId: root,
						onConfirm: (id: string) => {
							console.log('Move', id);
						},
					}, 
				});
				break;
				
			case 'remove':
				break;
		};
	};

};

export default MenuBlockAction;