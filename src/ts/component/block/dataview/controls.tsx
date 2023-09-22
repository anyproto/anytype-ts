import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { Icon, Button, Filter } from 'Component';
import { C, I, UtilCommon, analytics, Relation, keyboard, translate, UtilObject } from 'Lib';
import { menuStore, dbStore, blockStore } from 'Store';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import Head from './head';
import arrayMove from 'array-move';

interface Props extends I.ViewComponent {
	onFilterChange?: (v: string) => void; 
};

const Controls = observer(class Controls extends React.Component<Props> {

	_isMounted = false;
	node: any = null;
	refFilter = null;

	constructor (props: Props) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onViewAdd = this.onViewAdd.bind(this);
		this.onFilterShow = this.onFilterShow.bind(this);
		this.onFilterHide = this.onFilterHide.bind(this);
	};

	render () {
		const { className, rootId, block, getView, onRecordAdd, onTemplateMenu, isInline, isCollection, getSources, onFilterChange } = this.props;
		const views = dbStore.getViews(rootId, block.id);
		const view = getView();
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter(it => dbStore.getRelationByKey(it.relationKey));
		const filterCnt = filters.length;
		const allowedView = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
		const cn = [ 'dataviewControls' ];
		const buttonWrapCn = [ 'buttonWrap' ];
		const hasSources = (isCollection || getSources().length);
		const isAllowedObject = this.props.isAllowedObject();
		const isAllowedTemplate = this.props.isAllowedTemplate() && hasSources;

		if (isAllowedTemplate) {
			buttonWrapCn.push('withSelect');
		};

		if (className) {
			cn.push(className);
		};

		let head = null;
		if (isInline) {
			cn.push('isInline');
			head = <Head {...this.props} />;
		};

		const buttons = [
			{ id: 'filter', text: translate('blockDataviewControlsFilters'), menu: 'dataviewFilterList', on: filterCnt > 0 },
			{ id: 'sort', text: translate('blockDataviewControlsSorts'), menu: 'dataviewSort', on: sortCnt > 0 },
			{ id: 'settings', text: translate('blockDataviewControlsSettings'), menu: 'dataviewViewSettings' },
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
					onClick={e => this.onButton(e, `#${elementId}`, item.menu)}
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
					onContextMenu={e => this.onViewEdit(e, `#views #${elementId}`, item)}
				>
					{item.name || UtilObject.defaultName('Page')}
				</div>
			);
		});

		const Views = SortableContainer((item: any) => (
			<div id="views" className="views">
				{views.map((item: I.View, i: number) => (
					<ViewItem key={i} {...item} index={i} />
				))}
				{allowedView ? <Icon id={`button-${block.id}-view-add`} className="plus" tooltip={translate('blockDataviewControlsViewAdd')} onClick={this.onViewAdd} /> : ''}
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
						{head}

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
						<Filter
							ref={ref => this.refFilter = ref}
							placeholder={translate('blockDataviewSearch')} 
							icon="search"
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
									tooltip={translate('blockDataviewCreateNew')}
									text={translate('commonNew')}
									onClick={e => onRecordAdd(e, -1)}
								/>
								{isAllowedTemplate ? (
									<Button
										id={`button-${block.id}-add-record-select`}
										className="select c28"
										tooltip={translate('blockDataviewShowTemplates')}
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
		const container = UtilCommon.getPageContainer(isPopup);
		const win = $(window);

		container.off('mousedown.filter');
		win.off('keydown.filter');
	};

	onButton (e: any, element: string, component: string) {
		if (!component) {
			return;
		};

		const {
			rootId, block, readonly, loadData, getView, getSources, getVisibleRelations, getTarget, isInline, isCollection,
			getTypeId, getTemplateId, isAllowedDefaultType, isAllowedTemplate, onTemplateAdd
		} = this.props;
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
			onBack: (id) => {
				menuStore.replace(id, component, { ...param, noAnimation: true });
				window.setTimeout(() => menuStore.update(component, { noAnimation: false }), 50);
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
				getTypeId,
				getTemplateId,
				isInline,
				isCollection,
				isAllowedDefaultType,
				isAllowedTemplate,
				onTemplateAdd,
				view: observable.box(view)
			},
		};

		if (component == 'dataviewViewSettings') {
			param.title = translate('menuDataviewViewSettings');
		};

		menuStore.open(component, param);
	};

	onViewAdd (e: any) {
		e.persist();

		const { rootId, block, getSources, getTarget, isInline, getView } = this.props;
		const sources = getSources();
		const object = getTarget();
		const view = getView();
		const newView = {
			...view,
			id: '',
			name: translate(`viewName${I.ViewType.Grid}`),
			type: I.ViewType.Grid,
			groupRelationKey: view.groupRelationKey || Relation.getGroupOption(rootId, block.id, '')?.id,
			cardSize: view.cardSize || I.CardSize.Medium,
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
					onSave: () => this.forceUpdate(),
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

	onFilterShow () {
		if (!this.refFilter) {
			return;
		};

		const { isPopup } = this.props;
		const container = UtilCommon.getPageContainer(isPopup);
		const win = $(window);

		this.refFilter.setActive(true);
		this.refFilter.focus();

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
		this.props.onFilterChange('');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { isPopup, isInline } = this.props;
		const node = $(this.node);
		const sideLeft = node.find('#sideLeft');
		const sideRight = node.find('#sideRight');
		const container = UtilCommon.getPageContainer(isPopup);
		const { left } = sideLeft.offset();
		const sidebar = $('#sidebar');
		const sw = sidebar.outerWidth();
		const cw = container.outerWidth();
		const nw = node.outerWidth();

		let add = false;
		let close = false;

		if (sideLeft.hasClass('small')) {
			sideLeft.removeClass('small');
			close = true;
		};

		const width = sideLeft.outerWidth() + sideRight.outerWidth();
		const offset = isPopup ? container.offset().left : 0;

		if (left + width - offset - sw + 50 >= cw) {
			add = true;
		};
		if (isInline && (width >= nw)) {
			add = true;
		};

		if (add) {
			sideLeft.addClass('small');
			close = true;
		};

		if (close) {
			menuStore.closeAll([ 'dataviewViewEdit', 'dataviewViewList' ]);
		};
	};

});

export default Controls;
