import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Loader, IconObject, ObjectName, EmptySearch, Label, Filter } from 'Component';
import { C, I, UtilCommon, UtilData, UtilObject, UtilRouter, keyboard, Key, focus, translate, analytics, Action, UtilSpace } from 'Lib';
import { commonStore, dbStore, popupStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	isLoading: boolean;
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
	};
	refFilter: any = null;
	refList: any = null;
	refRows: any[] = [];
	timeout = 0;
	cache: any = {};
	items: any[] = [];
	n = -1;
	top = 0;
	offset = 0;
	filter = '';
	searchByBacklinks: any = null;
	
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
			const { highlight, relationKey } = meta;
			const relationDetails = meta.relationDetails || {};

			let key: any = '';
			let value: any = '';

			if (relationKey) {
				if (relationKey == 'name') {
					return '';
				} else {
					const relation = dbStore.getRelationByKey(relationKey);
					key = relation ? <div className="key">{relation.name}:</div> : '';
				};
			};

			if (highlight) {
				value = <div className="value" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(meta.highlight) }} />;
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

			if (!value) {
				return '';
			};

			return (
				<div className="context">
					{key}
					{value}
				</div>
			);
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

			if (item.isObject) {
				object = item;
			} else 
			if (item.id == 'account') {
				object = UtilSpace.getParticipant();
			} else 
			if (item.id == 'spaceIndex') {
				object = UtilSpace.getSpaceview();
			};

			if (object) {
				icon = <IconObject object={object} size={40} />;
			} else {
				icon = <Icon className={item.icon} />;
			};

			if (item.isObject) {
				const { metaList } = item;
				const meta = metaList[0] || {};

				let advanced = null;

				if (item.backlinks && item.backlinks.length) {
					advanced = (
						<Icon
							className="advanced"
							tooltip={translate('popupSearchTooltipSearchByBacklinks')}
							tooltipY={I.MenuDirection.Top}
							onClick={(e) => this.onSearchByBacklinks(e, item)}
						/>
					);
				};

				content = (
					<div className="sides">
						<div className="side left">
							<ObjectName object={item} />
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
					<EmptySearch text={filter ? UtilCommon.sprintf(translate('popupSearchEmptyFilter'), filter) : translate('popupSearchEmpty')} />
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

		analytics.event('ScreenSearch', { route });
	};
	
	componentDidUpdate () {
		const items = this.getItems();
		const filter = this.getFilter();

		if (filter != this.filter) {
			this.n = -1;
			this.offset = 0;
			this.top = 0;
			this.filter = filter;
			this.load(true);
			return;
		};

		this.setActive(items[this.n]);
		this.refFilter.setValue(this.filter);

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_SECTION,
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.refFilter && (this.n == -1)) {
			this.refFilter.focus();
		};
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

	resetSearch () {
		this.n = -1;
		this.refFilter?.setValue('');

		this.load(true);
		this.rebind();

		focus.clear(true);
	};
	
	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	onKeyDown (e: any) {
		const items = this.getItems();
		const cmd = keyboard.cmdKey();
		const k = keyboard.eventKey(e);
		const filter = this.getFilter();

		if ((this.n == -1) && ![ Key.down, Key.left, Key.enter ].includes(k)) {
			return;
		};

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown, arrowright, arrowleft', e, (pressed: string) => {
			if ([ 'arrowleft', 'arrowright' ].includes(pressed)) {
				const item = items[this.n];

				if (pressed == 'arrowleft') {
					this.onClearSearch();
					return;
				};

				if (item && item.backlinks && item.backlinks.length) {
					this.onSearchByBacklinks(e, item);
				};
			} else {
				this.onArrow(pressed == 'arrowup' ? -1 : 1);
			};
		});

		keyboard.shortcut(`enter, shift+enter, ${cmd}+enter`, e, (pressed: string) => {
			const regScheme = new RegExp(`^${Constant.protocol}:\/\/`);
			const regUrl = /invite.any.coop\/([a-zA-Z0-9]+)#([a-zA-Z0-9]+)/;

			if (regScheme.test(filter)) {
				const route = filter.replace(regScheme, '');
				if (route) {
					UtilRouter.go(`/${route}`, {});
				};
				return;
			};

			if (filter.match(regUrl)) {
				const [, cid, key] = filter.match(regUrl);
				UtilRouter.go(`/invite/?cid=${cid}&key=${key}`, {});
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

		if ((dir > 0) && (this.n == -1)) {
			this.refFilter.blur();
		};

		this.n += dir;

		if (((dir < 0) && (this.n == -1)) || ((dir > 0) && (this.n > l - 1))) {
			this.n = -1;
			this.refFilter.focus();
			this.refList.scrollToRow(0);
			this.unsetActive();
			return;
		};

		const item = items[this.n];
		if (item.isSection) {
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

		this.n = this.getItems().findIndex(it => it.id == item.id);
		this.unsetActive();

		const node = $(this.node);
		node.find(`#item-${item.id}`).addClass('active');
	};

	unsetActive () {
		const node = $(this.node);
		node.find('.item.active').removeClass('active');
	};

	onFilterChange () {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.forceUpdate(), Constant.delay.keyboard);
	};

	onFilterClear () {
		this.forceUpdate();
	};

	onSearchByBacklinks (e: React.MouseEvent, item: any) {
		e.preventDefault();
		e.stopPropagation();

		this.searchByBacklinks = item;
		this.forceUpdate();
		this.resetSearch();
	};

	onClearSearch () {
		this.searchByBacklinks = null;
		this.forceUpdate();
		this.resetSearch();
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (value: any) => void) {
		const { space } = commonStore;
		const filter = this.getFilter();
		const templateType = dbStore.getTemplateType();
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getFileAndSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: space }
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
		];

		if (this.searchByBacklinks) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: this.searchByBacklinks.backlinks })
		};

		if (clear) {
			this.setState({ isLoading: true });
		};

		C.ObjectSearchWithMeta(filters, sorts, [], filter, this.offset, !filter && clear ? 8 : Constant.limit.menuRecords, (message) => {
			if (message.error.code) {
				this.setState({ isLoading: false });
				return;
			};

			if (callBack) {
				callBack(null);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records || []);

			if (clear) {
				this.setState({ isLoading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	getItems () {
		const cmd = keyboard.cmdSymbol();
		const alt = keyboard.altSymbol();
		const hasRelations = keyboard.isMainEditor() || keyboard.isMainSet();
		const filter = this.getFilter();
		const lang = Constant.default.interfaceLang;
		const canWrite = UtilSpace.canMyParticipantWrite();

		let name = '';
		if (filter) {
			name = UtilCommon.sprintf(translate('commonCreateObject'), filter);
		} else {
			name = translate('popupSearchCreateObject');
		};

		let items = this.items.filter(this.filterMapper);
		if (items.length) {
			const sectionName = this.searchByBacklinks ? UtilCommon.sprintf(translate('popupSearchBacklinksFrom'), this.searchByBacklinks.name) : translate('popupSearchRecentObjects');

			items.unshift({ name: sectionName, isSection: true, withClear: !!this.searchByBacklinks });
		};

		items = items.map(it => {
			const type = dbStore.getTypeById(it.type);

			return { 
				...it,
				caption: !type || type.isDeleted ? translate('commonDeletedType') : type.name,
				isObject: true,
			};
		});

		/* Settings and pages */

		if (filter) {
			const reg = new RegExp(UtilCommon.regexEscape(filter), 'gi');

			let itemsImport: any[] = [];

			if (canWrite) {
				([
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
			];

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
				filtered.sort(UtilData.sortByName);
				filtered.unshift({ name: translate('commonSettings'), isSection: true });

				items = filtered.concat(items);
			};
		};

		if (canWrite) {
			items.push({ name: translate('commonActions'), isSection: true });
			items.push({ id: 'add', name, icon: 'plus', shortcut: [ cmd, 'N' ], isSmall: true });

			if (hasRelations) {
				items.push({ id: 'relation', name: translate('popupSearchAddRelation'), icon: 'relation', shortcut: [ cmd, 'Shift', 'R' ], isSmall: true });
			};
		};

		return items.map(it => {
			it.shortcut = it.shortcut || [];
			return it;
		});
	};

	filterMapper (it: any) {
		if (it.isSection) {
			return true;
		};

		const { config } = commonStore;
		if (!config.debug.hiddenObject && it.isHidden) {
			return false;
		};
		return true;
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
		this.props.close();

		const filter = this.getFilter();
		const rootId = keyboard.getRootId();
		const { metaList } = item;
		const meta = metaList[0] || {};

		// Object
		if (item.isObject) {
			UtilObject.openEvent(e, { ...item, id: item.id }, {
				onRouteChange: () => {
					if (meta.blockId) {
						window.setTimeout(() => {
							const container = UtilCommon.getScrollContainer(false);
							const top = $('#editorWrapper').find(`#block-${meta.blockId}`).position().top;

							container.scrollTop(top);
						}, Constant.delay.route);
					};
				}
			});
		} else 

		// Settings item
		if (item.isSettings) {
			window.setTimeout(() => {
				popupStore.open('settings', { data: { page: item.id, isSpace: item.isSpace }, className: item.className });
			}, popupStore.getTimeout());
		} else 

		// Import action
		if (item.isImport) {
			Action.import(item.format, Constant.fileExtension.import[item.format]);

		// Buttons
		} else {
			switch (item.id) {
				case 'add': {
					keyboard.pageCreate({ name: filter }, 'Search');
					break;
				};

				case 'relation': {
					$('#button-header-relation').trigger('click');
					window.setTimeout(() => $('#menuBlockRelationView #item-add').trigger('click'), menuStore.getTimeout() * 2);
					break;
				};

				case 'graph':
				case 'navigation': {
					UtilObject.openEvent(e, { id: rootId, layout: item.layout });
					break;
				};
			};
		};

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
