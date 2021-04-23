import * as React from 'react';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, Util, translate } from 'ts/lib';
import { menuStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { C } from 'ts/lib';
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
		const view = getView();
		const { content } = block;
		const { views } = content;
		const { viewId } = dbStore.getMeta(rootId, block.id);
		const { page } = this.state;
		const limit = Constant.limit.dataview.views;
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter((it: any) => {
			return dbStore.getRelation(rootId, block.id, it.relationKey);
		});
		const filterCnt = filters.length;

		const buttons: any[] = [
			{ id: 'search', name: 'Search', menu: '' },
			{ id: 'manager', name: 'Customize', menu: 'dataviewViewList', on: (filterCnt > 0 || sortCnt > 0) },
		];

		const inner = <div className="dot" />;

		const ButtonItem = (item: any) => {
			let cn = [ item.id, (item.on ? 'on' : '') ];
			return (
				<Icon 
					id={'button-' + item.id} 
					className={cn.join(' ')}
					inner={inner}
					tooltip={item.name}
					onClick={(e: any) => { this.onButton(e, item.id, item.menu); }}
				/>
			);
		};

		const ViewItem = SortableElement((item: any) => (
			<div id={'item-' + item.id} className={'item ' + (item.active ? 'active' : '')} onClick={(e: any) => { getData(item.id, 0); }}>
				{item.name}
			</div>
		));

		const Views = SortableContainer((item: any) => (
			<div className="views">
				{views.slice(page * limit, (page + 1) * limit).map((item: I.View, i: number) => (
					<ViewItem key={i} {...item} active={item.id == viewId} index={i} />
				))}

				<div id="button-more" className="item" onClick={(e: any) => { this.onButton(e, 'more', 'dataviewViewList'); }}>
					<Icon className="more" tooltip="Views" />
				</div>

				<div className="item dn">
					<Icon className={[ 'back', (page == 0 ? 'disabled' : '') ].join(' ')} onClick={(e: any) => { this.onArrow(-1); }} />
					<Icon className={[ 'forward', (page == this.getMaxPage() ? 'disabled' : '') ].join(' ')} onClick={(e: any) => { this.onArrow(1); }} />
				</div>
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
						{!readOnly ? (
							<Icon className="plus" tooltip="New row" onClick={onRowAdd} />
						) : ''}
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

		let tabs = [];
		if (id == 'manager') {
			tabs = [
				{ id: 'view', name: 'Views', component: 'dataviewViewList' },
				{ id: 'relation', name: 'Relations', component: 'dataviewRelationList' },
				{ id: 'filter', name: 'Filters', component: 'dataviewFilter' },
				{ id: 'sort', name: 'Sorts', component: 'dataviewSort' },
			];
		};

		menuStore.open(menu, { 
			element: `#button-${id}`,
			offsetY: 4,
			horizontal: I.MenuDirection.Center,
			tabs: tabs,
			data: {
				readOnly: readOnly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
			},
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
		const { block } = this.props;
		const { content } = block;
		const { views } = content;
		const limit = Constant.limit.dataview.views;

		return Math.ceil(views.length / limit) - 1;
	};

};

export default Controls;