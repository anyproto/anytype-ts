import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockDataview {
	commonStore?: any;
	view: string;
	viewType: I.ViewType;
	onView(e: any, id: string): void;
};

@inject('commonStore')
@observer
class Controls extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onButton = this.onButton.bind(this);
	};

	render () {
		const { commonStore, view, viewType, content, onView } = this.props;
		const { views } = content;
		
		const buttons: any[] = [
			{ 
				id: 'property', name: 'Property', menu: 'dataviewPropertyList', 
				active: commonStore.menuIsOpen('dataviewPropertyList') 
			},
			{ 
				id: 'filter', name: 'Filter', menu: 'dataviewFilter', 
				active: commonStore.menuIsOpen('dataviewFilter') 
			},
			{ 
				id: 'sort', name: 'Sort', menu: 'dataviewSort', 
				active: commonStore.menuIsOpen('dataviewSort') 
			},
			{ 
				id: 'view', className: 'view c' + viewType, arrow: true, menu: 'view', 
				active: commonStore.menuIsOpen('dataviewView') 
			},
			{ 
				id: 'more', menu: 'more', active: commonStore.menuIsOpen('dataviewMore') 
			}
		];
		
		const ViewItem = (item: any) => (
			<div className={'item ' + (item.active ? 'active' : '')} onClick={(e: any) => { onView(e, item.id); }}>
				{item.name}
			</div>
		);
		
		const ButtonItem = (item: any) => {
			let cn = [ 'item', item.id, String(item.className || '') ];
			
			if (item.active) {
				cn.push('active');
			};
			
			return (
				<div id={'button-' + item.id} className={cn.join(' ')} onClick={(e: any) => { this.onButton(e, item.id, item.menu); }}>
					<Icon className={cn.join(' ')} />
					{item.name ? <div className="name">{item.name}</div> : ''}
					{item.arrow ? <Icon className="arrow" /> : ''}
				</div>
			);
		};
		
		return (
			<div className="controls">
				<div className="views">
					{views.map((item: I.View, i: number) => (
						<ViewItem key={i} {...item} active={item.id == view} />
					))}
					<div className="item">
						<Icon className="plus dark" />
					</div>
				</div>
				
				<div className="buttons">
					<div className="side left">
						<div className="item">
							<Icon className="plus" />
							<div className="name">New</div>
						</div>
					</div>
					<div className="side right">
						{buttons.map((item: any, i: number) => (
							<ButtonItem key={item.id} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};
	
	onButton (e: any, id: string, menu: string) {
		const { commonStore, view, viewType, content } = this.props;
		const { properties, views } = content;
		const viewItem = views.find((item: any) => { return item.id == view; });
		
		let data: any = {};
		
		switch (menu) {
			case 'dataviewView':
				data.viewType = viewType;
				break;
				
			case 'dataviewSort':
				data.sorts = viewItem.sorts;
				data.properties = properties;
				break;
				
			case 'dataviewFilter':
				data.filters = viewItem.filters;
				data.properties = properties;
				break;
				
			case 'dataviewPropertyList':
				data.properties = properties;
				break;
		};
		
		commonStore.menuOpen(menu, { 
			element: 'button-' + id,
			offsetY: 4,
			light: true,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: data
		});
	};

};

export default Controls;