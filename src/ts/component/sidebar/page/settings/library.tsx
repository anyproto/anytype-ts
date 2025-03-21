import * as React from 'react';
import { observer } from 'mobx-react';
import { analytics, I, J, keyboard, C, S, sidebar, Storage, translate, U } from 'Lib';
import { Button, Filter, Icon, IconObject, Title } from 'Component';
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

const SidebarSettingsLibrary = observer(class SidebarSettingsLibrary extends React.Component<Props, {}> {

	state = {
		isLoading: false,
	};
	node: any = null;
	cache: any = {};
	type: I.ObjectContainerType = I.ObjectContainerType.Type;
	refFilter = null;
	filter = '';
	timeoutFilter = 0;
	sortId: I.SortId = I.SortId.Updated;
	sortType: I.SortType = I.SortType.Desc;
	searchIds: string[] = null;
	offset = 0;

	constructor (props: any) {
		super(props);

		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
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

			return (
				<div
					id={`item-${item.id}`}
					className={[ 'item', item.id == param?.objectId ? 'active' : '' ].join(' ')}
					onClick={() => this.onClick(item)}
				>
					<IconObject object={item} />

					<div className="name">{item.name}</div>
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
									loadMoreRows={this.loadMoreRows}
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
		this.load(true);
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
		const limit = this.offset + J.Constant.limit.menuRecords;
		const options = U.Menu.getLibrarySortOptions(this.sortId, this.sortType);
		const option = options.find(it => it.id == this.sortId);

		let sorts: I.Sort[] = [];
		let filters: I.Filter[] = [];

		if (option) {
			sorts.push({ relationKey: option.relationKey, type: this.sortType });
		} else {
			sorts = sorts.concat([
				{ type: I.SortType.Desc, relationKey: 'createdDate' },
				{ type: I.SortType.Asc, relationKey: 'name' },
			]);
		};

		if (this.searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: this.searchIds || [] });
		};

		switch (this.type) {
			case I.ObjectContainerType.Type: {
				filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type });
				filters.push({ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.type ] });
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
			limit,
			keys: J.Relation.default.concat([ 'lastModifiedDate', 'sourceObject' ]),
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

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
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
		const storeSubId = isType ? J.Constant.subId.typeStore : J.Constant.subId.relationStore;
		const storeIds = S.Record.getRecordIds(storeSubId, '');
		const records = S.Record.getRecords(J.Constant.subId.library);

		return [
			{
				id: 'my', name: translate(`commonMy${isType ? 'Types' : 'Relations'}`),
				children: records.filter(it => it.isInstalled && !storeIds.includes(it.sourceObject)) },
			{
				id: 'system', name: translate(`commonSystem${isType ? 'Types' : 'Relations'}`),
				children: records.filter(it => storeIds.includes(it.sourceObject))
			},
		];
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

			let children = section.children ? section.children : [];

			items = items.concat(children);
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

	onClick (item) {
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
	};

	onAdd (e) {
		e.preventDefault();
		e.stopPropagation();

		const isPopup = keyboard.isPopup();

		switch (this.type) {
			case I.ObjectContainerType.Type: {
				const type = S.Record.getTypeType();
				const featured = [ 'type', 'tag', 'backlinks' ];
				const recommended = [];
				const mapper = it => S.Record.getRelationByKey(it)?.id;
				const details: any = {
					name: this.filter,
					isNew: true,
					type: type.id,
					layout: I.ObjectLayout.Type,
					recommendedFeaturedRelations: featured.map(mapper).filter(it => it),
					recommendedRelations: recommended.map(mapper).filter(it => it),
					defaultTypeId: String(S.Record.getPageType()?.id || ''),
				};

				sidebar.rightPanelToggle(true, true, isPopup, 'type', { details });
				break;
			};

			case I.ObjectContainerType.Relation: {
				const node = $(this.node);
				const width = node.width() - 32;

				S.Menu.open('blockRelationEdit', {
					element: `#containerSettings #button-object-create`,
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
					},
				});
				break;
			};
		};
	};

	storageGet () {
		const storage = Storage.get('settingsLibrary') || {};
		storage.sort = storage.sort || {};
		return storage;
	};

	storageSet (obj: any) {
		Storage.set('settingsLibrary', obj);
	};

});

export default SidebarSettingsLibrary
