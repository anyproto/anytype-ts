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
				id: 'property', name: 'Property', menu: 'propertyList', 
				active: commonStore.menuIsOpen('propertyList') 
			},
			{ 
				id: 'filter', name: 'Filter', menu: 'filter', 
				active: commonStore.menuIsOpen('filter') 
			},
			{ 
				id: 'sort', name: 'Sort', menu: 'sort', 
				active: commonStore.menuIsOpen('sort') 
			},
			{ 
				id: 'view', className: 'view c' + viewType, arrow: true, menu: 'view', 
				active: commonStore.menuIsOpen('view') 
			},
			{ 
				id: 'more', menu: 'more', active: commonStore.menuIsOpen('more') 
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
		const { commonStore, viewType, content } = this.props;
		const { properties } = content;
		
		let data: any = {};
		
		switch (menu) {
			case 'view':
				data.viewType = viewType;
				break;
				
			case 'sort':
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