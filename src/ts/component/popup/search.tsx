import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Loader, IconObject, ObjectName, EmptySearch, Label, Filter } from 'Component';
import { I, C, S, U, J, keyboard, focus, translate, analytics, Action, Relation, Mark } from 'Lib';

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
	cache: any = {};
	items: any[] = [];
	n = 0;
	top = 0;
	offset = 0;
	filter = '';
	
	constructor (props: I.Popup) {
		super (props);

		this.onClick = this.onClick.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.filterMapper = this.filterMapper.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.onSearchByBacklinks = this.onSearchByBacklinks.bind(this);
		this.onClearSearch = this.onClearSearch.bind(this);
	};
	
	render () {
		const { isLoading } = this.state;
		const filter = this.getFilter();
		const items = this.getItems();

		const Context = (meta: any): any => {
			const { highlight, relationKey, ranges } = meta;
			const relationDetails = meta.relationDetails || {};

			let key: any = '';
			let value: any = '';

			if (relationKey) {
				if ([ 'name', 'type' ].includes(relationKey)) {
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
							tooltip={translate('popupSearchTooltipSearchByBacklinks')}
							tooltipCaption="Shift + Enter"
							tooltipY={I.MenuDirection.Top}
							onClick={e => this.onSearchByBacklinks(e, item)}
						/>
					);
				};

				let name = U.Object.name(item);
				if (meta.highlight && (meta.relationKey == 'name')) {
					name = Mark.toHtml(meta.highlight, meta.ranges.map(it => ({ type: I.MarkType.Highlight, range: it })));
				} else {
					name = U.Common.htmlSpecialChars(name);
				};

				content = (
					<div className="sides">
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
						value={filter}
						ref={ref => this.refFilter = ref} 
						placeholder={translate('popupSearchPlaceholder')}
						onKeyUp={this.onFilterChange}
						onClear={this.onFilterClear}
					/>
				</div>

				{!items.length && !isLoading ? (
					<EmptySearch filter={filter} />
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
		const { param } = this.props;
		const { data } = param;
		const { route } = data;

		this._isMounted = true;
		this.resetSearch();
		this.rebind();

		focus.clear(true);

		analytics.event('ScreenSearch', { route });
	};
	
	componentDidUpdate () {
		const items = this.getItems();
		const filter = this.getFilter();
		const length = this.filter.length;

		if (filter != this.filter) {
			this.filter = filter;
			this.reload();
			return;
		};

		this.setActive(items[this.n]);
		this.refFilter.setValue(this.filter);
		this.refFilter.setRange({ from: length, to: length });

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_SECTION,
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

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
				this.onSearchByBacklinks(e, item);
			};
		});

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			this.onArrow(pressed == 'arrowup' ? -1 : 1);
		});

		keyboard.shortcut(`enter, ${cmd}+enter`, e, (pressed: string) => {
			const regScheme = new RegExp(`^${J.Constant.protocol}:\/\/`);
			const regUrl = /invite.any.coop\/([a-zA-Z0-9]+)#([a-zA-Z0-9]+)/;

			if (regScheme.test(filter)) {
				const route = filter.replace(regScheme, '');
				if (route) {
					U.Router.go(`/${route}`, {});
				};
				return;
			};

			if (filter.match(regUrl)) {
				const [, cid, key] = filter.match(regUrl);
				U.Router.go(`/invite/?cid=${cid}&key=${key}`, {});
				return;
			};

			const item = items[this.n];
			if (item) {
				this.onClick(e, item);
			};
		});
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

	onFilterChange (e: any, v: string) {
		if (this.filter == v) {
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			this.forceUpdate();
			analytics.event('SearchInput');
		}, J.Constant.delay.keyboard);
	};

	onFilterClear () {
		this.reload();
	};

	onSearchByBacklinks (e: React.MouseEvent, item: any) {
		e.preventDefault();
		e.stopPropagation();

		this.setState({ backlink: item }, () => {
			this.resetSearch();

			analytics.event('SearchBacklink');
		});
	};

	onClearSearch () {
		this.setState({ backlink: null }, () => {
			this.resetSearch();
		});
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
		const filter = this.getFilter();
		const templateType = S.Record.getTemplateType();
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: space }
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		];

		let limit = J.Constant.limit.menuRecords;

		if (!filter && clear && !backlink) {
			limit = 8;
		};

		if (backlink) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: [].concat(backlink.links, backlink.backlinks) });
		};

		if (clear) {
			this.setState({ isLoading: true });
		};

		C.ObjectSearchWithMeta(filters, sorts, J.Relation.default.concat([ 'links', 'backlinks' ]), filter, this.offset, limit, (message) => {
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

			if (clear) {
				this.setState({ isLoading: false }, callBack);
			} else {
				this.forceUpdate(callBack);
			};
		});
	};

	getItems () {
		const { config } = S.Common;
		const { backlink } = this.state;
		const cmd = keyboard.cmdSymbol();
		const alt = keyboard.altSymbol();
		const hasRelations = keyboard.isMainEditor() || keyboard.isMainSet();
		const filter = this.getFilter();
		const lang = J.Constant.default.interfaceLang;
		const canWrite = U.Space.canMyParticipantWrite();

		let name = '';
		if (filter) {
			name = U.Common.sprintf(translate('commonCreateObjectWithName'), filter);
		} else {
			name = translate('commonCreateObject');
		};

		let items = this.items.filter(it => this.filterMapper(it, config));

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
				caption: !type || type.isDeleted ? translate('commonDeletedType') : type.name,
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
					id: 'appearance', icon: 'settings-appearance', name: translate('popupSettingsAppearanceTitle'), 
					aliases: [ translate('commonSidebar', lang), translate('commonSidebar') ] 
				},
				{ id: 'pinIndex', icon: 'settings-pin', name: translate('popupSettingsPinTitle') },
				{ id: 'dataManagement', icon: 'settings-storage', name: translate('popupSettingsDataManagementTitle') },
				{ id: 'phrase', icon: 'settings-phrase', name: translate('popupSettingsPhraseTitle') },
			];

			const pageItems: any[] = [
				{ id: 'graph', icon: 'graph', name: translate('commonGraph'), shortcut: [ cmd, alt, 'O' ], layout: I.ObjectLayout.Graph },
				{ id: 'navigation', icon: 'navigation', name: translate('commonFlow'), shortcut: [ cmd, 'O' ], layout: I.ObjectLayout.Navigation },
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
			items.push({ id: 'add', name, icon: 'plus', shortcut: [ cmd, 'N' ], isSmall: true });

			if (hasRelations) {
				items.push({ id: 'relation', name: translate('commonAddRelation'), icon: 'relation', shortcut: [ cmd, 'Shift', 'R' ], isSmall: true });
			};
		};

		return items.map(it => {
			it.shortcut = it.shortcut || [];
			return it;
		});
	};

	filterMapper (it: any, config: any) {
		return !(it.isHidden && !config.debug.hiddenObject);
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

		const { close } = this.props;
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
				S.Popup.open('settings', { data: { page: item.id, isSpace: item.isSpace }, className: item.className });
			} else 

			// Import action
			if (item.isImport) {
				Action.import(item.format, J.Constant.fileExtension.import[item.format]);

			// Buttons
			} else {
				switch (item.id) {
					case 'add': {
						keyboard.pageCreate({ name: filter }, 'Search');
						break;
					};

					case 'relation': {
						$('#button-header-relation').trigger('click');
						window.setTimeout(() => $('#menuBlockRelationView #item-add').trigger('click'), S.Menu.getTimeout() * 2);
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

		analytics.event('SearchResult', { index: item.index + 1, length: filter.length });
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
