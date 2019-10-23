import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
	viewType: I.ViewType;
};

@inject('commonStore')
@observer
class Buttons extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onMenu = this.onMenu.bind(this);
	};

	render () {
		const { commonStore, viewType } = this.props;
		
		const items: any[] = [
			{ id: 'property', name: 'Property', menu: 'propertyList' },
			{ id: 'filter', name: 'Filter', menu: 'filter' },
			{ id: 'sort', name: 'Sort', menu: 'sort' },
			{ id: 'view', className: 'view c' + viewType, arrow: true, menu: 'view' },
			{ id: 'more', menu: 'more' }
		];
		
		const Item = (item: any) => {
			let cn = [ 'item', item.id, String(item.className || '') ];
			if (commonStore.menuIsOpen(item.menu)) {
				cn.push('active');
			};
			
			return (
				<div id={'button-' + item.id} className={cn.join(' ')} onClick={(e: any) => { this.onMenu(e, item.id, item.menu); }}>
					<Icon className={cn.join(' ')} />
					{item.name ? <div className="name">{item.name}</div> : ''}
					{item.arrow ? <Icon className="arrow" /> : ''}
				</div>
			);
		};
		
		return (
			<div className="buttons">
				<div className="side left">
					<div className="item">
						<Icon className="plus" />
						<div className="name">New</div>
					</div>
				</div>
				<div className="side right">
					{items.map((item: any, i: number) => (
						<Item key={item.id} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	onMenu (e: any, id: string, menu: string) {
		const { commonStore, viewType } = this.props;
		
		commonStore.menuOpen(menu, { 
			element: 'button-' + id,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				viewType: viewType
			}
		});
	};

};

export default Buttons;