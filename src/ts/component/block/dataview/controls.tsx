import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Button } from 'Component';
import { C, I, Util, analytics, Relation, Dataview } from 'Lib';
import { menuStore, dbStore, blockStore } from 'Store';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';

interface Props extends I.ViewComponent {
	className?: string;
};

const $ = require('jquery');

const Controls = observer(class Controls extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onViewAdd = this.onViewAdd.bind(this);
	};

	render () {
		const { className, rootId, block, getView, readonly, onRecordAdd } = this.props;
		const views = dbStore.getViews(rootId, block.id);
		const view = getView();
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter(it => dbStore.getRelationByKey(it.relationKey));
		const filterCnt = filters.length;
		const allowedObject = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const allowedView = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'dataviewControls', (className ? className : '') ];

		const buttons: any[] = [
			//{ id: 'search', name: 'Search', menu: '' },
			{ id: 'manager', name: 'Customize view', menu: 'dataviewRelationList' },
		];

		const ButtonItem = (item: any) => {
			return (
				<Icon 
					id={'button-' + item.id} 
					className={item.id}
					tooltip={item.name}
					onClick={(e: any) => { this.onButton(e, `button-${item.id}`, item.menu); }}
				/>
			);
		};

		const ViewItem = SortableElement((item: any) => (
			<div 
				id={'view-item-' + item.id} 
				className={'viewItem ' + (item.id == view.id ? 'active' : '')} 
				onClick={(e: any) => { this.onViewSet(item); }} 
				onContextMenu={(e: any) => { this.onViewEdit(e, '#views #view-item-' + item.id, item); }}
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
						index={i} 
					/>
				))}

				{allowedView ? <Icon id="button-view-add" className="plus" tooltip="Create new view" onClick={this.onViewAdd} /> : ''}
			</div>
		));
		
		return (
			<div className={cn.join(' ')}>
				<div className="sides">
					<div id="sideLeft" className="side left">
						<div 
							id={'view-item-' + view.id} 
							className="viewSelect select"
							onClick={(e: any) => { this.onButton(e, `view-item-${view.id}`, 'dataviewViewList'); }} 
							onContextMenu={(e: any) => { this.onViewEdit(e, '.first #view-item-' + view.id, view); }}
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
							helperContainer={() => { return $(`#block-${block.id} .views`).get(0); }}
						/>
					</div>

					<div id="sideRight" className="side right">
						{buttons.map((item: any, i: number) => (
							<ButtonItem key={item.id} {...item} />
						))}	
						{!readonly && allowedObject ? <Button color="orange" icon="plus-small" className="c28" tooltip="New object" text="New" onClick={(e: any) => { onRecordAdd(e, -1); }} /> : ''}
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
	
	onButton (e: any, id: string, menu: string) {
		if (!menu) {
			return;
		};

		const { rootId, block, readonly, getData, getView } = this.props;
		const view = getView();

		const param: any = { 
			element: `#${id}`,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			noFlipY: true,
			data: {
				readonly: readonly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
				view: observable.box(view),
			},
		};

		if (id == 'button-manager') {
			param.getTabs = () => Dataview.getMenuTabs(rootId, block.id, view.id);
		};

		menuStore.open(menu, param);
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
			const view = dbStore.getView(rootId, block.id, message.viewId);
			
			this.onViewEdit(e, `#block-${block.id} #views #view-item-${message.viewId}`, view);
			analytics.event('AddView', { type: view.type });
		});
	};

	onViewSet (item: any) {
		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);

		dbStore.metaSet(subId, '', { ...dbStore.getMeta(subId, ''), viewId: item.id });
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

		const { isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const sideLeft = node.find('#sideLeft');
		const sideRight = node.find('#sideRight');
		const container = Util.getPageContainer(isPopup);

		sideLeft.removeClass('small');

		const width = sideLeft.offset().left + sideLeft.outerWidth() + sideRight.outerWidth();
		if (width >= container.width()) {
			sideLeft.addClass('small');
		};
	};

});

export default Controls;