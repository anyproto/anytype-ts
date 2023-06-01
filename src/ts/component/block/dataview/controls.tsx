import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { Icon, Button } from 'Component';
import { C, I, Util, analytics, Relation, Dataview, keyboard, translate } from 'Lib';
import { menuStore, dbStore, blockStore } from 'Store';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';

const Controls = observer(class Controls extends React.Component<I.ViewComponent> {

	_isMounted = false;
	node: any = null;

	constructor (props: I.ViewComponent) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onViewAdd = this.onViewAdd.bind(this);
	};

	render () {
		const { className, rootId, block, getView, onRecordAdd, isInline } = this.props;
		const views = dbStore.getViews(rootId, block.id);
		const view = getView();
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter(it => dbStore.getRelationByKey(it.relationKey));
		const filterCnt = filters.length;
		const allowedView = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'dataviewControls' ];
		const isAllowedObject = this.props.isAllowedObject();

		if (className) {
			cn.push(className);
		};

		if (isInline) {
			cn.push('isInline');
		};

		const buttons = [
			{ id: 'filter', text: 'Filters', menu: 'dataviewFilterList', on: filterCnt > 0 },
			{ id: 'sort', text: 'Sorts', menu: 'dataviewSort', on: sortCnt > 0 },
			{ id: 'settings', text: 'Settings', menu: 'dataviewRelationList' },
		];

		const ButtonItem = (item: any) => {
			const elementId = `button-${block.id}-${item.id}`;
			const cn = [ `btn-${item.id}` ];

			if (item.on) {
				cn.push('on');
			};

			return (
				<Icon 
					id={elementId} 
					className={cn.join(' ')}
					tooltip={item.text}
					onClick={e => this.onButton(e, '#' + elementId, item.menu)}
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
			<div
				ref={node => this.node = node}
				id="dataviewControls"
				className={cn.join(' ')}
			>
				<div className="sides">
					<div id="sideLeft" className="side left">
						<div 
							id="view-selector"
							className="viewSelect viewItem select"
							onClick={(e: any) => { this.onButton(e, `#block-${block.id} #view-selector`, 'dataviewViewList'); }}
							onContextMenu={(e: any) => { this.onViewEdit(e, `#block-${block.id} #view-selector`, view); }}
						>
							<div className="name">{view.name}</div>
							<Icon className="arrow dark" />
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
							helperContainer={() => $(`#block-${block.id} .views`).get(0)}
						/>
					</div>

					<div id="sideRight" className="side right">
						{buttons.map((item: any, i: number) => (
							<ButtonItem key={item.id} {...item} />
						))}	
						{isAllowedObject ? (
							<Button 
								id={`button-${block.id}-add-record`}
								className="addRecord c28" 
								tooltip="Create new object" 
								text="New" 
								onClick={(e: any) => onRecordAdd(e, -1)} 
							/>
 						) : ''}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onButton (e: any, element: string, component: string) {
		if (!component) {
			return;
		};

		const { rootId, block, readonly, loadData, getView, getSources, getVisibleRelations, getTarget, isInline, isCollection } = this.props;
		const view = getView();
		const obj = $(element);
		const node = $(this.node);

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
				readonly,
				rootId,
				blockId: block.id,
				loadData,
				getView,
				getSources,
				getVisibleRelations,
				getTarget,
				isInline,
				isCollection,
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

		const { rootId, block, getSources, getTarget, isInline } = this.props;
		const sources = getSources();
		const object = getTarget();
		const newView = {
			name: translate(`viewName${I.ViewType.Grid}`),
			type: I.ViewType.Grid,
			groupRelationKey: Relation.getGroupOption(rootId, block.id, '')?.id,
			cardSize: I.CardSize.Medium,
		};

		C.BlockDataviewViewCreate(rootId, block.id, newView, sources, (message: any) => {
			if (message.error.code) {
				return;
			};

			const view = dbStore.getView(rootId, block.id, message.viewId);
			if (!view) {
				return;
			};

			this.resize();

			const node = $(this.node);
			const sideLeft = node.find('#sideLeft');
			const element = sideLeft.hasClass('small') ? '#view-selector' : `#views #view-item-${block.id}-${message.viewId}`;

			this.onViewEdit(e, element, view);

			analytics.event('AddView', {
				type: view.type,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	onViewSet (item: any) {
		const { rootId, block, isInline, getTarget } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const object = getTarget();

		dbStore.metaSet(subId, '', { viewId: item.id });

		analytics.event('SwitchView', {
			type: item.type,
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	onViewEdit (e: any, element: string, item: any) {
		e.stopPropagation();

		const { rootId, block, getView, loadData, getSources, isInline, isCollection, getTarget } = this.props;
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const view = dbStore.getView(rootId, block.id, item.id);

		this.onViewSet(view);

		window.setTimeout(() => {
			menuStore.open('dataviewViewEdit', { 
				element,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				data: {
					rootId,
					blockId: block.id,
					readonly: !allowed,
					view: observable.box(view),
					isInline,
					isCollection,
					getTarget,
					getView,
					loadData,
					getSources,
					onSave: () => { this.forceUpdate(); },
				}
			});
		}, 50);
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { rootId, block, isInline, getTarget } = this.props;
		const object = getTarget();
		const views = dbStore.getViews(rootId, block.id);
		const view = views[oldIndex];
		const ids = arrayMove(views.map(it => it.id), oldIndex, newIndex);

		dbStore.viewsSort(rootId, block.id, ids);

		C.BlockDataviewViewSetPosition(rootId, block.id, view.id, newIndex, () => {
			analytics.event('RepositionView', {
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});

		keyboard.disableSelection(false);
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { isPopup, isInline } = this.props;
		const node = $(this.node);
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

		if (left + width - offset - sw + 50 >= container.width()) {
			sideLeft.addClass('small');
		};

		if (isInline && (width >= node.outerWidth())) {
			sideLeft.addClass('small');
		};
	};

});

export default Controls;