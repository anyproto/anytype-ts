import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { C, I, Util, analytics } from 'ts/lib';
import { menuStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';

interface Props extends I.ViewComponent {
	className?: string;
};

interface State {
	page: number;
};

const $ = require('jquery');

const Controls = observer(class Controls extends React.Component<Props, State> {

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
		const { className, rootId, block, getView, readonly, onRowAdd } = this.props;
		const views = dbStore.getViews(rootId, block.id);
		const view = getView();
		const { viewId } = dbStore.getMeta(rootId, block.id);
		const { page } = this.state;
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter((it: any) => {
			return dbStore.getRelation(rootId, block.id, it.relationKey);
		});
		const filterCnt = filters.length;
		const allowedObject = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const allowedView = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'dataviewControls', (className ? className : '') ];

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
				onClick={(e: any) => { this.onViewSet(item); }} 
				onContextMenu={(e: any) => { this.onViewEdit(e, item); }}
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

				{allowedView ? <Icon id="button-view-add" className="plus" onClick={this.onViewAdd} /> : ''}
			</div>
		));
		
		return (
			<div className={cn.join(' ')}>
				<div className="sides">
					<div id="sideLeft" className="side left">
						<div className="first">
							<div 
								id={'view-item-' + view.id} 
								className="viewItem active" 
								onClick={(e: any) => { this.onButton(e, `view-item-${view.id}`, 'dataviewViewList'); }} 
								onContextMenu={(e: any) => { this.onViewEdit(e, view); }}
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
						{!readonly && allowedObject ? <Icon className="plus" tooltip="New object" onClick={(e: any) => { onRowAdd(e, -1); }} /> : ''}
					</div>
				</div>

				<div className="line" />
			</div>
		);
	};

	componentDidMount () {
		this.resize();
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
				readonly: readonly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
				view: getView(),
			},
		});
	};

	onViewAdd () {
		const { rootId, block, getView, getData } = this.props;
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
				getData: getData,
				getView: getView,
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

	onViewSet (item: any) {
		this.props.getData(item.id, 0);
		analytics.event('BlockDataviewViewSet', { type: item.type });
	};

	onViewEdit (e: any, item: any) {
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
		const { rootId, block } = this.props;

		let views = dbStore.getViews(rootId, block.id);
		let view = views[oldIndex];
		let ids = arrayMove(views.map((it: any) => { return it.id; }), oldIndex, newIndex);

		dbStore.viewsSort(rootId, block.id, ids);
		C.BlockDataviewViewSetPosition(rootId, block.id, view.id, newIndex);
	};

	resize () {
		const node = $(ReactDOM.findDOMNode(this));
		const views = node.find('#views');
		const sideLeft = node.find('#sideLeft');

		menuStore.closeAll([ 'dataviewViewList', 'dataviewViewEdit' ]);
		views.width() > sideLeft.outerWidth() ? sideLeft.addClass('small') : sideLeft.removeClass('small');
	};

});

export default Controls;