import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { C } from '../../../lib';

interface Props {
	data: any[];
	view: I.View;
	block: I.Block;
	rootId: string;
	onView(e: any, id: string): void;
};

@observer
class Controls extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onViewAdd = this.onViewAdd.bind(this);
	};

	render () {
		const { onView, block, view } = this.props;
		const { content } = block;
		const { views } = content;

		const buttons: any[] = [
			{ 
				id: 'relation', name: 'Relations', menu: 'dataviewRelationList', 
				active: commonStore.menuIsOpen('dataviewRelationList') 
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
				id: 'view', className: 'c' + view.type, arrow: true, menu: 'dataviewView', 
				active: commonStore.menuIsOpen('dataviewView') 
			},
			{ 
				id: 'more', menu: 'more', active: commonStore.menuIsOpen('dataviewMore') 
			}
		];
		
		const ViewItem = (item: any) => (
			<div id={'item-' + item.id} className={'item ' + (item.active ? 'active' : '')} onClick={(e: any) => { onView(e, item.id); }}>
				{item.name}
			</div>
		);
		
		const ButtonItem = (item: any) => {
			let cn = [ item.id, String(item.className || '') ];
			
			if (item.active) {
				cn.push('active');
			};
			
			return (
				<div id={'button-' + item.id} className={[ 'item' ].concat(cn).join(' ')} onClick={(e: any) => { this.onButton(e, item.id, item.menu); }}>
					<Icon className={cn.join(' ')} />
					{item.name ? <div className="name">{item.name}</div> : ''}
					{item.arrow ? <Icon className="arrow" /> : ''}
				</div>
			);
		};
		
		return (
			<div className="dataviewControls">
				<div className="views">
					{views.map((item: I.View, i: number) => (
						<ViewItem key={i} {...item} active={item.id == view.id} />
					))}
					<div className="item">
						<Icon className="plus" onClick={this.onViewAdd} />
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
		const { rootId, block, data, view } = this.props;

		commonStore.menuOpen(menu, { 
			element: '#button-' + id,
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: rootId,
				blockId: block.id, 
				view: view,
				data: data,
			},
		});
	};

	onViewAdd (e: any) {
		const { rootId, block } = this.props;
		C.BlockCreateDataviewView(rootId, block.id, {});
	};

};

export default Controls;