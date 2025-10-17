import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToHorizontalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, Button, Filter } from 'Component';
import { C, I, S, U, M, analytics, Relation, keyboard, translate, Dataview, J } from 'Lib';
import Head from './head';

interface Props extends I.ViewComponent {
	onFilterChange?: (v: string) => void; 
};

interface ControlsRefProps {
	onViewSettings: () => void;
	toggleHoverArea: (v: boolean) => void,
	resize: () => void,
	getHeadRef: () => any,
};

const Controls = observer(forwardRef<ControlsRefProps, Props>((props, ref) => {

	const { 
		className, rootId, block, isInline, isPopup, isCollection, readonly, getSources, onFilterChange, getTarget, getTypeId, getView, onRecordAdd, onTemplateMenu,
		loadData, getVisibleRelations, getTemplateId, isAllowedDefaultType, onTemplateAdd, onSortAdd, onFilterAdd,
	} = props;
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
	const isAllowedObject = props.isAllowedObject();
	const tooltip = Dataview.getCreateTooltip(rootId, block.id, target.id, view.id);
	const isAllowedTemplate = U.Object.isAllowedTemplate(getTypeId()) || (target && U.Object.isInSetLayouts(target.layout) && hasSources);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const nodeRef = useRef(null);
	const filterRef = useRef(null);
	const headRef = useRef(null);
	const head = isInline ? <Head ref={headRef} {...props} /> : null;

	if (isInline) {
		cn.push('isInline');
	};

	if (isAllowedTemplate) {
		buttonWrapCn.push('withSelect');
	};

	if (className) {
		cn.push(className);
	};

	const onViewSwitch = (view: any) => {
		onViewSet(view);

		window.setTimeout(() => { 
			$(`#button-${block.id}-settings`).trigger('click'); 
		}, 50);
	};

	const onViewCopy = (view) => {
		const object = getTarget();
		const sources = getSources();

		C.BlockDataviewViewCreate(rootId, block.id, { ...view, name: view.name }, sources, (message: any) => {
			onViewSwitch({ id: message.viewId, type: view.type });

			analytics.event('DuplicateView', {
				type: view.type,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	const onViewRemove = (view) => {
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
					onViewSet(next);
				};

				analytics.event('RemoveView', {
					objectType: object.type,
					embedType: analytics.embedType(isInline)
				});
			});
		};
	};

	const onButton = (element: string, component: string) => {
		if (!component) {
			return;
		};

		const view = getView();
		const toggleParam = {
			onOpen: () => toggleHoverArea(true),
			onClose: () => toggleHoverArea(false),
		};
		const isFilter = component == 'dataviewFilterList';
		const isSort = component == 'dataviewSort';

		if (!readonly && ((isFilter && !view.filters.length) || (isSort && !view.sorts.length))) {
			sortOrFilterRelationSelect(component, { ...toggleParam, element }, () => {
				onButton(element, component);
			});
			return;
		};

		const param: any = {
			...toggleParam,
			classNameWrap: 'fromBlock',
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
				onViewSwitch,
				onViewCopy,
				onViewRemove,
				onFilterOrSortAdd: (menuId: string, component: string, menuWidth: number) => {
					sortOrFilterRelationSelect(component, {
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

	const sortOrFilterRelationSelect = (component: string, menuParam: Partial<I.MenuParam>, callBack?: () => void) => {
		menuParam.classNameWrap = String(menuParam.classNameWrap || '');
		menuParam.classNameWrap = [ menuParam.classNameWrap, 'fromBlock' ].join(' ');

		U.Menu.sortOrFilterRelationSelect(menuParam, {
			rootId,
			blockId: block.id,
			getView,
			onSelect: item => onSortOrFilterAdd(item, component, callBack),
		});
	};

	const onSortOrFilterAdd = (item: any, component: string, callBack: () => void) => {
		let newItem: any = {
			relationKey: item.relationKey ? item.relationKey : item.id
		};

		switch (component) {
			case 'dataviewSort': {
				newItem = Object.assign(newItem, {
					type: I.SortType.Asc,
					empty: I.EmptyType.End,
				});

				onSortAdd(newItem, callBack);
				break;
			};

			case 'dataviewFilterList': {
				const conditions = Relation.filterConditionsByType(item.format);
				const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
				const quickOptions = Relation.filterQuickOptions(item.format, condition);
				const quickOption = quickOptions.length ? quickOptions[0].id : I.FilterQuickOption.Today;

				newItem = Object.assign(newItem, {
					condition: condition as I.FilterCondition,
					value: Relation.formatValue(item, null, false),
					quickOption,
				});

				onFilterAdd(newItem, callBack);
				break;
			};
		};
	};

	const onViewAdd = (e: any) => {
		e.persist();

		const sources = getSources();
		const object = getTarget();
		const view = getView();
		const type = S.Record.getTypeById(object.type);
		
		let viewType = I.ViewType.List;
		if (type && (undefined !== type.defaultViewType)) {
			viewType = type.defaultViewType;
		};

		const newView = {
			...view,
			id: '',
			name: translate(`viewName${viewType}`),
			type: viewType,
			groupRelationKey: Relation.getGroupOption(rootId, block.id, viewType, '')?.id,
			endRelationKey: Relation.getGroupOption(rootId, block.id, viewType, '')?.id,
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

			resize();
			onViewSwitch(view);

			analytics.event('AddView', {
				type: view.type,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	const onViewSet = (view: any) => {
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

	const onViewContext = (e: any, element: string, view: any) => {
		e.stopPropagation();

		if (readonly) {
			return;
		};

		onViewSet(view);
		U.Menu.viewContextMenu({
			rootId,
			blockId: block.id,
			view,
			onCopy: onViewCopy,
			onRemove: onViewRemove,
			menuParam: {
				classNameWrap: 'fromBlock',
				element,
				offsetY: 4,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
			}
		});
	};

	const onViewSettings = () => {
		onButton(`#button-${block.id}-settings`, 'dataviewViewSettings');
	};

	const onSortStart = () => {
		keyboard.disableSelection(true);
	};

	const onSortEnd = (result: any) => {
		const { active, over } = result;

		if (!active || !over) {
			return;
		};

		const object = getTarget();
		const views = S.Record.getViews(rootId, block.id);
		const ids = views.map(it => it.id);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);
		const view = views[oldIndex];

		S.Record.viewsSort(rootId, block.id, arrayMove(views.map(it => it.id), oldIndex, newIndex));

		C.BlockDataviewViewSetPosition(rootId, block.id, view.id, newIndex, () => {
			analytics.event('RepositionView', {
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});

		keyboard.disableSelection(false);
	};

	const onFilterShow = () => {
		if (!filterRef.current) {
			return;
		};

		const container = U.Common.getPageFlexContainer(isPopup);
		const win = $(window);

		filterRef.current.setActive(true);
		toggleHoverArea(true);

		if (!isInline) {
			filterRef.current.focus();
		};

		container.off('mousedown.filter').on('mousedown.filter', (e: any) => { 
			const value = filterRef.current.getValue();

			if (!value && !$(e.target).parents(`.filter`).length) {
				onFilterHide();
				container.off('mousedown.filter');
			};
		});

		win.off('keydown.filter').on('keydown.filter', (e: any) => {
			e.stopPropagation();

			keyboard.shortcut('escape', e, () => {
				onFilterHide();
				win.off('keydown.filter');
			});
		});
	};

	const onFilterHide = () => {
		if (!filterRef.current) {
			return;
		};

		filterRef.current.setActive(false);
		filterRef.current.setValue('');
		filterRef.current.blur();

		toggleHoverArea(false);
		onFilterChange('');
	};

	const toggleHoverArea = (v: boolean) => {
		$(`#block-${block.id} .hoverArea`).toggleClass('active', v);
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const sideLeft = node.find('#dataviewControlsSideLeft');
		const sideRight = node.find('#dataviewControlsSideRight');
		const nw = node.outerWidth();

		if (node.hasClass('small')) {
			node.removeClass('small');
		};

		const width = Math.floor(sideLeft.outerWidth() + sideRight.outerWidth());

		if (width + 16 > nw) {
			node.addClass('small');
		} else 
		if (S.Menu.isOpen('dataviewViewList')) {
			S.Menu.closeAll([ 'dataviewViewList' ]);
		};
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
				onClick={() => onButton(`#${elementId}`, item.menu)}
			/>
		);
	};

	const ViewItem = (item: any) => {
		const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: item.id, disabled: item.disabled });
		const elementId = `view-item-${block.id}-${item.id}`;
		const cn = [ 'viewItem' ];

		if (transform) {
			transform.scaleX = 1;
			transform.scaleY = 1;
		};

		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		};

		if (item.id == view.id) {
			cn.push('active');
		};

		return (
			<div 
				id={elementId} 
				className={cn.join(' ')} 
				onClick={() => onViewSet(item)} 
				onContextMenu={e => onViewContext(e, `#views #${elementId}`, item)}
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
			>
				{item.name || translate('defaultNamePage')}
			</div>
		);
	};

	useEffect(() => {

		return () => {
			const container = U.Common.getPageFlexContainer(isPopup);
			const win = $(window);

			container.off('mousedown.filter');
			win.off('keydown.filter');
		};

	}, []);

	useEffect(() => resize());

	useImperativeHandle(ref, () => ({
		onViewSettings,
		toggleHoverArea,
		resize,
		getHeadRef: () => headRef.current,
	}));

	return (
		<div
			ref={nodeRef}
			id="dataviewControls"
			className={cn.join(' ')}
		>
			{head}
			<div className="sides">
				<div id="dataviewControlsSideLeft" className="side left">
					<div 
						id="view-selector"
						className="viewSelect viewItem select"
						onClick={() => onButton(`#block-${block.id} #view-selector`, 'dataviewViewList')}
						onContextMenu={(e: any) => onViewContext(e, `#block-${block.id} #view-selector`, view)}
					>
						<div className="name">{view.name}</div>
						<Icon className="arrow dark" />
					</div>

					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={onSortStart}
						onDragEnd={onSortEnd}
						modifiers={[ restrictToHorizontalAxis, restrictToFirstScrollableAncestor ]}
					>
						<SortableContext
							items={views.map(it => it.id)}
							strategy={horizontalListSortingStrategy}
						>
							<div id="views" className="views">
								{views.map((item: I.View, i: number) => (
									<ViewItem key={i} {...item} index={i} disabled={readonly} />
								))}

								{allowedView ? (
									<Icon 
										id={`button-${block.id}-view-add`} 
										className="plus withBackground" 
										tooltipParam={{ text: translate('blockDataviewControlsViewAdd') }}
										onClick={onViewAdd} /> 
								) : ''}
							</div>
						</SortableContext>
					</DndContext>
				</div>

				<div id="dataviewControlsSideRight" className="side right">
					<Filter
						ref={filterRef}
						placeholder={translate('blockDataviewSearch')} 
						icon="search withBackground"
						tooltipParam={{ text: translate('commonSearch'), caption: keyboard.getCaption('searchText') }}
						onChange={onFilterChange}
						onIconClick={onFilterShow}
					/>

					{buttons.map((item: any, i: number) => (
						<ButtonItem key={item.id} {...item} />
					))}	

					{isAllowedObject ? (
						<div className={buttonWrapCn.join(' ')}>
							<Button
								id={`button-${block.id}-add-record`}
								color="accent"
								className="addRecord c28"
								tooltipParam={{ text: tooltip }}
								text={translate('commonNew')}
								onClick={e => onRecordAdd(e, -1)}
							/>
							{isAllowedTemplate ? (
								<Button
									id={`button-${block.id}-add-record-select`}
									color="accent"
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

}));

export default Controls;