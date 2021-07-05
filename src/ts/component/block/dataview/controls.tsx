import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { menuStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

interface Props extends I.ViewComponent {};

interface State {
	page: number;
};

const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class Controls extends React.Component<Props, State> {

	state = {
		page: 0,
	};

	constructor (props: any) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};

	render () {
		const { getData, rootId, block, getView, readOnly, onRowAdd } = this.props;
		const views = dbStore.getViews(rootId, block.id);
		const view = getView();
		const { viewId } = dbStore.getMeta(rootId, block.id);
		const { page } = this.state;
		const limit = Constant.limit.dataview.views;
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter((it: any) => {
			return dbStore.getRelation(rootId, block.id, it.relationKey);
		});
		const filterCnt = filters.length;
		const allowed = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.Object ]);

		const buttons: any[] = [
			//{ id: 'search', name: 'Search', menu: '' },
			{ id: 'manager', name: 'Customize view', menu: 'dataviewRelationList', on: (filterCnt > 0 || sortCnt > 0) },
		];

		const ButtonItem = (item: any) => {
			let cn = [ item.id, (item.on ? 'on' : '') ];
			return (
				<Icon 
					id={'button-' + item.id} 
					className={cn.join(' ')}
					tooltip={item.name}
					onClick={(e: any) => { this.onButton(e, item.id, item.menu); }}
				/>
			);
		};

		const ViewItem = SortableElement((item: any) => (
			<div 
				id={'view-item-' + item.id} 
				className={'item ' + (item.active ? 'active' : '')} 
				onClick={(e: any) => { getData(item.id, 0); }} 
				onContextMenu={(e: any) => { this.onView(e, item); }}
			>
				{item.name}
			</div>
		));

		const Views = SortableContainer((item: any) => (
			<div className="views">
				{views.slice(page * limit, (page + 1) * limit).map((item: I.View, i: number) => (
					<ViewItem key={i} {...item} active={item.id == viewId} index={i} />
				))}

				<div id="button-more" className="item btn" onClick={(e: any) => { this.onButton(e, 'more', 'dataviewViewList'); }}>
					<Icon className="more" tooltip="Views" />
				</div>

				{/*<div className="item dn">
					<Icon className={[ 'back', (page == 0 ? 'disabled' : '') ].join(' ')} onClick={(e: any) => { this.onArrow(-1); }} />
					<Icon className={[ 'forward', (page == this.getMaxPage() ? 'disabled' : '') ].join(' ')} onClick={(e: any) => { this.onArrow(1); }} />
				</div>*/}
			</div>
		));
		
		return (
			<div className="dataviewControls">
				<div className="buttons">
					<div className="side left">
						<Views 
							axis="x" 
							lockAxis="x"
							lockToContainerEdges={true}
							transitionDuration={150}
							distance={10}
							onSortEnd={this.onSortEnd}
							helperClass="isDragging"
							helperContainer={() => { return $('#block-' + block.id + ' .views').get(0); }}
						/>
					</div>

					<div className="side right">
						{buttons.map((item: any, i: number) => (
							<ButtonItem key={item.id} {...item} />
						))}	
						{!readOnly && allowed ? <Icon className="plus" tooltip="New object" onClick={onRowAdd} /> : ''}
					</div>
				</div>
			</div>
		);
	};
	
	onButton (e: any, id: string, menu: string) {
		if (!menu) {
			return;
		};

		const { rootId, block, readOnly, getData, getView } = this.props;
		const allowed = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.Relation ])

		let tabs = [];
		if (id == 'manager') {
			tabs = [
				{ id: 'relation', name: 'Relations', component: 'dataviewRelationList' },
				{ id: 'filter', name: 'Filters', component: 'dataviewFilterList' },
				{ id: 'sort', name: 'Sorts', component: 'dataviewSort' },
				{ id: 'view', name: 'View', component: 'dataviewViewEdit' },
			];
		};

		menuStore.open(menu, { 
			element: `#button-${id}`,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			tabs: tabs,
			data: {
				readOnly: readOnly || !allowed,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
				view: getView(),
			},
		});
	};

	onView (e: any, item: any) {
		e.stopPropagation();

		const { rootId, block } = this.props;
		const allowed = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.View ]);

		menuStore.open('dataviewViewEdit', { 
			element: `#view-item-${item.id}`,
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				blockId: block.id,
				readOnly: !allowed,
				view: item,
				onSave: () => { this.forceUpdate(); },
			}
		});
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
	};

	onArrow (dir: number) {
		let { page } = this.state;

		page += dir;
		page = Math.max(0, page);
		page = Math.min(this.getMaxPage(), page);

		this.setState({ page: page });
	};

	getMaxPage () {
		const { rootId, block } = this.props;
		const views = dbStore.getViews(rootId, block.id);
		const limit = Constant.limit.dataview.views;

		return Math.ceil(views.length / limit) - 1;
	};

};

export default Controls;