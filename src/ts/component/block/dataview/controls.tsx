import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import $ from 'jquery';
import { Icon, Button } from 'Component';
import { C, I, Util, analytics, Relation, Dataview } from 'Lib';
import { menuStore, dbStore, blockStore } from 'Store';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';

interface Props extends I.ViewComponent {
	className?: string;
};

const Controls = observer(class Controls extends React.Component<Props, object> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onViewAdd = this.onViewAdd.bind(this);
	};

	render () {
		const { className, rootId, block, getView, readonly, onRecordAdd, isInline } = this.props;
		const views = dbStore.getViews(rootId, block.id);
		const view = getView();
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter(it => dbStore.getRelationByKey(it.relationKey));
		const filterCnt = filters.length;
		const allowedObject = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const allowedView = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'dataviewControls' ];

		if (className) {
			cn.push(className);
		};

		if (isInline) {
			cn.push('isInline');
		};

		const buttons: any[] = [
			{ id: 'filter', name: 'Filters', menu: 'dataviewFilterList', withTabs: false },
			{ id: 'sort', name: 'Sorts', menu: 'dataviewSort', withTabs: false },
			{ id: 'settings', name: 'Settings', menu: 'dataviewRelationList', withTabs: true },
		];

		const ButtonItem = (item: any) => {
			const elementId = `button-${block.id}-${item.id}`;
			return (
				<Icon 
					id={elementId} 
					className={item.id}
					tooltip={item.name}
					onClick={(e: any) => { this.onButton(e, '#' + elementId, item.menu, item.withTabs); }}
				/>
			);
		};

		const ViewItem = SortableElement((item: any) => {
			const elementId = `view-item-${block.id}-${item.id}`;
			return (
				<div 
					id={elementId} 
					className={'viewItem ' + (item.id == view.id ? 'active' : '')} 
					onClick={(e: any) => { this.onViewSet(item); }} 
					onContextMenu={(e: any) => { this.onViewEdit(e, '#views #' + elementId, item); }}
				>
					{item.name}
				</div>
			);
		});

		const Views = SortableContainer((item: any) => (
			<div id="views" className="views">
				{views.map((item: I.View, i: number) => (
					<ViewItem key={i} {...item} index={i} />
				))}
				{allowedView ? <Icon id={`button-${block.id}-view-add`} className="plus" tooltip="Create new view" onClick={this.onViewAdd} /> : ''}
			</div>
		));
		
		return (
			<div className={cn.join(' ')}>
				<div className="sides">
					<div id="sideLeft" className="side left">
						<div 
							id="view-selector"
							className="viewSelect select"
							onClick={(e: any) => { this.onButton(e, '#view-selector', 'dataviewViewList', false); }} 
							onContextMenu={(e: any) => { this.onViewEdit(e, '#view-selector', view); }}
						>
							<div className="name">{view.name}</div>
							<Icon className="arrow light" />
						</div>

						<Views 
							axis="x" 
							lockAxis="x"
							lockToContainerEdges={true}
							transitionDuration={150}
							distance={10}
							onSortStart={this.onSortStart}
							onSortEnd={this.onSortEnd}
							helperClass="isDragging"
							helperContainer={() => { return $(`#block-${block.id} .views`).get(0); }}
						/>
					</div>

					<div id="sideRight" className="side right">
						{buttons.map((item: any, i: number) => (
							<ButtonItem key={item.id} {...item} />
						))}	
						{!readonly && allowedObject ? (
							<Button 
								id={`button-${block.id}-add-record`}
								color="addRecord orange" 
								icon="plus-small" 
								className="c28" 
								tooltip="Create new object" 
								text="New" 
								onClick={(e: any) => { onRecordAdd(e, -1); }} 
							/>
 						) : ''}
					</div>
				</div>

				<div className="line" />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onButton (e: any, element: string, component: string, withTabs: boolean) {
		if (!component) {
			return;
		};

		const { rootId, block, readonly, getData, getView } = this.props;
		const view = getView();
		const obj = $(element);
		const node = $(ReactDOM.findDOMNode(this));

		const param: any = { 
			element,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			noFlipY: true,
			onOpen: () => {
				node.addClass('active');
				obj.addClass('active');
			},
			onClose: () => {
				node.removeClass('active');
				obj.removeClass('active');
			},
			data: {
				readonly: readonly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
				view: observable.box(view),
			},
		};

		param.getTabs = () => {
			let tabs: any[] = [];

			switch (component) {
				case 'dataviewViewList':
					break;

				case 'dataviewFilterList':
					tabs = [ { id: 'filter', name: 'Filters', component } ];
					break;

				case 'dataviewSort':
					tabs = [ { id: 'sort', name: 'Sorts', component } ];
					break;

				default:
					tabs = Dataview.getMenuTabs(rootId, block.id, view.id);
					break;
			};

			return tabs;
		};
		param.initialTab = param.getTabs().find(it => it.component == component)?.id;

		menuStore.open(component, param);
	};

	onViewAdd (e: any) {
		e.persist();

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

		const newView = {
			name: `New view`,
			type: I.ViewType.Grid,
			groupRelationKey: Relation.getGroupOption(rootId, block.id, '')?.id,
			filters,
			relations: [
				{ relationKey: 'name', isVisible: true }
			]
		};

		C.BlockDataviewViewCreate(rootId, block.id, newView, (message: any) => {
			if (message.error.code) {
				return;
			};

			const view = dbStore.getView(rootId, block.id, message.viewId);
			if (!view) {
				return;
			};

			this.onViewEdit(e, `#views #view-item-${block.id}-${message.viewId}`, view);
			analytics.event('AddView', { type: view.type });
		});
	};

	onViewSet (item: any) {
		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);

		dbStore.metaSet(subId, '', { viewId: item.id });
		analytics.event('SwitchView', { type: item.type });
	};

	onViewEdit (e: any, element: string, item: any) {
		e.stopPropagation();

		const { rootId, block, getView, getData } = this.props;
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const view = dbStore.getView(rootId, block.id, item.id);

		this.onViewSet(view);

		menuStore.open('dataviewViewEdit', { 
			element: element,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				rootId: rootId,
				blockId: block.id,
				readonly: !allowed,
				view: observable.box(view),
				getView: getView,
				getData: getData,
				onSave: () => { this.forceUpdate(); },
			}
		});
	};

	onSortStart () {
		const { dataset } = this.props;
		const { selection } = dataset;

		selection.preventSelect(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { rootId, block, dataset } = this.props;
		const { selection } = dataset;

		let views = dbStore.getViews(rootId, block.id);
		let view = views[oldIndex];
		let ids = arrayMove(views.map((it: any) => { return it.id; }), oldIndex, newIndex);

		dbStore.viewsSort(rootId, block.id, ids);
		C.BlockDataviewViewSetPosition(rootId, block.id, view.id, newIndex, () => {
			analytics.event('RepositionView');
		});

		selection.preventSelect(false);
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { isPopup, isInline } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const sideLeft = node.find('#sideLeft');
		const sideRight = node.find('#sideRight');
		const container = Util.getPageContainer(isPopup);
		const { left } = sideLeft.offset();
		const sidebar = $('#sidebar');

		sideLeft.removeClass('small');

		let width = sideLeft.outerWidth() + sideRight.outerWidth();
		let offset = 0;
		let sw = sidebar.outerWidth();

		if (isPopup) {
			offset = container.offset().left;
		};

		if (left + width - offset - sw >= container.width()) {
			sideLeft.addClass('small');
		};

		if (isInline && (width >= node.outerWidth())) {
			sideLeft.addClass('small');
		};
	};

});

export default Controls;