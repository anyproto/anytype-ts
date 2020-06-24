import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { C } from 'ts/lib';

interface Props {
	data: any[];
	view: I.View;
	block: I.Block;
	rootId: string;
	readOnly: boolean;
	getData(viewId: string, offset: number): void;
};

interface State {
	page: number;
};

const Constant = require('json/constant.json');

@observer
class Controls extends React.Component<Props, State> {

	state = {
		page: 0,
	};

	constructor (props: any) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onViewAdd = this.onViewAdd.bind(this);
	};

	render () {
		const { getData, block, view, readOnly } = this.props;
		const { content } = block;
		const { views, viewId } = content;
		const { page } = this.state;
		const limit = Constant.limit.dataview.views;

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
				id: 'more', menu: 'dataviewMore', active: commonStore.menuIsOpen('dataviewMore') 
			}
		];
		
		const ViewItem = (item: any) => (
			<div id={'item-' + item.id} className={'item ' + (item.active ? 'active' : '')} onClick={(e: any) => { getData(item.id, 0); }}>
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
					{views.slice(page * limit, (page + 1) * limit).map((item: I.View, i: number) => (
						<ViewItem key={i} {...item} active={item.id == viewId} />
					))}
					<div className="item">
						<Icon className="plus" onClick={this.onViewAdd} />
					</div>
					<div className="item">
						<Icon className={[ 'back', (page == 0 ? 'disabled' : '') ].join(' ')} onClick={(e: any) => { this.onArrow(-1); }} />
						<Icon className={[ 'forward', (page == this.getMaxPage() ? 'disabled' : '') ].join(' ')} onClick={(e: any) => { this.onArrow(1); }} />
					</div>
				</div>
				
				<div className="buttons">
					<div className="side left">
						{!readOnly ? (
							<div className="item">
								<Icon className="plus" />
								<div className="name">New</div>
							</div>
						) : ''}
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
		const { rootId, block, data, view, readOnly, getData } = this.props;

		commonStore.menuOpen(menu, { 
			element: '#button-' + id,
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				readOnly: readOnly,
				rootId: rootId,
				blockId: block.id, 
				view: view,
				data: data,
			},
		});
	};

	onViewAdd (e: any) {
		const { rootId, block } = this.props;

		commonStore.popupOpen('prompt', {
			data: {
				value: '',
				placeHolder: 'View name',
				maxLength: Constant.limit.dataview.viewName,
				onChange: (value: string) => {
					C.BlockCreateDataviewView(rootId, block.id, { name: value }, (message: any) => {
						this.setState({ page: this.getMaxPage() });
					});
				},
			},
		});
	};

	onArrow (dir: number) {
		let { page } = this.state;

		page += dir;
		page = Math.max(0, page);
		page = Math.min(this.getMaxPage(), page);

		this.setState({ page: page });
	};

	getMaxPage () {
		const { block } = this.props;
		const { content } = block;
		const { views } = content;
		const limit = Constant.limit.dataview.views;

		return Math.ceil(views.length / limit) - 1;
	};

};

export default Controls;