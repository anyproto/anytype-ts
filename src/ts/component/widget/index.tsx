import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Loader } from 'Component';
import { I, Util, ObjectUtil, DataUtil, translate, Storage, Action } from 'Lib';
import { blockStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

import WidgetSpace from './space';
import WidgetList from './list';
import WidgetTree from './tree';

interface Props extends I.WidgetComponent {
	name?: string;
	icon?: string;
	disableContextMenu?: boolean;
	isPreview?: boolean;
	onDragStart?: (e: React.MouseEvent, blockId: string) => void;
	onDragOver?: (e: React.MouseEvent, blockId: string) => void;
};

interface State {
	loading: boolean;
};

const WidgetIndex = observer(class WidgetIndex extends React.Component<Props, State> {

	node: any = null;
	state = {
		loading: false,
	};

	constructor (props: Props) {
		super(props);

		this.onRemove = this.onRemove.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onOptions = this.onOptions.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.isCollection = this.isCollection.bind(this);
		this.getData = this.getData.bind(this);
	};

	render (): React.ReactNode {
		const { loading } = this.state;
		const { block, isDraggable, isPreview, onDragStart, onDragOver, setPreview } = this.props;
		const child = this.getTargetBlock();
		const { layout } = block.content;
		const { targetBlockId } = child?.content || {};
		const cn = [ 'widget', Util.toCamelCase('widget-' + I.WidgetLayout[layout]) ];
		const object = this.getObject();
		const props = {
			...this.props,
			parent: block,
			block: child,
			isCollection: this.isCollection,
			getData: this.getData,
		};
		const key = `widget-${block.id}`;

		if (isPreview) {
			cn.push('isPreview');
		};
		if (isDraggable) {
			cn.push('isDraggable');
		};

		let icon = null;
		let head = null;
		let content = null;
		let back = null;
		let buttons = null;

		if ([ I.WidgetLayout.Link ].includes(layout)) {
			icon = <IconObject object={object} size={24} />
		};

		if (isPreview) {
			back = <Icon className="back" onClick={() => setPreview('')} />
		} else {
			buttons = (
				<div className="buttons">
					<div className="iconWrap options">
						<Icon id="button-options" className="options" tooltip="Options" onClick={this.onOptions} />
					</div>
					<div className="iconWrap collapse">
						<Icon className="collapse" tooltip="Toggle" onClick={this.onToggle} />
					</div>
				</div>
			);
		};

		if (layout != I.WidgetLayout.Space) {
			let onClick = null;
			if (!this.isCollection(targetBlockId)) {
				onClick = e => ObjectUtil.openEvent(e, object);
			} else {
				onClick = () => setPreview(isPreview ? '' : block.id);
			};

			head = (
				<div className="head">
					<div className="flex">
						{back}
						<div className="clickable" onClick={onClick}>
							{icon}
							<ObjectName object={object} />
						</div>
						{buttons}
					</div>
				</div>
			);
		};

		if (loading) {
			content = <Loader />;
		} else {
			switch (layout) {

				case I.WidgetLayout.Space: {
					content = <WidgetSpace key={key} {...this.props} {...props} />;
					break;
				};

				case I.WidgetLayout.Tree: {
					content = <WidgetTree key={key} {...this.props} {...props} />;
					break;
				};

				case I.WidgetLayout.List: {
					content = <WidgetList key={key} {...this.props} {...props} />;
					break;
				};

			};
		};

		return (
			<div
				ref={node => this.node = node}
				id={key}
				className={cn.join(' ')}
				draggable={isDraggable}
				onDragStart={e => onDragStart(e, block.id)}
				onDragOver={e => onDragOver ? onDragOver(e, block.id) : null}
			>
				<Icon className="remove" onClick={this.onRemove} />

				{head}

				<div id="wrapper" className="contentWrapper">
					{content}
				</div>

				<div className="dimmer" />
			</div>
		);
	};

	componentDidMount(): void {
		this.initToggle();
	};

	componentDidUpdate(): void {
		this.initToggle();
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
			case Constant.widgetId.recent:
			case Constant.widgetId.set:
			case Constant.widgetId.collection: {
				object = {
					id: targetBlockId,
					name: translate(Util.toCamelCase(`widget-${targetBlockId}`)),
				};
				break;
			};
		};

		return object;
	};

	onRemove (e: React.MouseEvent): void {
		e.stopPropagation();
		Action.removeWidget(this.props.block.id);
	};

	onClick (e: React.MouseEvent): void {
		ObjectUtil.openEvent(e, this.getObject());
	};

	onOptions (e: React.MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();

		const { block, setEditing } = this.props;
		const object = this.getObject();
		const node = $(this.node);
		const element = `#widget-${block.id} #button-options`;
		const buttons = node.find('.head .buttons');

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
			onOpen: () => {
				buttons.addClass('active');
				$(element).addClass('active');
			},
			onClose: () => {
				buttons.removeClass('active');
				$(element).removeClass('active');
			},
			data: {
				layout: block.content.layout,
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
		}, 350);
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
		window.setTimeout(() => { wrapper.css({ height: '' }); }, 350);
	};

	getData (subId: string, callBack?: () => void) {
		const { block, isPreview } = this.props;
		const child = this.getTargetBlock();
		const { layout } = block.content;
		const { targetBlockId } = child?.content;
		const sorts = [];
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: DataUtil.getSystemTypes() },
		];

		let limit = layout == I.WidgetLayout.Tree ? Constant.limit.widgetRecords.tree : Constant.limit.widgetRecords.list;
		if (isPreview) {
			limit = 0;
		};

		switch (targetBlockId) {
			case Constant.widgetId.favorite: {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true });
				break;
			};

			case Constant.widgetId.recent: {
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

		DataUtil.searchSubscribe({
			subId,
			filters,
			sorts,
			limit,
			keys: Constant.sidebarRelationKeys,
		}, callBack);
	};

	isCollection (blockId: string) {
		return [ 
			Constant.widgetId.favorite, 
			Constant.widgetId.recent, 
			Constant.widgetId.set, 
			Constant.widgetId.collection,
		].includes(blockId);
	};

});

export default WidgetIndex;