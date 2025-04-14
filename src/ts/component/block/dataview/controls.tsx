import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, Button, Filter } from 'Component';
import { C, I, S, U, M, analytics, Relation, keyboard, translate, Dataview, sidebar, J } from 'Lib';
import Head from './head';

interface Props extends I.ViewComponent {
	onFilterChange?: (v: string) => void; 
};

const Controls = observer(class Controls extends React.Component<Props> {

	_isMounted = false;
	node: any = null;
	refFilter = null;
	refHead = null;

	constructor (props: Props) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.sortOrFilterRelationSelect = this.sortOrFilterRelationSelect.bind(this);
		this.onSortOrFilterAdd = this.onSortOrFilterAdd.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onViewAdd = this.onViewAdd.bind(this);
		this.onFilterShow = this.onFilterShow.bind(this);
		this.onFilterHide = this.onFilterHide.bind(this);
		this.onViewSwitch = this.onViewSwitch.bind(this);
		this.onViewContext = this.onViewContext.bind(this);
		this.onViewCopy = this.onViewCopy.bind(this);
		this.onViewRemove = this.onViewRemove.bind(this);
		this.onViewSettings = this.onViewSettings.bind(this);
	};

	render () {
		const { className, rootId, block, getView, onRecordAdd, onTemplateMenu, isInline, isCollection, getSources, onFilterChange, getTarget, getTypeId, readonly } = this.props;
		const target = getTarget();
		const views = S.Record.getViews(rootId, block.id);
		const view = getView();
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter(it => S.Record.getRelationByKey(it.relationKey));
		const filterCnt = filters.length;
		const allowedView = !readonly && S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'dataviewControls' ];
		const buttonWrapCn = [ 'buttonWrap' ];
		const hasSources = (isCollection || getSources().length);
		const isAllowedObject = this.props.isAllowedObject();
		const tooltip = Dataview.getCreateTooltip(rootId, block.id, target.id, view.id);
		const isAllowedTemplate = U.Object.isAllowedTemplate(getTypeId()) || (target && U.Object.isInSetLayouts(target.layout) && hasSources);

		if (isAllowedTemplate) {
			buttonWrapCn.push('withSelect');
		};

		if (className) {
			cn.push(className);
		};

		let head = null;
		if (isInline) {
			cn.push('isInline');
			head = <Head ref={ref => this.refHead = ref} {...this.props} />;
		};

		const buttons = [
			{ id: 'filter', text: translate('blockDataviewControlsFilters'), menu: 'dataviewFilterList', on: filterCnt > 0 },
			{ id: 'sort', text: translate('blockDataviewControlsSorts'), menu: 'dataviewSort', on: sortCnt > 0 },
			{ id: 'settings', text: translate('blockDataviewControlsSettings'), menu: 'dataviewViewSettings' },
		];

		const ButtonItem = (item: any) => {
			const elementId = `button-${block.id}-${item.id}`;
			const cn = [ `btn-${item.id}`, 'withBackground' ];

			if (item.on) {
				cn.push('on');
			};

			return (
				<Icon
					id={elementId} 
					className={cn.join(' ')}
					tooltipParam={{ text: item.text }}
					onClick={() => this.onButton(`#${elementId}`, item.menu)}
				/>
			);
		};

		const ViewItem = SortableElement((item: any) => {
			const elementId = `view-item-${block.id}-${item.id}`;
			return (
				<div 
					id={elementId} 
					className={'viewItem ' + (item.id == view.id ? 'active' : '')} 
					onClick={() => this.onViewSet(item)} 
					onContextMenu={e => this.onViewContext(e, `#views #${elementId}`, item)}
				>
					{item.name || translate('defaultNamePage')}
				</div>
			);
		});

		const Views = SortableContainer(() => (
			<div id="views" className="views">
				{views.map((item: I.View, i: number) => (
					<ViewItem key={i} {...item} index={i} disabled={readonly} />
				))}
				{allowedView ? (
					<Icon 
						id={`button-${block.id}-view-add`} 
						className="plus withBackground" 
						tooltipParam={{ text: translate('blockDataviewControlsViewAdd') }}
						onClick={this.onViewAdd} /> 
				) : ''}
			</div>
		));
		
		return (
			<div
				ref={node => this.node = node}
				id="dataviewControls"
				className={cn.join(' ')}
			>
				{head}
				<div className="sides">
					<div id="dataviewControlsSideLeft" className="side left">
						<div 
							id="view-selector"
							className="viewSelect viewItem select"
							onClick={() => this.onButton(`#block-${block.id} #view-selector`, 'dataviewViewList')}
							onContextMenu={(e: any) => this.onViewContext(e, `#block-${block.id} #view-selector`, view)}
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

					<div id="dataviewControlsSideRight" className="side right">
						<Filter
							ref={ref => this.refFilter = ref}
							placeholder={translate('blockDataviewSearch')} 
							icon="search withBackground"
							tooltipParam={{ text: translate('commonSearch'), caption: keyboard.getCaption('searchText') }}
							onChange={onFilterChange}
							onIconClick={this.onFilterShow}
						/>

						{buttons.map((item: any, i: number) => (
							<ButtonItem key={item.id} {...item} />
						))}	
						{isAllowedObject ? (
							<div className={buttonWrapCn.join(' ')}>
								<Button
									id={`button-${block.id}-add-record`}
									className="addRecord c28"
									tooltipParam={{ text: tooltip }}
									text={translate('commonNew')}
									onClick={e => onRecordAdd(e, -1)}
								/>
								{isAllowedTemplate ? (
									<Button
										id={`button-${block.id}-add-record-select`}
										className="select c28"
										tooltipParam={{ text: translate('blockDataviewShowTemplates') }}
										onClick={e => onTemplateMenu(e, -1)}
									/>
								) : ''}
							</div>
						) : ''}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		this.resize();	
	};

	componentWillUnmount () {
		this._isMounted = false;

		const { isPopup } = this.props;
		const container = U.Common.getPageFlexContainer(isPopup);
		const win = $(window);

		container.off('mousedown.filter');
		win.off('keydown.filter');
	};

	onViewSwitch (view: any) {
		this.onViewSet(view);

		window.setTimeout(() => { 
			$(`#button-${this.props.block.id}-settings`).trigger('click'); 
		}, 50);
	};

	onViewCopy (view) {
		const { rootId, block, getSources, isInline, getTarget } = this.props;
		const object = getTarget();
		const sources = getSources();

		C.BlockDataviewViewCreate(rootId, block.id, { ...view, name: view.name }, sources, (message: any) => {
			this.onViewSwitch({ id: message.viewId, type: view.type });

			analytics.event('DuplicateView', {
				type: view.type,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	onViewRemove (view) {
		const { rootId, block, getView, isInline, getTarget } = this.props;
		const views = S.Record.getViews(rootId, block.id);
		const object = getTarget();
		const idx = views.findIndex(it => it.id == view.id);
		const filtered = views.filter(it => it.id != view.id);
		const current = getView();

		let next = idx >= 0 ? filtered[idx] : filtered[0];
		if (!next) {
			next = filtered[filtered.length - 1];
		};

		if (next) {
			C.BlockDataviewViewDelete(rootId, block.id, view.id, () => {
				if (view.id == current.id) {
					this.onViewSet(next);
				};

				analytics.event('RemoveView', {
					objectType: object.type,
					embedType: analytics.embedType(isInline)
				});
			});
		};
	};

	onButton (element: string, component: string) {
		if (!component) {
			return;
		};

		const {
			rootId, block, readonly, loadData, getView, getSources, getVisibleRelations, getTarget, isInline, isCollection,
			getTypeId, getTemplateId, isAllowedDefaultType, onTemplateAdd, onSortAdd, onFilterAdd,
		} = this.props;
		const view = getView();
		const toggleParam = {
			onOpen: () => this.toggleHoverArea(true),
			onClose: () => this.toggleHoverArea(false),
		};
		const isFilter = component == 'dataviewFilterList';
		const isSort = component == 'dataviewSort';

		if (!readonly && ((isFilter && !view.filters.length) || (isSort && !view.sorts.length))) {
			this.sortOrFilterRelationSelect(component, { ...toggleParam, element }, () => {
				this.onButton(element, component);
			});
			return;
		};

		const param: any = {
			...toggleParam,
			element,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			noFlipY: true,
			onBack: (id: string) => {
				const menu = S.Menu.get(id);

				if (menu) {
					const view = U.Common.objectCopy(menu.param.data.view.get());
					param.data.view = observable.box(new M.View(view));
				};

				S.Menu.replace(id, component, { ...param, noAnimation: true });
				window.setTimeout(() => S.Menu.update(component, { noAnimation: false }), J.Constant.delay.menu);
			},
			data: {
				readonly,
				rootId,
				blockId: block.id,
				view: observable.box(view),
				isInline,
				isCollection,
				loadData,
				getView,
				getSources,
				getVisibleRelations,
				getTarget,
				getTypeId,
				getTemplateId,
				isAllowedDefaultType,
				onTemplateAdd,
				onSortAdd,
				onFilterAdd,
				onViewSwitch: this.onViewSwitch,
				onViewCopy: this.onViewCopy,
				onViewRemove: this.onViewRemove,
				onFilterOrSortAdd: (menuId: string, component: string, menuWidth: number) => {
					this.sortOrFilterRelationSelect(component, {
						element: `#${menuId} #item-add`,
						offsetX: menuWidth,
						horizontal: I.MenuDirection.Right,
						vertical: I.MenuDirection.Center,
					});
				},
			},
		};

		if (component == 'dataviewViewSettings') {
			param.title = translate('menuDataviewViewSettings');
		};

		if (S.Menu.isOpen('select')) {
			S.Menu.close('select');
		};
		S.Menu.open(component, param);
	};

	sortOrFilterRelationSelect (component: string, menuParam: Partial<I.MenuParam>, callBack?: () => void) {
		const { rootId, block, getView } = this.props;

		U.Menu.sortOrFilterRelationSelect(menuParam, {
			rootId,
			blockId: block.id,
			getView,
			onSelect: (item) => {
				this.onSortOrFilterAdd(item, component, () => {
					if (callBack) {
						callBack();
					};
				});
			}
		});
	};

	onSortOrFilterAdd (item: any, component: string, callBack: () => void) {
		const { onSortAdd, onFilterAdd } = this.props;

		let newItem: any = {
			relationKey: item.relationKey ? item.relationKey : item.id
		};

		if (component == 'dataviewSort') {
			newItem.type = I.SortType.Asc;

			onSortAdd(newItem, callBack);
		} else
		if (component == 'dataviewFilterList') {
			const conditions = Relation.filterConditionsByType(item.format);
			const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;

			newItem = Object.assign(newItem, {
				condition: condition as I.FilterCondition,
				value: Relation.formatValue(item, null, false),
			});

			onFilterAdd(newItem, callBack);
		};
	};

	onViewAdd (e: any) {
		e.persist();

		const { rootId, block, getSources, getTarget, isInline, getView } = this.props;
		const sources = getSources();
		const object = getTarget();
		const view = getView();
		const type = S.Record.getTypeById(object.type);
		
		let viewType = I.ViewType.Grid;
		if (type && (undefined !== type.defaultViewType)) {
			viewType = type.defaultViewType;
		};

		const newView = {
			...view,
			id: '',
			name: translate(`viewName${viewType}`),
			type: viewType,
			groupRelationKey: view.groupRelationKey || Relation.getGroupOption(rootId, block.id, viewType, '')?.id,
			cardSize: view.cardSize || I.CardSize.Medium,
			filters: [],
			sorts: [],
		};

		C.BlockDataviewViewCreate(rootId, block.id, newView, sources, (message: any) => {
			if (message.error.code) {
				return;
			};

			const view = S.Record.getView(rootId, block.id, message.viewId);
			if (!view) {
				return;
			};

			this.resize();
			this.onViewSwitch(view);

			analytics.event('AddView', {
				type: view.type,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	onViewSet (view: any) {
		const { rootId, block, isInline, getTarget } = this.props;
		const subId = S.Record.getSubId(rootId, block.id);
		const object = getTarget();

		S.Record.metaSet(subId, '', { viewId: view.id });
		C.BlockDataviewViewSetActive(rootId, block.id, view.id);

		analytics.event('SwitchView', {
			type: view.type,
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	onViewContext (e: any, element: string, view: any) {
		e.stopPropagation();

		const { rootId, block, readonly } = this.props;
		if (readonly) {
			return;
		};

		this.onViewSet(view);
		U.Menu.viewContextMenu({
			rootId,
			blockId: block.id,
			view,
			onCopy: this.onViewCopy,
			onRemove: this.onViewRemove,
			menuParam: {
				element,
				offsetY: 4,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
			}
		});
	};

	onViewSettings () {
		this.onButton(`#button-${this.props.block.id}-settings`, 'dataviewViewSettings');
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { rootId, block, isInline, getTarget } = this.props;
		const object = getTarget();
		const views = S.Record.getViews(rootId, block.id);
		const view = views[oldIndex];
		const ids = arrayMove(views.map(it => it.id), oldIndex, newIndex);

		S.Record.viewsSort(rootId, block.id, ids);

		C.BlockDataviewViewSetPosition(rootId, block.id, view.id, newIndex, () => {
			analytics.event('RepositionView', {
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});

		keyboard.disableSelection(false);
	};

	onFilterShow () {
		if (!this.refFilter) {
			return;
		};

		const { isPopup, isInline } = this.props;
		const container = U.Common.getPageFlexContainer(isPopup);
		const win = $(window);

		this.refFilter.setActive(true);
		this.toggleHoverArea(true);

		if (!isInline) {
			this.refFilter.focus();
		};

		container.off('mousedown.filter').on('mousedown.filter', (e: any) => { 
			const value = this.refFilter.getValue();

			if (!value && !$(e.target).parents(`.filter`).length) {
				this.onFilterHide();
				container.off('mousedown.filter');
			};
		});

		win.off('keydown.filter').on('keydown.filter', (e: any) => {
			e.stopPropagation();

			keyboard.shortcut('escape', e, () => {
				this.onFilterHide();
				win.off('keydown.filter');
			});
		});
	};

	onFilterHide () {
		if (!this.refFilter) {
			return;
		};

		this.refFilter.setActive(false);
		this.refFilter.setValue('');
		this.refFilter.blur();
		this.toggleHoverArea(false);

		this.props.onFilterChange('');
	};

	toggleHoverArea (v: boolean) {
		$(`#block-${this.props.block.id} .hoverArea`).toggleClass('active', v);
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const sideLeft = node.find('#dataviewControlsSideLeft');
		const sideRight = node.find('#dataviewControlsSideRight');
		const nw = node.outerWidth();

		if (node.hasClass('small')) {
			node.removeClass('small');
		};

		const width = Math.floor(sideLeft.outerWidth() + sideRight.outerWidth());

		if (width + 16 > nw) {
			node.addClass('small');
		} else {
			S.Menu.closeAll([ 'dataviewViewList' ]);
		};
	};

});

export default Controls;
