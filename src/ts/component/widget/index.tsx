import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, ObjectName } from 'Component';
import { I, UtilCommon, UtilObject, UtilData, UtilMenu, translate, Storage, Action, analytics } from 'Lib';
import { blockStore, detailStore, menuStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

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

	constructor (props: Props) {
		super(props);

		this.onSetPreview = this.onSetPreview.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onOptions = this.onOptions.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.isCollection = this.isCollection.bind(this);
		this.getData = this.getData.bind(this);
		this.getLimit = this.getLimit.bind(this);
		this.sortFavorite = this.sortFavorite.bind(this);
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
		const withSelect = !this.isCollection(targetBlockId) && (!isPreview || !UtilCommon.isPlatformMac());
		const childKey = `widget-${child?.id}-${layout}`;

		const props = {
			...this.props,
			parent: block,
			block: child,
			isCollection: this.isCollection,
			getData: this.getData,
			getLimit: this.getLimit,
			sortFavorite: this.sortFavorite,
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
					<div className="iconWrap options">
						<Icon id="button-options" className="options" tooltip={translate('widgetOptions')} onClick={this.onOptions} />
					</div>
					<div className="iconWrap collapse">
						<Icon className="collapse" tooltip={translate('widgetToggle')} onClick={this.onToggle} />
					</div>
				</div>
			);
		};

		if (layout != I.WidgetLayout.Space) {
			const onClick = this.isCollection(targetBlockId) ? this.onSetPreview : this.onClick;

			head = (
				<div className="head">
					{back}
					<div className="clickable" onClick={onClick}>
						<ObjectName object={object} />
					</div>
					{buttons}
				</div>
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
			>
				<Icon className="remove" inner={<div className="inner" />} onClick={this.onRemove} />

				{head}

				<div id="wrapper" className="contentWrapper">
					{content}
				</div>

				<div className="dimmer" />
			</div>
		);
	};

	componentDidMount(): void {
		this.rebind();
		this.initToggle();
	};

	componentDidUpdate(): void {
		this.initToggle();
	};

	componentWillUnmount(): void {
		this.unbind();	
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

	onOptions (e: React.MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();

		const { block, setEditing } = this.props;
		const object = this.getObject();
		const node = $(this.node);
		const element = `#widget-${block.id} #button-options`;

		if (object._empty_) {
			return;
		};

		menuStore.open('widget', {
			element,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			subIds: Constant.menuIds.widget,
			vertical: I.MenuDirection.Center,
			offsetX: 32,
			onOpen: () => { node.addClass('active'); },
			onClose: () => { node.removeClass('active'); },
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
		const node = $(this.node);
		const icon = node.find('.icon.collapse');
		const wrapper = node.find('#wrapper').css({ height: 'auto' });
		const height = wrapper.outerHeight();

		node.addClass('isClosed');
		icon.removeClass('isClosed');
		wrapper.css({ height: 0 });

		raf(() => { wrapper.css({ height }); });
		window.setTimeout(() => { 
			node.removeClass('isClosed');
			wrapper.css({ height: 'auto' });
		}, 450);
	};

	close () {
		const node = $(this.node);
		const icon = node.find('.icon.collapse');
		const wrapper = node.find('#wrapper');

		wrapper.css({ height: wrapper.outerHeight() });
		icon.addClass('isClosed');

		raf(() => { 
			node.addClass('isClosed'); 
			wrapper.css({ height: 0 });
		});
		window.setTimeout(() => { wrapper.css({ height: '' }); }, 450);
	};

	getData (subId: string, callBack?: () => void) {
		const { block, isPreview } = this.props;
		const child = this.getTargetBlock();
		const { targetBlockId } = child?.content;
		const sorts = [];
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: UtilObject.getSystemTypes() },
		];

		let limit = this.getLimit(block.content);

		switch (targetBlockId) {
			case Constant.widgetId.favorite: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true });
				limit = 0;
				break;
			};

			case Constant.widgetId.recentEdit: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'lastModifiedDate', condition: I.FilterCondition.Greater, value: 0 });
				sorts.push({ relationKey: 'lastModifiedDate', type: I.SortType.Desc });
				break;
			};

			case Constant.widgetId.recentOpen: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'lastOpenedDate', condition: I.FilterCondition.Greater, value: 0 });
				sorts.push({ relationKey: 'lastOpenedDate', type: I.SortType.Desc });
				break;
			};

			case Constant.widgetId.set: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set });
				break;
			};

			case Constant.widgetId.collection: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.collection });
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
			if (targetBlockId == Constant.widgetId.favorite) {
				let records = this.sortFavorite(dbStore.getRecords(subId, ''));

				if (!isPreview) {
					records = records.slice(0, this.getLimit(block.content));
				};

				dbStore.recordsSet(subId, '', records);
			};

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

	onSetPreview () {
		const { block, isPreview, setPreview } = this.props;
		const object = this.getObject();
		const child = this.getTargetBlock();
		
		if (!child) {
			return;
		};

		const { targetBlockId } = child.content;

		let blockId = '';
		let event = 'ScreenHome';
		let data: any = { view: 'Widget' };

		if (!isPreview) {
			blockId = block.id;
			event = 'SelectHomeTab';
			data.tab = this.isCollection(targetBlockId) ? object.name : analytics.typeMapper(object.type);
		};

		setPreview(blockId);
		analytics.event(event, data);
	};

	onDragEnd () {
		const target = this.getObject();

		analytics.event('ReorderWidget', { target });
	};

	isCollection (blockId: string) {
		return Object.values(Constant.widgetId).includes(blockId);
	};

	getLimit ({ limit, layout }): number {
		const { isPreview } = this.props;
		const options = UtilMenu.getWidgetLimits(layout).map(it => Number(it.id));

		if (!limit || !options.includes(limit)) {
			limit = options[0];
		};
		return isPreview ? 0 : limit;
	}; 

});

export default WidgetIndex;
