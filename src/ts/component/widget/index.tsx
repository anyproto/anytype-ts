import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, ObjectName, DropTarget } from 'Component';
import { C, I, UtilCommon, UtilObject, UtilData, UtilMenu, translate, Storage, Action, analytics, Dataview, UtilDate, UtilSpace } from 'Lib';
import { blockStore, detailStore, menuStore, dbStore, commonStore } from 'Store';
const Constant = require('json/constant.json');

import WidgetSpace from './space';
import WidgetList from './list';
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
		this.onCreate = this.onCreate.bind(this);
		this.onOptions = this.onOptions.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.isSystemTarget = this.isSystemTarget.bind(this);
		this.getData = this.getData.bind(this);
		this.getLimit = this.getLimit.bind(this);
		this.sortFavorite = this.sortFavorite.bind(this);
		this.isPlusAllowed = this.isPlusAllowed.bind(this);
	};

	render () {
		const { block, isPreview, isEditing, className, onDragStart, onDragOver, setPreview } = this.props;
		const child = this.getTargetBlock();
		const root = '';
		const childrenIds = blockStore.getChildrenIds(root, root);
		const { layout, limit, viewId } = block.content;

		if (!child && (layout != I.WidgetLayout.Space)) {
			return null;
		};

		const { targetBlockId } = child?.content || {};
		const cn = [ 'widget', UtilCommon.toCamelCase(`widget-${I.WidgetLayout[layout]}`) ];
		const object = this.getObject();

		const withSelect = !this.isSystemTarget() && (!isPreview || !UtilCommon.isPlatformMac());
		const childKey = `widget-${child?.id}-${layout}`;
		const withPlus = this.isPlusAllowed();
		const canDrop = object && !this.isSystemTarget() && !isEditing && blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Block ]);

		const props = {
			...this.props,
			parent: block,
			block: child,
			isSystemTarget: this.isSystemTarget,
			getData: this.getData,
			getLimit: this.getLimit,
			sortFavorite: this.sortFavorite,
			addGroupLabels: this.addGroupLabels,
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
		} else {
			buttons = (
				<div className="buttons">
					{isEditing ? (
						<div className="iconWrap more">
							<Icon className="options" tooltip={translate('widgetOptions')} onClick={this.onOptions} />
						</div>
					) : ''}
					{withPlus ? (
						<div className="iconWrap create">
							<Icon className="plus" tooltip={translate('widgetCreate')} onClick={this.onCreate} />
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
					rootId={blockStore.widgets} 
					id={block.id} 
					dropType={I.DropType.Widget} 
					canDropMiddle={false} 
				/>
			);

			targetBot = (
				<DropTarget 
					{...this.props} 
					isTargetBottom={true} 
					rootId={blockStore.widgets} 
					id={block.id} 
					dropType={I.DropType.Widget} 
					canDropMiddle={false} 
				/>
			);
		};

		switch (layout) {

			case I.WidgetLayout.Space: {
				content = <WidgetSpace key={childKey} ref={ref => this.ref = ref} {...this.props} {...props} />;
				break;
			};

			case I.WidgetLayout.Tree: {
				content = <WidgetTree key={childKey} ref={ref => this.ref = ref} {...this.props} {...props} />;
				break;
			};

			case I.WidgetLayout.List:
			case I.WidgetLayout.Compact: {
				content = <WidgetList key={childKey} ref={ref => this.ref = ref} {...this.props} {...props} isCompact={layout == I.WidgetLayout.Compact} />;
				break;
			};

		};

		return (
			<div
				ref={node => this.node = node}
				id={`widget-${block.id}`}
				className={cn.join(' ')}
				draggable={isEditing}
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
		const { widgets } = blockStore;
		const { block } = this.props;
		const childrenIds = blockStore.getChildrenIds(widgets, block.id);

		return childrenIds.length ? blockStore.getLeaf(widgets, childrenIds[0]) : null;
	};

	getObject () {
		const { widgets } = blockStore;
		const child = this.getTargetBlock();

		if (!child) {
			return null;
		};

		const { targetBlockId } = child.content;

		let object = null;
		switch (targetBlockId) {
			default: {
				object = detailStore.get(widgets, targetBlockId);
				break;
			};

			case Constant.widgetId.favorite:
			case Constant.widgetId.recentEdit:
			case Constant.widgetId.recentOpen:
			case Constant.widgetId.set:
			case Constant.widgetId.collection: {
				object = {
					id: targetBlockId,
					name: translate(UtilCommon.toCamelCase(`widget-${targetBlockId}`)),
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
			UtilObject.openEvent(e, this.getObject());
		};
	};

	onCreate (e: React.MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();

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
		const isSetOrCollection = UtilObject.isSetLayout(object.layout);
		const isFavorite = targetBlockId == Constant.widgetId.favorite;

		let details: any = {};
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

			const view = Dataview.getView(rootId, Constant.blockId.dataview, viewId);
			const typeId = Dataview.getTypeId(rootId, Constant.blockId.dataview, object.id, viewId);
			const type = dbStore.getTypeById(typeId);

			if (!view || !type) {
				return;
			};

			details = Dataview.getDetails(rootId, Constant.blockId.dataview, object.id, viewId);
			flags = flags.concat([ I.ObjectFlag.SelectTemplate ]);
			typeKey = type.uniqueKey;
			templateId = view.defaultTemplateId || type.defaultTemplateId;
			isCollection = Dataview.isCollection(rootId, Constant.blockId.dataview);
		} else {
			switch (targetBlockId) {
				default:
				case Constant.widgetId.favorite: {
					const type = dbStore.getTypeById(commonStore.type);

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

				case Constant.widgetId.set: {
					details.layout = I.ObjectLayout.Set;
					typeKey = Constant.typeKey.set;
					break;
				};

				case Constant.widgetId.collection: {
					details.layout = I.ObjectLayout.Collection;
					typeKey = Constant.typeKey.collection;
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
				Action.setIsFavorite([ object.id ], true, analytics.route.widget, () => {
					window.setTimeout(() => this.sliceFavorite(), 40);
				});
			};

			if (isCollection) {
				C.ObjectCollectionAdd(object.id, [ object.id ]);
			};

			UtilObject.openAuto(object);
		};

		if (createWithLink) {
			UtilObject.create(object.id, '', details, I.BlockPosition.Bottom, templateId, flags, analytics.route.widget, callBack);
		} else {
			C.ObjectCreate(details, flags, templateId, typeKey, commonStore.space, (message: any) => {
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

		if (!UtilSpace.canMyParticipantWrite()) {
			return;
		};

		const { block, setEditing } = this.props;
		const object = this.getObject();
		const node = $(this.node);
		const element = `#widget-${block.id}`;

		if (!object || object._empty_) {
			return;
		};

		menuStore.open('widget', {
			element,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			subIds: Constant.menuIds.widget,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Right,
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
		const icon = node.find('.icon.collapse');
		const isClosed = Storage.checkToggle('widget', block.id);

		if (!isPreview) {
			isClosed ? node.addClass('isClosed') : node.removeClass('isClosed');
			isClosed ? icon.addClass('isClosed') : node.removeClass('isClosed');
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
		const wrapper = node.find('#wrapper').css({ height: 'auto' });
		const height = wrapper.outerHeight();

		node.addClass('isClosed');
		icon.removeClass('isClosed');
		wrapper.css({ height: 0 });

		raf(() => { wrapper.css({ height }); });

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { 
			const isClosed = Storage.checkToggle('widget', block.id);

			if (!isClosed) {
				node.removeClass('isClosed');
				wrapper.css({ height: 'auto' });
			};
		}, 450);
	};

	close () {
		const { block } = this.props;
		const node = $(this.node);
		const icon = node.find('.icon.collapse');
		const wrapper = node.find('#wrapper');

		wrapper.css({ height: wrapper.outerHeight() });
		icon.addClass('isClosed');

		raf(() => { 
			node.addClass('isClosed'); 
			wrapper.css({ height: 0 });
		});

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			const isClosed = Storage.checkToggle('widget', block.id);

			if (isClosed) {
				wrapper.css({ height: '' });
			};
		}, 450);
	};

	getData (subId: string, callBack?: () => void) {
		const { block, isPreview } = this.props;
		const child = this.getTargetBlock();

		if (!child) {
			return;
		};

		this.subId = subId;

		const { targetBlockId } = child.content;
		const space = UtilSpace.getSpaceview();
		const templateType = dbStore.getTemplateType();
		const sorts = [];
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getFileAndSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
		];
		let limit = this.getLimit(block.content);

		if (targetBlockId != Constant.widgetId.recentOpen) {
			sorts.push({ relationKey: 'lastModifiedDate', type: I.SortType.Desc });
		};

		switch (targetBlockId) {
			case Constant.widgetId.favorite: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true });
				limit = 0;
				break;
			};

			case Constant.widgetId.recentEdit: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'lastModifiedDate', condition: I.FilterCondition.Greater, value: space.createdDate + 3 });
				break;
			};

			case Constant.widgetId.recentOpen: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'lastOpenedDate', condition: I.FilterCondition.Greater, value: 0 });
				sorts.push({ relationKey: 'lastOpenedDate', type: I.SortType.Desc });
				break;
			};

			case Constant.widgetId.set: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Set });
				break;
			};

			case Constant.widgetId.collection: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection });
				break;
			};
		};

		UtilData.searchSubscribe({
			subId,
			filters,
			sorts,
			limit,
			keys: Constant.sidebarRelationKeys,
		}, () => {
			this.sliceFavorite();

			if (callBack) {
				callBack();
			};
		});
	};

	sortFavorite (records: string[]): string[] {
		const { root } = blockStore;
		const ids = blockStore.getChildren(root, root, it => it.isLink()).map(it => it.content.targetBlockId);

		return UtilCommon.objectCopy(records || []).sort((c1: string, c2: string) => {
			const i1 = ids.indexOf(c1);
			const i2 = ids.indexOf(c2);

			if (i1 > i2) return 1;
			if (i1 < i2) return -1;
			return 0;
		});
	};

	sliceFavorite () {
		const { block, isPreview } = this.props;

		let records = this.sortFavorite(dbStore.getRecordIds(this.subId, ''));

		if (!isPreview) {
			records = records.slice(0, this.getLimit(block.content));
		};

		dbStore.recordsSet(this.subId, '', records);
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
		if (!target) {
			return false;
		};

		return Object.values(Constant.widgetId).includes(target.getTargetObjectId());
	};

	isPlusAllowed (): boolean {
		const object = this.getObject();
		const { block, isEditing } = this.props;

		if (!object || isEditing || !UtilSpace.canMyParticipantWrite()) {
			return false;
		};

		const { layout } = block.content;
		const child = this.getTargetBlock();
		const { targetBlockId } = child?.content || {};
		const isRecent = [ Constant.widgetId.recentOpen, Constant.widgetId.recentEdit ].includes(targetBlockId);
		const layoutWithPlus = [ I.WidgetLayout.List, I.WidgetLayout.Tree, I.WidgetLayout.Compact ].includes(layout);

		if (isRecent || !layoutWithPlus) {
			return false;
		};

		if (UtilObject.isSetLayout(object.layout)) {
			const rootId = this.getRootId();
			const typeId = Dataview.getTypeId(rootId, Constant.blockId.dataview, object.id);
			const type = dbStore.getTypeById(typeId);

			if (type && UtilObject.isFileLayout(type.recommendedLayout)) {
				return false;
			};
		} else
		if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Block ])) {
			return false;
		};

		return true;
	};

	getRootId = (): string => {
		const child = this.getTargetBlock();
		if (!child) {
			return '';
		};

		const { targetBlockId } = child.content;
		return [ targetBlockId, 'widget', child.id ].join('-');
	};

	getLimit ({ limit, layout }): number {
		const { isPreview } = this.props;
		const options = UtilMenu.getWidgetLimits(layout).map(it => Number(it.id));

		if (!limit || !options.includes(limit)) {
			limit = options[0];
		};
		return isPreview ? 0 : limit;
	};

	addGroupLabels (records: any[], widgetId: string) {
		const now = UtilDate.now();
		const { d, m, y } = UtilDate.getCalendarDateParam(now);
		const today = now - UtilDate.timestamp(y, m, d);
		const yesterday = now - UtilDate.timestamp(y, m, d - 1);
		const lastWeek = now - UtilDate.timestamp(y, m, d - 7);
		const lastMonth = now - UtilDate.timestamp(y, m - 1, d);

		const groups = {
			today: [],
			yesterday: [],
			lastWeek: [],
			lastMonth: [],
			older: []
		};

		let groupedRecords: I.WidgetTreeDetails[] = [];
		let relationKey;

		if (widgetId == Constant.widgetId.recentOpen) {
			relationKey = 'lastOpenedDate';
		};
		if (widgetId == Constant.widgetId.recentEdit) {
			relationKey = 'lastModifiedDate';
		};

		records.forEach((record) => {
			const diff = now - record[relationKey];

			if (diff < today) {
				groups.today.push(record);
			} else
			if (diff < yesterday) {
				groups.yesterday.push(record);
			} else
			if (diff < lastWeek) {
				groups.lastWeek.push(record);
			} else
			if (diff < lastMonth) {
				groups.lastMonth.push(record);
			} else {
				groups.older.push(record);
			};
		});

		Object.keys(groups).forEach((key) => {
			if (groups[key].length) {
				groupedRecords.push({ id: key, type: '', links: [], isSection: true });
				groupedRecords = groupedRecords.concat(groups[key]);
			};
		});

		return groupedRecords;
	};

});

export default WidgetIndex;
