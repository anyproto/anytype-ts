import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Cell } from 'Component';
import { I, S, U, J, translate, Dataview, Storage } from 'Lib';
import Item from './item';

const ANIMATION = 200;

interface Props extends I.WidgetViewComponent {
	id: string;
	value: any;
};

const Group = observer(class Group extends React.Component<Props> {

	node = null;

	constructor (props: Props) {
		super(props);

		this.onAll = this.onAll.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onCreate = this.onCreate.bind(this);
	};

	render () {
		const { rootId, block, id, getView, value, getViewLimit, canCreate } = this.props;
		const view = getView();
		const subId = this.getSubId();
		const items = this.getItems();
		const limit = getViewLimit();
		const { total } = S.Record.getMeta(subId, '');
		const head = {};

		head[view.groupRelationKey] = value;

		// Subscriptions
		items.forEach((item: any) => {
			const object = S.Detail.get(subId, item.id, [ view.groupRelationKey ]);
		});

		return (
			<div 
				ref={node => this.node = node} 
				className="group"
			>
				<div id={`item-${id}`} className="clickable" onClick={this.onToggle}>
					<Icon className="arrow" />
					<Cell 
						id={`board-head-${id}`} 
						rootId={rootId}
						subId={subId}
						block={S.Block.getLeaf(rootId, J.Constant.blockId.dataview)}
						relationKey={view.groupRelationKey} 
						viewType={I.ViewType.Board}
						getRecord={() => head}
						readonly={true} 
						arrayLimit={2}
						withName={true}
						placeholder={translate('commonUncategorized')}
					/>
					{canCreate ? <Icon className="plus" tooltip={translate('commonCreateNewObject')} onClick={this.onCreate} /> : ''}
				</div>

				<div id={`item-${id}-children`} className="items">
					{!items.length ? (
						<div className="item empty">{translate('commonNoObjects')}</div>
					) : (
						<React.Fragment>
							{items.map(item => (
								<Item 
									{...this.props}
									key={`widget-${block.id}-item-${item.id}`} 
									subId={subId}
									id={item.id} 
									hideIcon={view.hideIcon}
								/>
							))}
							{total > limit ? <div className="item more" onClick={this.onAll}>{translate('widgetShowAll')}</div> : ''}
						</React.Fragment>
					)}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.load();
		this.initToggle();
	};

	componentWillUnmount () {
		this.clear();
	};

	load () {
		const { id, getView, getObject, getViewLimit, value } = this.props;
		const subId = this.getSubId(); 
		const object = getObject();
		const view = getView();
		const isCollection = U.Object.isCollectionLayout(object.layout);

		if (!view || !object) {
			return;
		};

		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};

		const filters: I.Filter[] = [
			{ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
			Dataview.getGroupFilter(relation, value),
		].concat(view.filters);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const limit = getViewLimit();

		U.Data.searchSubscribe({
			subId,
			filters: filters.map(it => Dataview.filterMapper(view, it)),
			sorts: sorts.map(it => Dataview.filterMapper(view, it)),
			keys: J.Relation.sidebar,
			sources: object.setOf || [],
			limit,
			ignoreHidden: true,
			ignoreDeleted: true,
			collectionId: (isCollection ? object.id : ''),
		}, () => {
			S.Record.recordsSet(subId, '', this.applyObjectOrder(id, S.Record.getRecordIds(subId, '')));
		});
	};

	clear () {
		S.Record.recordsClear(this.getSubId(), '');
	};

	getSubId () {
		const { rootId, id } = this.props;

		return S.Record.getGroupSubId(rootId, J.Constant.blockId.dataview, id);
	};

	getItems () {
		const { id } = this.props;
		const subId = this.getSubId();
		const records = U.Common.objectCopy(S.Record.getRecordIds(subId, ''));

		return this.applyObjectOrder(id, records).map(id => ({ id }));
	};

	applyObjectOrder (groupId: string, ids: string[]): any[] {
		const { rootId, parent } = this.props;

		return Dataview.applyObjectOrder(rootId, J.Constant.blockId.dataview, parent.content.viewId, groupId, ids);
	};

	getToggleKey () {
		return `widget${this.props.block.id}`;
	};

	initToggle () {
		const { id } = this.props;
		const isOpen = Storage.checkToggle(this.getToggleKey(), id);

		if (!isOpen) {
			return;
		};

		const node = $(this.node);
		const item = node.find(`#item-${id}`);
		const children = node.find(`#item-${id}-children`);

		item.addClass('isExpanded');
		children.show();
	};

	onToggle () {
		const { id } = this.props;
		const subKey = this.getToggleKey();
		const isOpen = Storage.checkToggle(subKey, id);
		const node = $(this.node);
		const item = node.find(`#item-${id}`);
		const children = node.find(`#item-${id}-children`);

		let height = 0;
		if (isOpen) {
			item.removeClass('isExpanded');

			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			window.setTimeout(() => children.css({ height: 0 }), 15);
			window.setTimeout(() => children.hide(), ANIMATION + 15);
		} else {
			item.addClass('isExpanded');

			children.show();
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();

			children.css({ overflow: 'hidden', height: 0 });
			window.setTimeout(() => children.css({ height: height }), 15);
			window.setTimeout(() => children.css({ overflow: 'visible', height: 'auto' }), ANIMATION + 15);
		};

		Storage.setToggle(subKey, id, !isOpen);
	};

	onCreate (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { onCreate, getView, value } = this.props;
		const view = getView();
		const { id } = this.props;
		const isOpen = Storage.checkToggle(this.getToggleKey(), id);
		const details = {};

		details[view.groupRelationKey] = value;

		onCreate({ details });

		if (!isOpen) {
			this.onToggle();
		};
	};

	onAll (e: any) {
		const { getObject, parent } = this.props;
		const object = getObject();

		U.Object.openEvent(e, { ...object, _routeParam_: { viewId: parent.content.viewId } });
	};

});

export default Group;