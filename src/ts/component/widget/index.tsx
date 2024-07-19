import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, ObjectName, DropTarget } from 'Component';
import { C, I, S, U, J, translate, Storage, Action, analytics, Dataview, keyboard, Relation } from 'Lib';

import WidgetSpace from './space';
import WidgetView from './view';
import WidgetTree from './tree';

interface Props extends I.WidgetComponent {
	name?: string;
	icon?: string;
	disableContextMenu?: boolean;
	className?: string;
	onDragStart?: (e: React.MouseEvent, blockId: string) => void;
	onDragOver?: (e: React.MouseEvent, blockId: string) => void;
};

const WidgetIndex = observer(class WidgetIndex extends React.Component<Props> {

	node = null;
	ref = null;
	timeout = 0;
	subId = '';

	constructor (props: Props) {
		super(props);

		this.onSetPreview = this.onSetPreview.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onOptions = this.onOptions.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.onContext = this.onContext.bind(this);
		this.onCreateClick = this.onCreateClick.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.isSystemTarget = this.isSystemTarget.bind(this);
		this.getData = this.getData.bind(this);
		this.getLimit = this.getLimit.bind(this);
		this.getTraceId = this.getTraceId.bind(this);
		this.sortFavorite = this.sortFavorite.bind(this);
		this.canCreate = this.canCreate.bind(this);
	};

	render () {
		const { block, isPreview, isEditing, className, onDragStart, onDragOver, setPreview } = this.props;
		const child = this.getTargetBlock();
		const root = '';
		const childrenIds = S.Block.getChildrenIds(root, root);
		const { layout, limit, viewId } = block.content;

		if (!child && (layout != I.WidgetLayout.Space)) {
			return null;
		};

		const canWrite = U.Space.canMyParticipantWrite();
		const { targetBlockId } = child?.content || {};
		const cn = [ 'widget' ];
		const object = this.getObject();

		const withSelect = !this.isSystemTarget() && (!isPreview || !U.Common.isPlatformMac());
		const childKey = `widget-${child?.id}-${layout}`;
		const canCreate = this.canCreate();
		const canDrop = object && !this.isSystemTarget() && !isEditing && S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ]);
		const isFavorite = targetBlockId == J.Constant.widgetId.favorite;

		const props = {
			...this.props,
			ref: ref => this.ref = ref,
			key: childKey,
			parent: block,
			block: child,
			canCreate,
			isSystemTarget: this.isSystemTarget,
			getData: this.getData,
			getLimit: this.getLimit,
			getTraceId: this.getTraceId,
			sortFavorite: this.sortFavorite,
			addGroupLabels: this.addGroupLabels,
			onContext: this.onContext,
			onCreate: this.onCreate,
		};

		if (className) {
			cn.push(className);
		};

		if (isPreview) {
			cn.push('isPreview');
		};

		if (withSelect) {
			cn.push('withSelect');
		};

		let head = null;
		let content = null;
		let back = null;
		let buttons = null;
		let targetTop = null;
		let targetBot = null;
		let isDraggable = canWrite;

		if (isPreview) {
			back = (
				<Icon
					className="back"
					onClick={() => {
						setPreview('');
						analytics.event('ScreenHome', { view: 'Widget' });
					}}
				/>
			);

			isDraggable = false;
		} else {
			buttons = (
				<div className="buttons">
					{isEditing ? (
						<div className="iconWrap more">
							<Icon className="options" tooltip={translate('widgetOptions')} onClick={this.onOptions} />
						</div>
					) : ''}
					{canCreate ? (
						<div className="iconWrap create">
							<Icon className="plus" tooltip={translate('commonCreateNewObject')} onClick={this.onCreateClick} />
						</div>
					) : ''}
					<div className="iconWrap collapse">
						<Icon className="collapse" tooltip={translate('widgetToggle')} onClick={this.onToggle} />
					</div>
				</div>
			);
		};

		if (layout != I.WidgetLayout.Space) {
			const onClick = this.isSystemTarget() ? this.onSetPreview : this.onClick;

			head = (
				<div className="head">
					{back}
					<div className="clickable" onClick={onClick}>
						<ObjectName object={object} />
						{isFavorite ? <span className="count">{this.getFavoriteIds().length}</span> : ''}
					</div>
					{buttons}
				</div>
			);

			if (canDrop) {
				head = (
					<DropTarget
						cacheKey={[ block.id, object.id ].join('-')}
						id={object.id}
						rootId={targetBlockId}
						targetContextId={object.id}
						dropType={I.DropType.Menu}
						canDropMiddle={true}
						className="targetHead"
					>
						{head}
					</DropTarget>
				);
			};

			targetTop = (
				<DropTarget 
					{...this.props} 
					isTargetTop={true} 
					rootId={S.Block.widgets} 
					id={block.id} 
					dropType={I.DropType.Widget} 
					canDropMiddle={false} 
				/>
			);

			targetBot = (
				<DropTarget 
					{...this.props} 
					isTargetBottom={true} 
					rootId={S.Block.widgets} 
					id={block.id} 
					dropType={I.DropType.Widget} 
					canDropMiddle={false} 
				/>
			);
		};

		switch (layout) {
			case I.WidgetLayout.Link: {
				cn.push('widgetLink');
				break;
			};

			case I.WidgetLayout.Space: {
				cn.push('widgetSpace');
				content = <WidgetSpace {...props} />;

				isDraggable = false;
				break;
			};

			case I.WidgetLayout.Tree: {
				cn.push('widgetTree');
				content = <WidgetTree {...props} />;
				break;
			};

			case I.WidgetLayout.List:
			case I.WidgetLayout.Compact:
			case I.WidgetLayout.View: {
				cn.push('widgetView');
				content = <WidgetView {...props} />;
				break;
			};

		};

		return (
			<div
				ref={node => this.node = node}
				id={`widget-${block.id}`}
				className={cn.join(' ')}
				draggable={isDraggable}
				onDragStart={e => onDragStart(e, block.id)}
				onDragOver={e => onDragOver ? onDragOver(e, block.id) : null}
				onDragEnd={this.onDragEnd}
				onContextMenu={this.onOptions}
			>
				<Icon className="remove" inner={<div className="inner" />} onClick={this.onRemove} />

				{head}

				<div id="wrapper" className="contentWrapper">
					{content}
				</div>

				<div className="dimmer" />

				{targetTop}
				{targetBot}
			</div>
		);
	};

	componentDidMount(): void {
		this.rebind();
		this.forceUpdate();
	};

	componentDidUpdate(): void {
		this.initToggle();
	};

	componentWillUnmount(): void {
		this.unbind();
		window.clearTimeout(this.timeout);
	};

	unbind () {
		const { block } = this.props;
		const events = [ 'updateWidgetData', 'updateWidgetViews' ];

		$(window).off(events.map(it => `${it}.${block.id}`).join(' '));
	};

	rebind () {
		const { block } = this.props;
		const win = $(window);

		this.unbind();

		win.on(`updateWidgetData.${block.id}`, () => this.ref && this.ref.updateData && this.ref.updateData());
		win.on(`updateWidgetViews.${block.id}`, () => this.ref && this.ref.updateViews && this.ref.updateViews());
	};

	getTargetBlock (): I.Block {
		const { widgets } = S.Block;
		const { block } = this.props;
		const childrenIds = S.Block.getChildrenIds(widgets, block.id);

		return childrenIds.length ? S.Block.getLeaf(widgets, childrenIds[0]) : null;
	};

	getObject () {
		const { widgets } = S.Block;
		const child = this.getTargetBlock();

		if (!child) {
			return null;
		};

		const { targetBlockId } = child.content;

		let object = null;
		switch (targetBlockId) {
			default: {
				object = S.Detail.get(widgets, targetBlockId);
				break;
			};

			case J.Constant.widgetId.favorite:
			case J.Constant.widgetId.recentEdit:
			case J.Constant.widgetId.recentOpen:
			case J.Constant.widgetId.set:
			case J.Constant.widgetId.collection: {
				object = {
					id: targetBlockId,
					name: translate(U.Common.toCamelCase(`widget-${targetBlockId}`)),
				};
				break;
			};
		};

		return object;
	};

	onRemove (e: React.MouseEvent): void {
		e.stopPropagation();
		Action.removeWidget(this.props.block.id, this.getObject());
	};

	onClick (e: React.MouseEvent): void {
		if (!e.button) {
			U.Object.openEvent(e, { ...this.getObject(), _routeParam_: { viewId: this.props.block.content.viewId } });
		};
	};

	onCreateClick (e: React.MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();

		this.onCreate();
	};

	onCreate (param?: any): void {
		param = param || {};

		const { widgets } = S.Block;
		const { block } = this.props;
		const { viewId, layout } = block.content;
		const object = this.getObject();

		if (!object) {
			return;
		};

		const child = this.getTargetBlock();
		if (!child) {
			return;
		};

		const { targetBlockId } = child.content;
		const isSetOrCollection = U.Object.isInSetLayouts(object.layout);
		const isFavorite = targetBlockId == J.Constant.widgetId.favorite;

		let details: any = Object.assign({}, param.details || {});
		let flags: I.ObjectFlag[] = [];
		let typeKey = '';
		let templateId = '';
		let createWithLink: boolean = false;
		let isCollection = false;

		if (layout != I.WidgetLayout.Tree) {
			flags.push(I.ObjectFlag.DeleteEmpty);
		};

		if (isSetOrCollection) {
			const rootId = this.getRootId();
			if (!rootId) {
				return;
			};

			const view = Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);
			const typeId = Dataview.getTypeId(rootId, J.Constant.blockId.dataview, object.id, viewId);
			const type = S.Record.getTypeById(typeId);

			if (!type) {
				return;
			};

			details = Object.assign(Dataview.getDetails(rootId, J.Constant.blockId.dataview, object.id, viewId), details);
			flags = flags.concat([ I.ObjectFlag.SelectTemplate ]);
			typeKey = type.uniqueKey;
			templateId = view?.defaultTemplateId || type.defaultTemplateId;
			isCollection = U.Object.isCollectionLayout(object.layout);
		} else {
			switch (targetBlockId) {
				default:
				case J.Constant.widgetId.favorite: {
					const type = S.Record.getTypeById(S.Common.type);

					if (!type) {
						return;
					};

					details.layout = type.recommendedLayout;
					flags = flags.concat([ I.ObjectFlag.SelectType, I.ObjectFlag.SelectTemplate ]);
					typeKey = type.uniqueKey;
					templateId = type.defaultTemplateId;

					if (!this.isSystemTarget()) {
						details.type = type.id;
						createWithLink = true;
					};
					break;
				};

				case J.Constant.widgetId.set: {
					details.layout = I.ObjectLayout.Set;
					typeKey = J.Constant.typeKey.set;
					break;
				};

				case J.Constant.widgetId.collection: {
					details.layout = I.ObjectLayout.Collection;
					typeKey = J.Constant.typeKey.collection;
					break;
				};
			};
		};

		if (!typeKey) {
			return;
		};

		const callBack = (message: any) => {
			if (message.error.code) {
				return;
			};

			const object = message.details;

			if (isFavorite) {
				Action.setIsFavorite([ object.id ], true, analytics.route.widget);
			};

			if (isCollection) {
				C.ObjectCollectionAdd(targetBlockId, [ object.id ]);
			};

			U.Object.openAuto(object);
		};

		if (createWithLink) {
			U.Object.create(object.id, '', details, I.BlockPosition.Bottom, templateId, flags, analytics.route.widget, callBack);
		} else {
			C.ObjectCreate(details, flags, templateId, typeKey, S.Common.space, (message: any) => {
				if (message.error.code) {
					return;
				};

				const object = message.details;

				analytics.createObject(object.type, object.layout, analytics.route.widget, message.middleTime);
				callBack(message);
			});
		};
	};

	onOptions (e: React.MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();

		if (!U.Space.canMyParticipantWrite()) {
			return;
		};

		const { block, setEditing } = this.props;
		const object = this.getObject();
		const node = $(this.node);

		if (!object || object._empty_) {
			return;
		};

		const { x, y } = keyboard.mouse.page;

		S.Menu.open('widget', {
			rect: { width: 0, height: 0, x: x + 4, y },
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			subIds: J.Menu.widget,
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {
				...block.content,
				target: object,
				isEditing: true,
				blockId: block.id,
				setEditing,
			}
		});
	};

	initToggle () {
		const { block, isPreview } = this.props;
		const node = $(this.node);
		const innerWrap = node.find('#innerWrap');
		const icon = node.find('.icon.collapse');
		const isClosed = Storage.checkToggle('widget', block.id);

		if (!isPreview) {
			isClosed ? node.addClass('isClosed') : node.removeClass('isClosed');
			isClosed ? icon.addClass('isClosed') : node.removeClass('isClosed');
			isClosed ? innerWrap.hide() : innerWrap.show();
		};
	};

	onToggle () {
		const { block } = this.props;
		const isClosed = Storage.checkToggle('widget', block.id);

		isClosed ? this.open() : this.close();
		Storage.setToggle('widget', block.id, !isClosed);
	};

	open () {
		const { block } = this.props;
		const node = $(this.node);
		const icon = node.find('.icon.collapse');
		const innerWrap = node.find('#innerWrap').show();
		const wrapper = node.find('#wrapper').css({ height: 'auto' });
		const height = wrapper.outerHeight();
		const minHeight = this.getMinHeight();

		node.addClass('isClosed');
		icon.removeClass('isClosed');
		wrapper.css({ height: minHeight });

		if (this.ref && this.ref.onOpen) {
			this.ref.onOpen();
		};

		raf(() => { 
			wrapper.css({ height }); 
			innerWrap.css({ opacity: 1 });
		});

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { 
			const isClosed = Storage.checkToggle('widget', block.id);

			if (!isClosed) {
				node.removeClass('isClosed');
				wrapper.css({ height: 'auto' });
			};
		}, J.Constant.delay.widget);
	};

	close () {
		const { block } = this.props;
		const node = $(this.node);
		const icon = node.find('.icon.collapse');
		const innerWrap = node.find('#innerWrap');
		const wrapper = node.find('#wrapper');
		const minHeight = this.getMinHeight();

		wrapper.css({ height: wrapper.outerHeight() });
		icon.addClass('isClosed');
		innerWrap.css({ opacity: 0 });

		raf(() => { 
			node.addClass('isClosed'); 
			wrapper.css({ height: minHeight });
		});

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			const isClosed = Storage.checkToggle('widget', block.id);

			if (isClosed) {
				wrapper.css({ height: '' });
				innerWrap.hide();
			};
		}, J.Constant.delay.widget);
	};

	getMinHeight () {
		return [ I.WidgetLayout.List, I.WidgetLayout.Compact, I.WidgetLayout.Tree ].includes(this.props.block.content.layout) ? 8 : 0;
	};

	getData (subId: string, callBack?: () => void) {
		const { block } = this.props;
		const child = this.getTargetBlock();

		if (!child) {
			return;
		};

		this.subId = subId;

		const { targetBlockId } = child.content;
		const space = U.Space.getSpaceview();
		const templateType = S.Record.getTemplateType();
		const sorts = [];
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getFileAndSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
		];
		let limit = this.getLimit(block.content);

		if (targetBlockId != J.Constant.widgetId.recentOpen) {
			sorts.push({ relationKey: 'lastModifiedDate', type: I.SortType.Desc });
		};

		switch (targetBlockId) {
			case J.Constant.widgetId.favorite: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true });
				limit = 0;
				break;
			};

			case J.Constant.widgetId.recentEdit: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'lastModifiedDate', condition: I.FilterCondition.Greater, value: space.createdDate + 3 });
				break;
			};

			case J.Constant.widgetId.recentOpen: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'lastOpenedDate', condition: I.FilterCondition.Greater, value: 0 });
				sorts.push({ relationKey: 'lastOpenedDate', type: I.SortType.Desc });
				break;
			};

			case J.Constant.widgetId.set: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Set });
				break;
			};

			case J.Constant.widgetId.collection: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection });
				break;
			};
		};

		U.Data.searchSubscribe({
			subId,
			filters,
			sorts,
			limit,
			keys: J.Relation.sidebar,
		}, () => {
			if (callBack) {
				callBack();
			};
		});
	};

	getFavoriteIds (): string[] {
		const { root } = S.Block;
		const ids = S.Block.getChildren(root, root, it => it.isLink()).map(it => it.content.targetBlockId);
		const items = ids.map(id => S.Detail.get(root, id)).filter(it => !it.isArchived && !it.isDeleted).map(it => it.id);

		return items;
	};

	sortFavorite (records: string[]): string[] {
		const { block, isPreview } = this.props;
		const ids = this.getFavoriteIds();

		let sorted = U.Common.objectCopy(records || []).sort((c1: string, c2: string) => {
			const i1 = ids.indexOf(c1);
			const i2 = ids.indexOf(c2);

			if (i1 > i2) return 1;
			if (i1 < i2) return -1;
			return 0;
		});

		if (!isPreview) {
			sorted = sorted.slice(0, this.getLimit(block.content));
		};

		return sorted;
	};

	onSetPreview () {
		const { block, isPreview, setPreview } = this.props;
		const object = this.getObject();
		const child = this.getTargetBlock();
		
		if (!child) {
			return;
		};

		const data: any = { view: 'Widget' };

		let blockId = '';
		let event = 'ScreenHome';

		if (!isPreview) {
			blockId = block.id;
			event = 'SelectHomeTab';
			data.tab = this.isSystemTarget() ? object.name : analytics.typeMapper(object.type);
		};

		setPreview(blockId);
		analytics.event(event, data);
	};

	onDragEnd () {
		const { block } = this.props;
		const { layout } = block.content;

		analytics.event('ReorderWidget', {
			layout,
			params: { target: this.getObject() }
		});
	};

	isSystemTarget (): boolean {
		const target = this.getTargetBlock();
		return target ? U.Menu.isSystemWidget(target.getTargetObjectId()) : false;
	};

	canCreate (): boolean {
		const object = this.getObject();
		const { block, isEditing } = this.props;

		if (!object || isEditing || !U.Space.canMyParticipantWrite()) {
			return false;
		};

		const { layout } = block.content;
		const target = this.getTargetBlock();
		const layoutWithPlus = [ I.WidgetLayout.List, I.WidgetLayout.Tree, I.WidgetLayout.Compact, I.WidgetLayout.View ].includes(layout);
		const isRecent = target ? [ J.Constant.widgetId.recentOpen, J.Constant.widgetId.recentEdit ].includes(target.getTargetObjectId()) : null;

		if (isRecent || !layoutWithPlus) {
			return false;
		};

		if (U.Object.isInSetLayouts(object.layout)) {
			const rootId = this.getRootId();
			const typeId = Dataview.getTypeId(rootId, J.Constant.blockId.dataview, object.id);
			const type = S.Record.getTypeById(typeId);
			const layouts = U.Object.getFileLayouts().concat(I.ObjectLayout.Participant);
			const setOf = Relation.getArrayValue(object.setOf);
			const isCollection = U.Object.isCollectionLayout(object.layout);

			if (!setOf.length && !isCollection) {
				return false;
			};

			if (type && layouts.includes(type.recommendedLayout)) {
				return false;
			};
		} else
		if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ])) {
			return false;
		};

		return true;
	};

	getRootId (): string {
		const target = this.getTargetBlock();
		return target ? [ target.content.targetBlockId, 'widget', target.id ].join('-') : '';
	};

	getTraceId (): string {
		const target = this.getTargetBlock();
		return target ? [ 'widget', target.id ].join('-') : '';
	};

	getLimit ({ limit, layout }): number {
		const { isPreview } = this.props;
		const options = U.Menu.getWidgetLimitOptions(layout).map(it => Number(it.id));

		if (!limit || !options.includes(limit)) {
			limit = options[0];
		};
		return isPreview ? J.Constant.limit.menuRecords : limit;
	};

	addGroupLabels (records: any[], widgetId: string) {
		let relationKey;
		if (widgetId == J.Constant.widgetId.recentOpen) {
			relationKey = 'lastOpenedDate';
		};
		if (widgetId == J.Constant.widgetId.recentEdit) {
			relationKey = 'lastModifiedDate';
		};
		return U.Data.groupDateSections(records, relationKey, { type: '', links: [] });
	};

	onContext (param: any) {
		const { node, element, withElement, subId, objectId, data } = param;

		const menuParam: any = {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {
				route: analytics.route.widget,
				objectIds: [ objectId ],
				subId,
			},
		};

		menuParam.data = Object.assign(menuParam.data, data || {});

		if (withElement) {
			menuParam.element = element;
			menuParam.vertical = I.MenuDirection.Center;
			menuParam.offsetX = 32;
		} else {
			const { x, y } = keyboard.mouse.page;
			menuParam.rect = { width: 0, height: 0, x: x + 4, y };
		};

		S.Menu.open('dataviewContext', menuParam);
	};

});

export default WidgetIndex;
