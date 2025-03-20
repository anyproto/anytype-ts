import * as React from 'react';
import { observer } from 'mobx-react';
import { analytics, I, J, keyboard, Relation, S, sidebar, Storage, translate, U } from 'Lib';
import { Button, Filter, Icon, IconObject, Title } from 'Component';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends React.Component {
	page: string;
};

const LIMIT = 30;
const HEIGHT_ITEM = 28;
const HEIGHT_SECTION = 38;
const HEIGHT_SECTION_FIRST = 34;

const SidebarSettingsLibrary = observer(class SidebarSettingsLibrary extends React.Component<Props, {}> {

	node: any = null;
	type: I.ObjectContainerType = I.ObjectContainerType.Type;
	refFilter = null;
	filter = '';
	timeoutFilter = 0;
	sortId: I.SortId = I.SortId.Updated;
	sortType: I.SortType = I.SortType.Desc;
	orphan = false;
	compact = true;
	cache: any = {};

	constructor (props: any) {
		super(props);

		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
	};

	render () {
		const space = U.Space.getSpaceview();
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
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.type = this.props.page == 'types' ? I.ObjectContainerType.Type : I.ObjectContainerType.Relation;
		this.refFilter.focus();
		this.initStorage();

		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i]),
			keyMapper: i => (items[i] || {}).id,
		});
	};

	initStorage () {
		const storage = this.storageGet();

		this.orphan = storage.orphan || false;
		this.compact = storage.compact || true;

		this.initSort();
	};

	initSort () {
		const storage = this.storageGet();
		const sort = storage.sort[this.type];

		if (!sort) {
			const options = U.Menu.getObjectContainerSortOptions(this.type, this.sortId, this.sortType, this.orphan, this.compact).filter(it => it.isSort);
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

	};

	getItems () {
		const sections = this.props.page == 'types' ? this.getTypes() : this.getRelations();

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

	getTypes (): any[] {
		const data = S.Record.checkHiddenObjects(S.Record.getTypes());
		const typeStore = S.Record.getRecordIds(J.Constant.subId.typeStore, '')
			.map(id => S.Detail.get(J.Constant.subId.typeStore, id))
			.filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted)
			.map(it => it.id);

		const my = data.filter(it => it.isInstalled && !typeStore.includes(it.sourceObject));
		const system = data.filter(it => U.Object.isInSystemLayouts(it.recommendedLayout) || typeStore.includes(it.sourceObject));

		return [
			{ id: 'my', name: translate('commonMyTypes'), children: my },
			{ id: 'system', name: translate('pageSettingsLibrarySystemTypes'), children: system },
		];
	};

	getRelations (): any[] {
		const data = S.Record.checkHiddenObjects(S.Record.getRelations());
		const systemKeys = Relation.systemKeys();
		const relationStore= S.Record.getRecordIds(J.Constant.subId.relationStore, '')
			.map(id => S.Detail.get(J.Constant.subId.relationStore, id))
			.filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted)
			.map(it => it.id);

		const my = data.filter(it => it.isInstalled && !relationStore.includes(it.sourceObject));
		const system = data.filter(it => systemKeys.includes(it.relationKey) || relationStore.includes(it.sourceObject));


		return [
			{ id: 'my', name: translate('commonMyRelations'), children: my },
			{ id: 'system', name: translate('commonSystemRelations'), children: system },
		];
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

		}, J.Constant.delay.keyboard);
	};

	onFilterClear () {

	};

	onMore (e) {
		e.stopPropagation();

		const options = U.Menu.getObjectContainerSortOptions(this.type, this.sortId, this.sortType, this.orphan, this.compact);

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

					if ([ I.SortId.All, I.SortId.Orphan ].includes(item.id)) {
						this.orphan = item.id == I.SortId.Orphan;
						storage.orphan = this.orphan;

						analytics.event('ChangeLibraryTypeLink', { type: item.id == I.SortId.Orphan ? 'Unlinked' : 'All' });
					} else
					if ([ I.SortId.List, I.SortId.Compact ].includes(item.id)) {
						this.compact = item.id == I.SortId.Compact;
						storage.compact = this.compact;
					}else {
						this.sortId = item.id;
						this.sortType = item.type;

						storage.sort[this.type] = { id: item.id, type: item.type };
						analytics.event('ChangeLibrarySort', { type: item.id, sort: I.SortType[item.type] });
					};

					this.storageSet(storage);
					this.initStorage();

					const options = U.Menu.getObjectContainerSortOptions(this.type, this.sortId, this.sortType, this.orphan, this.compact);

					menuContext.ref.updateOptions(options);
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

	getSubId () {
		return this.props.page == 'types' ? J.Constant.subId.type : J.Constant.subId.relation;
	};

});

export default SidebarSettingsLibrary
