import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { menuStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

interface Props extends I.ViewComponent {};

interface State {
	page: number;
};

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
		this.onViewAdd = this.onViewAdd.bind(this);
	};

	render () {
		const { getData, rootId, block, getView, readonly, onRowAdd } = this.props;
		const views = dbStore.getViews(rootId, block.id);
		const view = getView();
		const { viewId } = dbStore.getMeta(rootId, block.id);
		const { page } = this.state;
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
					onClick={(e: any) => { this.onButton(e, `button-${item.id}`, item.menu); }}
				/>
			);
		};

		const ViewItem = SortableElement((item: any) => (
			<div 
				id={'view-item-' + item.id} 
				className={'viewItem ' + (item.active ? 'active' : '')} 
				onClick={(e: any) => { getData(item.id, 0); }} 
				onContextMenu={(e: any) => { this.onView(e, item); }}
			>
				{item.name}
			</div>
		));

		const Views = SortableContainer((item: any) => (
			<div id="views" className="views">
				{views.map((item: I.View, i: number) => (
					<ViewItem 
						key={i} 
						{...item} 
						active={item.id == viewId} 
						index={i} 
					/>
				))}

				<Icon id="button-view-add" className="plus" onClick={this.onViewAdd} />
			</div>
		));
		
		return (
			<div className="dataviewControls">
				<div className="buttons">
					<div id="sideLeft" className="side left">
						<div className="first">
							<div 
								id={'view-item-' + view.id} 
								className="viewItem active" 
								onClick={(e: any) => { this.onButton(e, `view-item-${view.id}`, 'dataviewViewList'); }} 
								onContextMenu={(e: any) => { this.onView(e, view); }}
							>
								{view.name}

								<Icon className="arrow" />
							</div>
						</div>

						<Views 
							axis="x" 
							lockAxis="x"
							lockToContainerEdges={true}
							transitionDuration={150}
							distance={10}
							onSortEnd={this.onSortEnd}
							helperClass="isDragging"
							helperContainer={() => { return $(`#block-${block.id} .views`).get(0); }}
						/>
					</div>

					<div id="sideRight" className="side right">
						{buttons.map((item: any, i: number) => (
							<ButtonItem key={item.id} {...item} />
						))}	
						{!readonly && allowed ? <Icon className="plus" tooltip="New object" onClick={(e: any) => { onRowAdd(e, -1); }} /> : ''}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		$(window).unbind('resize.controls').on('resize.controls', () => { this.resize(); });
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		$(window).unbind('resize.controls');
	};
	
	onButton (e: any, id: string, menu: string) {
		if (!menu) {
			return;
		};

		const { rootId, block, readonly, getData, getView } = this.props;
		const allowed = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.Relation ])

		let tabs = [];
		if (id == 'button-manager') {
			tabs = [
				{ id: 'relation', name: 'Relations', component: 'dataviewRelationList' },
				{ id: 'filter', name: 'Filters', component: 'dataviewFilterList' },
				{ id: 'sort', name: 'Sorts', component: 'dataviewSort' },
				{ id: 'view', name: 'View', component: 'dataviewViewEdit' },
			];
		};

		menuStore.open(menu, { 
			element: `#${id}`,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			tabs: tabs,
			data: {
				readonly: readonly || !allowed,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
				view: getView(),
			},
		});
	};

	onViewAdd () {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const relations = Util.objectCopy(view.relations);
		const filters: I.Filter[] = [];

		for (let relation of relations) {
			if (relation.isHidden || !relation.isVisible) {
				continue;
			};

			filters.push({
				relationKey: relation.relationKey,
				operator: I.FilterOperator.And,
				condition: I.FilterCondition.None,
				value: null,
			});
		};

		menuStore.open('dataviewViewEdit', {
			element: `#button-view-add`,
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				blockId: block.id,
				view: { 
					type: I.ViewType.Grid,
					relations: relations,
					filters: filters,
				},
				onSave: () => {
					this.forceUpdate();
				},
			},
		});
	};

	onView (e: any, item: any) {
		e.stopPropagation();

		const { rootId, block, getView } = this.props;
		const allowed = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.View ]);

		menuStore.open('dataviewViewEdit', { 
			element: $(e.currentTarget),
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				blockId: block.id,
				readonly: !allowed,
				view: item,
				getView: getView,
				onSave: () => { this.forceUpdate(); },
			}
		});
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
	};

	resize () {
		const node = $(ReactDOM.findDOMNode(this));
		const views = node.find('#views');
		const sideLeft = node.find('#sideLeft');

		menuStore.closeAll([ 'dataviewViewList', 'dataviewViewEdit' ]);
		views.width() > sideLeft.width() ? sideLeft.addClass('small') : sideLeft.removeClass('small');
	};

};

export default Controls;