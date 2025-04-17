import * as React from 'react';
import { observer } from 'mobx-react';
import { analytics, I, J, keyboard, C, S, sidebar, Storage, translate, U } from 'Lib';
import { Button, Filter, Icon, IconObject, Title, ObjectName } from 'Component';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends React.Component {
	page: string;
};

interface State {
	isLoading: boolean;
};

const LIMIT = 30;
const HEIGHT_ITEM = 28;
const HEIGHT_SECTION = 38;
const HEIGHT_SECTION_FIRST = 34;

const SidebarSettingsLibrary = observer(class SidebarSettingsLibrary extends React.Component<Props, State> {

	state = {
		isLoading: false,
	};
	node: any = null;
	cache: any = {};
	type: I.ObjectContainerType = I.ObjectContainerType.Type;
	refFilter = null;
	filter = '';
	timeoutFilter = 0;
	sortId: I.SortId = I.SortId.LastUsed;
	sortType: I.SortType = I.SortType.Desc;
	searchIds: string[] = null;

	constructor (props: any) {
		super(props);

		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
		this.getAnalyticsSuffix = this.getAnalyticsSuffix.bind(this);
		this.openFirst = this.openFirst.bind(this);
	};

	render () {
		const { isLoading } = this.state;
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const items = this.getItems();

		const ItemSection = (item: any) => {
			const cn = [ 'section' ];

			if (item.isFirst) {
				cn.push('isFirst');
			};

			return (
				<div className={cn.join(' ')}>
					<div className="name">{item.name}</div>
				</div>
			);
		};

		const Item = (item: any) => {
			if (item.isSection) {
				return <ItemSection {...item} />;
			};

			const cn = [ 'item' ];
			if (item.id == param?.objectId) {
				cn.push('active');
			};

			return (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={() => this.onClick(item)}
					onContextMenu={() => this.onContext(item)}
				>
					<IconObject object={item} />
					<ObjectName object={item} />
				</div>
			);
		};

		const rowRenderer = ({ index, key, parent, style }) => (
			<CellMeasurer
				key={key}
				parent={parent}
				cache={this.cache}
				columnIndex={0}
				rowIndex={index}
			>
				<div className="row" style={style}>
					<Item {...items[index]} />
				</div>
			</CellMeasurer>
		);

		let title = '';
		if (this.props.page == 'types') {
			title = U.Common.plural(10, translate('pluralObjectType'));
		} else {
			title = U.Common.plural(10, translate('pluralProperty'));
		};

		return (
			<div
				ref={ref => this.node = ref}
				id="containerSettings"
				className="spaceSettingsLibrary"
			>
				<div className="head" />

				<div className="body">
					<div className="list">
						<div className="head">
							<div className="left">
								<Icon className="back withBackground" onClick={() => sidebar.leftPanelSetState({ page: 'settingsSpace' })} />
								<Title text={title} />
							</div>
							<div className="side right">
								<Icon id="button-object-more" className="more withBackground" onClick={this.onMore} />
							</div>
						</div>

						<div className="filterWrapper">
							<div className="side left">
								<Filter
									ref={ref => this.refFilter = ref}
									icon="search"
									className="outlined"
									placeholder={translate('commonSearch')}
									onChange={this.onFilterChange}
									onClear={this.onFilterClear}
								/>
							</div>
							<div className="side right">
								{U.Space.canMyParticipantWrite() ? <Button id="button-object-create" color="blank" className="c28" text={translate('commonNew')} onClick={this.onAdd} /> : ''}
							</div>
						</div>

						{this.cache && items.length && !isLoading ? (
							<div className="inner">
								<InfiniteLoader
									rowCount={items.length}
									loadMoreRows={() => {}}
									isRowLoaded={() => true}
									threshold={LIMIT}
								>
									{({ onRowsRendered }) => (
										<AutoSizer className="scrollArea">
											{({ width, height }) => (
												<List
													width={width}
													height={height}
													deferredMeasurmentCache={this.cache}
													rowCount={items.length}
													rowHeight={({ index }) => this.getRowHeight(items[index])}
													rowRenderer={rowRenderer}
													onRowsRendered={onRowsRendered}
													overscanRowCount={10}
													scrollToAlignment="center"
												/>
											)}
										</AutoSizer>
									)}
								</InfiniteLoader>
							</div>
						) : ''}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.type = this.props.page == 'types' ? I.ObjectContainerType.Type : I.ObjectContainerType.Relation;
		this.refFilter.focus();
		this.initSort();
		this.load(true, this.openFirst);
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i]),
			keyMapper: i => (items[i] || {}).id,
		});
	};

	componentWillUnmount () {
		C.ObjectSearchUnsubscribe([ J.Constant.subId.library ]);
	};

	initSort () {
		const storage = this.storageGet();
		const sort = storage.sort[this.type];

		if (!sort) {
			const options = U.Menu.getLibrarySortOptions(this.sortId, this.sortType).filter(it => it.isSort);
			if (options.length) {
				this.sortId = options[0].id;
				this.sortType = options[0].defaultType;
			};
		};

		if (sort) {
			this.sortId = sort.id;
			this.sortType = sort.type;
		};
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const options = U.Menu.getLibrarySortOptions(this.sortId, this.sortType);
		const option = options.find(it => it.id == this.sortId);

		let sorts: I.Sort[] = [];
		let filters: I.Filter[] = [];

		if (option) {
			sorts.push({ relationKey: option.relationKey, type: this.sortType });
		} else {
			sorts = sorts.concat([
				{ type: I.SortType.Desc, relationKey: 'lastUsedDate' },
				{ type: I.SortType.Asc, relationKey: 'name' },
			]);
		};

		if (this.searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: this.searchIds || [] });
		};

		switch (this.type) {
			case I.ObjectContainerType.Type: {
				filters = filters.concat([
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
					{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.type ] }
				]);
				break;
			};

			case I.ObjectContainerType.Relation: {
				filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Relation });
				break;
			};
		};

		if (clear) {
			this.setState({ isLoading: true });
			S.Record.recordsSet(J.Constant.subId.library, '', []);
		};

		U.Data.searchSubscribe({
			subId: J.Constant.subId.library,
			filters,
			sorts,
			keys: J.Relation.default.concat([ 'lastUsedDate', 'sourceObject' ]),
			noDeps: true,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, (message: any) => {
			this.setState({ isLoading: false });

			if (callBack) {
				callBack(message);
			};
		});
	};

	loadSearchIds (clear: boolean) {
		if (this.filter) {
			U.Data.search({
				filters: [],
				sorts: [],
				fullText: this.filter,
				keys: [ 'id' ],
			}, (message: any) => {
				this.searchIds = (message.records || []).map(it => it.id);
				this.load(clear);
			});
		} else {
			this.searchIds = null;
			this.load(clear);
		};
	};

	getSections () {
		const isType = this.type == I.ObjectContainerType.Type;
		const records = S.Record.getRecords(J.Constant.subId.library);

		let myLabel = '';
		let systemLabel = '';

		if (isType) {
			myLabel = translate('commonMyTypes');
			systemLabel = translate('commonSystemTypes');
		} else {
			myLabel = translate('commonMyRelations');
			systemLabel = translate('commonSystemRelations');
		};

		return [
			{
				id: 'my', name: myLabel,
				children: records.filter(it => S.Block.isAllowed(it.restrictions, [ I.RestrictionObject.Delete ])),
			},
			{
				id: 'system', name: systemLabel,
				children: records.filter(it => !S.Block.isAllowed(it.restrictions, [ I.RestrictionObject.Delete ])),
			},
		].filter(it => it.children.length);
	};

	getItems () {
		const sections = this.getSections();

		let items: any[] = [];

		sections.forEach((section, idx) => {
			if (section.name) {
				const item: any = { id: section.id, name: section.name, isSection: true };

				if (idx == 0) {
					item.isFirst = true;
				};

				items.push(item);
			};

			items = items.concat(section.children || []);
		});

		return items;
	};

	getRowHeight (item: any) {
		if (item.isSection) {
			return item.isFirst ? HEIGHT_SECTION_FIRST : HEIGHT_SECTION;
		};
		return HEIGHT_ITEM;
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			if (this.filter == v) {
				return;
			};

			this.filter = v;
			this.loadSearchIds(true);

		}, J.Constant.delay.keyboard);
	};

	onFilterClear () {
		this.searchIds = null;
		this.load(true);

		analytics.event('SearchInput', { route: analytics.route.allObjects });
	};

	onMore (e) {
		e.stopPropagation();

		const options = U.Menu.getLibrarySortOptions(this.sortId, this.sortType);

		let menuContext = null;

		S.Menu.open('select', {
			element: '#sidebarLeft #containerSettings #button-object-more',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: context => menuContext = context,
			data: {
				options,
				noClose: true,
				onSelect: (e: any, item: any) => {
					const storage = this.storageGet();

					this.sortId = item.id;
					this.sortType = item.type;

					storage.sort[this.type] = { id: item.id, type: item.type };
					analytics.event('ChangeLibrarySort', { type: item.id, sort: I.SortType[item.type] });

					this.storageSet(storage);
					this.initSort();
					this.load(true);

					menuContext.ref.updateOptions(U.Menu.getLibrarySortOptions(this.sortId, this.sortType));
				},
			}
		});
	};

	onClick (item: any) {
		const param = {
			layout: I.ObjectLayout.Settings,
			id: U.Object.actionByLayout(item.layout),
			_routeParam_: {
				additional: [
					{ key: 'objectId', value: item.id }
				],
			},
		};

		U.Object.openAuto(param);

		let e = '';

		switch (item.layout) {
			case I.ObjectLayout.Type: e = 'ClickSettingsSpaceType'; break;
			case I.ObjectLayout.Relation: e = 'ClickSettingsSpaceRelation'; break;
		};

		analytics.event(e, { route: analytics.route.library });
	};

	onContext (item: any) {
		const { x, y } = keyboard.mouse.page;

		S.Menu.open('objectContext', {
			element: `#sidebarLeft #containerSettings #item-${item.id}`,
			rect: { width: 0, height: 0, x: x + 4, y },
			data: {
				objectIds: [ item.id ],
				subId: J.Constant.subId.library,
				route: analytics.route.library,
			}
		});
	};

	onAdd (e) {
		e.preventDefault();
		e.stopPropagation();

		const isPopup = keyboard.isPopup();

		switch (this.type) {
			case I.ObjectContainerType.Type: {
				U.Object.createType({ name: this.filter }, isPopup);
				break;
			};

			case I.ObjectContainerType.Relation: {
				const node = $(this.node);
				const width = node.width() - 32;

				S.Menu.open('blockRelationEdit', {
					element: `#sidebarLeft #containerSettings #button-object-create`,
					offsetY: 4,
					width,
					className: 'fixed',
					classNameWrap: 'fromSidebar',
					horizontal: I.MenuDirection.Right,
					data: {
						filter: this.filter,
						addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
							if (relation.id && this.filter && this.searchIds) {
								this.searchIds = this.searchIds.concat(relation.id);
								this.load(false);
							};
						},
						route: analytics.route.settingsSpace,
					},
				});
				break;
			};
		};


		analytics.event(`ScreenCreate${this.getAnalyticsSuffix()}`, { route: 'SettingsSpace' });
	};

	storageGet () {
		const storage = Storage.get('settingsLibrary') || {};
		storage.sort = storage.sort || {};
		return storage;
	};

	storageSet (obj: any) {
		Storage.set('settingsLibrary', obj);
	};

	getAnalyticsSuffix () {
		const map = {
			[I.ObjectContainerType.Type]: 'Type',
			[I.ObjectContainerType.Relation]: 'Relation',
		};
		return map[this.type];
	};

	openFirst () {
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const records = this.getSections().reduce((acc, el) => acc.concat(el.children), []);

		if (records.find(it => it.id == param?.objectId) || !records.length) {
			return;
		};

		this.onClick(records[0]);
	};

});

export default SidebarSettingsLibrary
