import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Loader, IconObject, EmptySearch, Label, Filter, ObjectType } from 'Component';
import { I, C, S, U, J, keyboard, focus, translate, analytics, Action, Relation, Mark, sidebar } from 'Lib';

interface State {
	isLoading: boolean;
	backlink: any;
};

const HEIGHT_SECTION = 28;
const HEIGHT_SMALL = 38;
const HEIGHT_ITEM = 60;
const LIMIT_HEIGHT = 15;

const PopupSearch = observer(class PopupSearch extends React.Component<I.Popup, State> {
	
	_isMounted = false;
	node: any = null;
	state = {
		isLoading: false,
		backlink: null,
	};
	refFilter: any = null;
	refList: any = null;
	refRows: any[] = [];
	timeout = 0;
	delay = 0;
	cache: any = {};
	items: any[] = [];
	n = 0;
	top = 0;
	offset = 0;
	filter = '';
	range: I.TextRange = { from: 0, to: 0 };
	
	constructor (props: I.Popup) {
		super (props);

		this.onClick = this.onClick.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onFilterSelect = this.onFilterSelect.bind(this);
		this.onBacklink = this.onBacklink.bind(this);
		this.onClearSearch = this.onClearSearch.bind(this);
		this.onContext = this.onContext.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { isLoading } = this.state;
		const items = this.getItems();
		const shift = keyboard.shiftSymbol();

		const Context = (meta: any): any => {
			const { highlight, relationKey, ranges } = meta;
			const relationDetails = meta.relationDetails || {};

			let key: any = '';
			let value: any = '';

			if (relationKey) {
				if ([ 'name', 'pluralName', 'type' ].includes(relationKey)) {
					return '';
				} else {
					const relation = S.Record.getRelationByKey(relationKey);
					key = relation ? <div className="key">{relation.name}:</div> : '';
				};
			};

			if (highlight) {
				const text = Mark.toHtml(highlight, ranges.map(it => ({ type: I.MarkType.Highlight, range: it })));

				value = <div className="value" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} />;
			} else 
			if (relationDetails.name) {
				const { relationOptionColor } = relationDetails;
				const color = relationOptionColor ? `textColor-${relationOptionColor}` : '';
				const cn = [ 'value' ];

				if (color) {
					cn.push(`textColor-${relationOptionColor}`);
					cn.push(`bgColor-${relationOptionColor}`);
				};

				value = <div className={cn.join(' ')}>{relationDetails.name}</div>;
			};

			return value ? (
				<div className="context">
					{key}
					{value}
				</div>
			) : '';
		};

		const Item = (item: any) => {
			const cn = [ 'item' ];

			if (item.isHidden) {
				cn.push('isHidden');
			};
			if (item.isSmall) {
				cn.push('isSmall');
			};

			let content = null;
			let icon = null;
			let object = null;
			let size = 40;

			if (item.isObject) {
				object = item;
			} else 
			if (item.id == 'account') {
				object = U.Space.getParticipant();
			} else 
			if (item.id == 'spaceIndex') {
				object = U.Space.getSpaceview();
			};

			if ([ 'account', 'spaceIndex' ].includes(item.id)) {
				size = 20;
			};

			if (object) {
				icon = <IconObject object={object} size={size} />;
			} else {
				icon = <Icon className={item.icon} />;
			};

			if (item.isObject) {
				const { metaList } = item;
				const meta = metaList[0] || {};

				let advanced = null;

				if (item.links.length || item.backlinks.length) {
					advanced = (
						<Icon
							className="advanced"
							tooltipParam={{ text: translate('popupSearchTooltipSearchByBacklinks'), caption: `${shift} + Enter` }}
							onClick={e => this.onBacklink(e, item)}
						/>
					);
				};

				let name = U.Object.name(item, true);

				if (meta.highlight && [ 'name', 'pluralName' ].includes(meta.relationKey)) {
					name = Mark.toHtml(meta.highlight, meta.ranges.map(it => ({ type: I.MarkType.Highlight, range: it })));

					if (U.Object.isInFileLayouts(item.layout)) {
						name = U.File.name({ ...object, name });
					};
				} else {
					name = U.Common.htmlSpecialChars(name);
				};

				content = (
					<div className="sides" onContextMenu={e => this.onContext(e, item)}>
						<div className="side left">
							<div className="name" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(name) }} />
							<Context {...meta} />
							<div className="caption">{item.caption}</div>
						</div>
						<div className="side right">
							{advanced}
						</div>
					</div>
				);
			} else {
				content = (
					<div className="sides">
						<div className="side left">
							<div className="name">{item.name}</div>
						</div>
						<div className="side right">
							<div className="caption">
								{item.shortcut.map((item, i) => (
									<Label key={i} text={item} />
								))}
							</div>
						</div>
					</div>
				);
			};

			return (
				<div
					ref={node => this.refRows[item.index] = node}
					id={`item-${item.id}`} 
					className={cn.join(' ')}
					onMouseOver={e => this.onOver(e, item)} 
					onClick={e => this.onClick(e, item)}
				>
					{icon}
					{content}
				</div>
			);
		};

		const rowRenderer = ({ index, key, style, parent }) => {
			const item = items[index];

			let content = null;
			if (item.isSection) {
				content = (
					<div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>
						{item.name}
						{item.withClear ? <div onClick={this.onClearSearch} className="clear">{translate('commonClear')}</div> : ''}
					</div>
				);
			} else {
				content = (
					<div className="row" style={style}>
						<Item {...item} index={index} />
					</div>
				);
			};

			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				{isLoading ? <Loader id="loader" /> : ''}
				
				<div className="head">
					<Filter 
						icon="search"
						value={this.filter}
						ref={ref => this.refFilter = ref} 
						placeholder={translate('popupSearchPlaceholder')}
						onSelect={this.onFilterSelect}
						onChange={v => this.onFilterChange(v)}
						onKeyUp={(e, v) => this.onFilterChange(v)}
						onClear={this.onFilterClear}
					/>
				</div>

				{!items.length && !isLoading ? (
					<EmptySearch filter={this.filter} />
				) : ''}
				
				{this.cache && items.length && !isLoading ? (
					<div key="items" className="items">
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!items[index]}
							threshold={LIMIT_HEIGHT}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={ref => this.refList = ref}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={param => this.getRowHeight(items[param.index], param.index)}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											onScroll={this.onScroll}
											scrollToAlignment="center"
											overscanRowCount={20}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		const { param, storageGet } = this.props;
		const { data } = param;
		const { route } = data;
		const storage = storageGet();
		const { backlink } = storage;
		const filter = String(storage.filter || '');

		const setFilter = () => {
			if (!this.refFilter) {
				return;
			};

			this.range = { from: 0, to: filter.length };
			this.refFilter.setValue(filter);
			this.refFilter.setRange(this.range);
			this.reload();
		};

		this._isMounted = true;
		this.initCache();
		this.rebind();

		focus.clear(true);

		if (backlink) {
			U.Object.getById(backlink, {}, item => this.setBacklink(item, 'Saved', () => setFilter()));
		} else {
			setFilter();
		};

		analytics.event('ScreenSearch', { route, type: (filter ? 'Saved' : 'Empty') });
	};
	
	componentDidUpdate () {
		const items = this.getItems();

		this.initCache();
		this.setActive(items[this.n]);

		if (this.refList) {
			this.refList.recomputeRowHeights(0);
			this.refList.scrollToPosition(this.top);
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		C.ObjectSearchUnsubscribe([ J.Constant.subId.search ]);
		window.clearTimeout(this.timeout);
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.search', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.search');
	};

	initCache () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_SECTION,
			keyMapper: i => (items[i] || {}).id,
		});
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	onKeyDown (e: any) {
		e.stopPropagation();

		if (keyboard.isComposition) {
			return;
		};

		const { close } = this.props;
		const { backlink } = this.state;
		const items = this.getItems();
		const cmd = keyboard.cmdKey();
		const filter = this.getFilter();
		const item = items[this.n];

		keyboard.disableMouse(true);

		keyboard.shortcut('escape', e, () => {
			if (backlink) {
				this.onClearSearch();
			} else {
				close();
			};
		});

		keyboard.shortcut('shift+enter', e, () => {
			if (item && (item.links.length || item.backlinks.length)) {
				this.onBacklink(e, item);
			};
		});

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			this.onArrow(pressed == 'arrowup' ? -1 : 1);
		});

		keyboard.shortcut(`enter, ${cmd}+enter`, e, () => {
			const route = U.Common.getRouteFromUrl(filter);

			if (route) {
				U.Router.go(route, {});
				return;
			};

			const item = items[this.n];
			if (item) {
				this.onClick(e, item);
			};
		});

		keyboard.shortcut('createObject', e, () => {
			e.preventDefault();

			this.pageCreate(filter);
		})
	};

	onArrow (dir: number) {
		if (!this.refList) {
			return;
		};

		const items = this.getItems();
		const l = items.length;

		this.n += dir;

		if ((dir > 0) && (this.n > l - 1)) {
			this.n = 0;
		};

		if ((dir < 0) && (this.n < 0)) {
			this.n = l - 1;
		};

		const item = items[this.n];
		if (item && item.isSection) {
			this.onArrow(dir);
			return;
		};

		this.refList.scrollToRow(Math.max(0, this.n));
		this.setActive(item);
	};

	setActive (item: any) {
		if (!item) {
			return;
		};

		const node = $(this.node);

		this.n = this.getItems().findIndex(it => it.id == item.id);
		this.unsetActive();

		node.find(`#item-${item.id}`).addClass('active');
	};

	unsetActive () {
		const node = $(this.node);
		node.find('.item.active').removeClass('active');
	};

	onFilterChange (v: string) {
		const { storageSet, param } = this.props;
		const { data } = param;
		const { route } = data;

		window.clearTimeout(this.timeout);

		if (v && (this.filter == v)) {
			return;
		};

		this.timeout = window.setTimeout(() => {
			storageSet({ filter: v });

			if (this.filter != v) {
				analytics.event('SearchInput', { route });
			};

			this.filter = v;
			this.range = this.refFilter?.getRange();
			this.reload();

			if (!this.delay) {
				this.delay = J.Constant.delay.keyboard;
			};
		}, this.delay);
	};

	onFilterSelect (e: any) {
		this.range = this.refFilter.getRange();
	};

	onFilterClear () {
		const { param, storageSet } = this.props;
		const { data } = param;
		const { route } = data;

		storageSet({ filter: '' });
		analytics.event('SearchInput', { route });
	};

	onBacklink (e: React.MouseEvent, item: any) {
		e.preventDefault();
		e.stopPropagation();

		this.props.storageSet({ backlink: item.id });
		this.setBacklink(item, 'Empty');
	};

	setBacklink (item: any, type: string, callBack?: () => void) {
		const { param } = this.props;
		const { data } = param;
		const { route } = data;

		this.setState({ backlink: item }, () => {
			this.resetSearch();
			analytics.event('SearchBacklink', { route, type });

			if (callBack) {
				callBack();
			};
		});
	};

	onClearSearch () {
		this.props.storageSet({ backlink: '' });
		this.setState({ backlink: null }, () => this.resetSearch());
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, () => resolve(null));
		});
	};

	resetSearch () {
		this.refFilter?.setValue('');
		this.reload();
	};

	reload () {
		this.n = 0;
		this.offset = 0;
		this.top = 0;
		this.load(true, () => {
			const items = this.getItems().filter(it => !it.isSection);

			if (items.length) {
				window.setTimeout(() => this.setActive(items[0]));
			};
		});
	};

	load (clear: boolean, callBack?: () => void) {
		const { space } = S.Common;
		const { backlink } = this.state;
		const filter = this.filter;
		const layouts = U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it));
		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: layouts },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		].map(U.Data.sortMapper);

		let limit = J.Constant.limit.menuRecords;

		if (!filter && clear && !backlink) {
			limit = 8;
		};

		if (backlink) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: [].concat(backlink.links, backlink.backlinks) });
		};

		if (clear) {
			this.setState({ isLoading: true });
		};

		C.ObjectSearchWithMeta(space, filters, sorts, J.Relation.default.concat([ 'pluralName', 'links', 'backlinks', '_score' ]), filter, this.offset, limit, (message) => {
			if (message.error.code) {
				this.setState({ isLoading: false });
				return;
			};

			if (clear) {
				this.items = [];
			};

			const records = (message.records || []).map(it => {
				it = S.Detail.mapper(it);
				it.links = Relation.getArrayValue(it.links);
				it.backlinks = Relation.getArrayValue(it.backlinks);
				return it;
			});

			this.items = this.items.concat(records);

			if (this.items.length) {
				U.Data.subscribeIds({
					subId: J.Constant.subId.search,
					ids: this.items.map(it => it.id),
					noDeps: true,
				});
			};

			if (clear) {
				this.setState({ isLoading: false }, callBack);
			} else {
				this.forceUpdate(callBack);
			};
		});

	};

	getItems () {
		const { backlink } = this.state;
		const filter = this.getFilter();
		const lang = J.Constant.default.interfaceLang;
		const canWrite = U.Space.canMyParticipantWrite();

		let name = '';
		if (filter) {
			name = U.Common.sprintf(translate('commonCreateObjectWithName'), filter);
		} else {
			name = translate('commonCreateObject');
		};

		let items = S.Record.checkHiddenObjects(this.items);

		if (backlink) {
			items.unshift({ name: U.Common.sprintf(translate('popupSearchBacklinksFrom'), backlink.name), isSection: true, withClear: true });
		} else 
		if (!filter && items.length) {
			items.unshift({ name: translate('popupSearchRecentObjects'), isSection: true });
		};

		items = items.map(it => {
			const type = S.Record.getTypeById(it.type);

			return { 
				...it,
				caption: <ObjectType object={type} />,
				isObject: true,
			};
		});

		/* Settings and pages */

		if (filter) {
			const reg = new RegExp(U.Common.regexEscape(filter), 'gi');

			let itemsImport: any[] = [];
			if (canWrite) {
				itemsImport = ([
					{ id: 'importHtml', icon: 'import-html', name: translate('popupSettingsImportHtmlTitle'), format: I.ImportType.Html },
					{ id: 'importText', icon: 'import-text', name: translate('popupSettingsImportTextTitle'), format: I.ImportType.Text },
					{ id: 'importProtobuf', icon: 'import-protobuf', name: translate('popupSettingsImportProtobufTitle'), format: I.ImportType.Protobuf },
					{ id: 'importMarkdown', icon: 'import-markdown', name: translate('popupSettingsImportMarkdownTitle'), format: I.ImportType.Markdown },
				] as any[]).map(it => ({ ...it, isImport: true, isSmall: true }));
			};

			let settingsSpace: any[] = [
				{ id: 'spaceIndex', name: translate('popupSettingsSpaceTitle') },

				{ id: 'exportIndex', icon: 'settings-export', name: translate('popupSettingsExportTitle') },
				{ id: 'exportProtobuf', icon: 'import-protobuf', name: translate('popupSettingsExportProtobufTitle') },
				{ id: 'exportMarkdown', icon: 'import-markdown', name: translate('popupSettingsExportMarkdownTitle') },
			];

			if (canWrite) {
				settingsSpace = settingsSpace.concat([
					{ id: 'importIndex', icon: 'settings-import', name: translate('popupSettingsImportTitle') },
					{ id: 'importNotion', icon: 'import-notion', name: translate('popupSettingsImportNotionTitle') },
					{ id: 'importCsv', icon: 'import-csv', name: translate('popupSettingsImportCsvTitle') },
				]);
			};

			settingsSpace = settingsSpace.map(it => ({ ...it, isSpace: true, className: 'isSpace' }));
			
			const settingsAccount: any[] = [
				{ id: 'account', name: translate('popupSettingsProfileTitle') },
				{ 
					id: 'personal', icon: 'settings-personal', name: translate('popupSettingsPersonalTitle'),
					aliases: [ 
						translate('commonLanguage', lang), translate('commonLanguage'),
						translate('commonSpelling', lang), translate('commonSpelling'),
					] 
				},
				{ 
					id: 'personal', icon: 'settings-personal', name: translate('pageSettingsColorMode'),
					aliases: [ translate('commonSidebar', lang), translate('commonSidebar') ] 
				},
				{ id: 'pinIndex', icon: 'settings-pin', name: translate('popupSettingsPinTitle') },
				{ id: 'dataIndex', icon: 'settings-storage', name: translate('popupSettingsDataManagementTitle') },
				{ id: 'phrase', icon: 'settings-phrase', name: translate('popupSettingsPhraseTitle') },
			];

			const pageItems: any[] = [
				{ id: 'graph', icon: 'graph', name: translate('commonGraph'), shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('graph')), layout: I.ObjectLayout.Graph },
				{ id: 'navigation', icon: 'navigation', name: translate('commonFlow'), shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('navigation')), layout: I.ObjectLayout.Navigation },
			].map(it => ({ ...it, isSmall: true }));

			const settingsItems = settingsAccount.concat(settingsSpace).map(it => ({ ...it, isSettings: true, isSmall: true }));
			const filtered = itemsImport.concat(settingsItems).concat(pageItems).filter(it => {
				if (it.name.match(reg)) {
					return true;
				};

				if (it.aliases && it.aliases.length) {
					for (const alias of it.aliases) {
						if (alias.match(reg)) {
							return true;
						};
					};
				};

				return false;
			});

			if (filtered.length) {
				filtered.sort(U.Data.sortByName);
				filtered.unshift({ name: translate('commonSettings'), isSection: true });

				items = filtered.concat(items);
			};
		};

		if (canWrite) {
			items.push({ name: translate('commonActions'), isSection: true });
			items.push({ id: 'add', name, icon: 'plus', shortcut: keyboard.getSymbolsFromKeys(keyboard.getKeys('createObject')), isSmall: true });
		};

		return items.map(it => {
			it.shortcut = it.shortcut || [];
			return it;
		});
	};

	pageCreate (name: string) {
		keyboard.pageCreate({ name }, analytics.route.search, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.n = item.index;
			this.setActive(item);
		};
	};

	onClick (e: any, item: any) {
		if (!item) {
			return;
		};

		if (e.persist) {
			e.persist();
		};

		e.stopPropagation();

		const { close, param } = this.props;
		const { data } = param;
		const { route } = data;
		const filter = this.getFilter();
		const rootId = keyboard.getRootId();
		const metaList = item.metaList || [];
		const meta = metaList.length ? metaList[0] : {};

		close(() => {
			// Object
			if (item.isObject) {
				U.Object.openEvent(e, { ...item, id: item.id }, {
					onRouteChange: () => {
						if (!meta.blockId) {
							return;
						};

						window.setTimeout(() => {
							focus.scroll(keyboard.isPopup(), meta.blockId);
						}, J.Constant.delay.route);
					}
				});
			} else 

			// Settings item
			if (item.isSettings) {
				U.Object.openAuto({ id: item.id, layout: I.ObjectLayout.Settings });
			} else 

			// Import action
			if (item.isImport) {
				Action.import(item.format, J.Constant.fileExtension.import[item.format]);

			// Buttons
			} else {
				switch (item.id) {
					case 'add': {
						this.pageCreate(filter)
						break;
					};

					case 'graph':
					case 'navigation': {
						U.Object.openEvent(e, { id: rootId, layout: item.layout });
						break;
					};
				};
			};
		});

		analytics.event('SearchResult', { route, index: item.index + 1, length: filter.length });
	};

	onContext (e: any, item: any) {
		const { getId, param } = this.props;
		const { data } = param;
		const { route } = data;

		S.Menu.open('objectContext', {
			element: `#${getId()} #item-${item.id}`,
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			className: 'fixed',
			classNameWrap: 'fromPopup',
			vertical: I.MenuDirection.Center,
			data: {
				subId: J.Constant.subId.search,
				route,
				objectIds: [ item.id ],
			},
		});
	};

	getRowHeight (item: any, index: number) {
		let h = HEIGHT_ITEM;
		if (item.isSection) {
			h = HEIGHT_SECTION;
		} else 
		if (item.isSmall) {
			h = HEIGHT_SMALL;
		};
		if (this.cache && this.cache.rowHeight) {
			h = Math.max(this.cache.rowHeight({ index }), h);
		};
		return h;
	};

	getFilter () {
		return this.refFilter ? this.refFilter.getValue() : '';
	};

});

export default PopupSearch;
