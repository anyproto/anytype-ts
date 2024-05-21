import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Loader, IconObject, ObjectName, EmptySearch, Label, Filter } from 'Component';
import { I, UtilCommon, UtilData, UtilObject, UtilRouter, keyboard, Key, focus, translate, analytics, Action, UtilSpace } from 'Lib';
import { commonStore, dbStore, popupStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	isLoading: boolean;
};

const HEIGHT_SECTION = 26;
const HEIGHT_ITEM = 48;
const LIMIT_HEIGHT = 12;

const PopupSearch = observer(class PopupSearch extends React.Component<I.Popup, State> {
	
	_isMounted = false;
	node: any = null;
	state = {
		isLoading: false,
	};
	refFilter: any = null;
	refList: any = null;
	timeout = 0;
	cache: any = {};
	items: any[] = [];
	n = -1;
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
	};
	
	render () {
		const { isLoading } = this.state;
		const filter = this.getFilter();
		const items = this.getItems();

		const Item = (item: any) => {
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
				icon = <IconObject object={object} size={18} />;
			} else {
				icon = <Icon className={item.icon} />;
			};

			if (item.isObject) {
				content = (
					<React.Fragment>
						<ObjectName object={item} />
						<div className="caption">{item.caption}</div>
					</React.Fragment>
				);
			} else {
				content = (
					<React.Fragment>
						<div className="name">{item.name}</div>
						<div className="caption">
							{item.shortcut.map((item, i) => (
								<Label key={i} text={item} />
							))}
						</div>
					</React.Fragment>
				);
			};

			return (
				<div 
					id={'item-' + item.id} 
					className={[ 'item', (item.isHidden ? 'isHidden' : '') ].join(' ')} 
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
				content = <div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>{item.name}</div>;
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
					<div key="items" className="items left">
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
											rowHeight={({ index }) => this.getRowHeight(items[index])}
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

		this.reload();
		this.rebind();
		this.resize();

		focus.clear(true);

		analytics.event('ScreenSearch', { route });
	};
	
	componentDidUpdate () {
		const items = this.getItems();
		const filter = this.getFilter();

		if (filter != this.filter) {
			this.filter = filter;
			this.reload();
			return;
		};

		this.resize();
		this.setActive(items[this.n]);
		this.refFilter.setValue(this.filter);

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
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
		win.on('resize.search', e => this.resize());
	};

	unbind () {
		$(window).off('keydown.search resize.search');
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

		if ((this.n == -1) && ![ Key.down, Key.enter ].includes(k)) {
			return;
		};

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			this.onArrow(pressed == 'arrowup' ? -1 : 1);
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

	onFilterChange (e: any, v: string) {
		if (this.filter == v) {
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			this.reload();
			analytics.event('SearchInput');
		}, Constant.delay.keyboard);
	};

	onFilterClear () {
		this.reload();
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	reload () {
		this.n = -1;
		this.offset = 0;
		this.top = 0;
		this.load(true);
	};

	load (clear: boolean, callBack?: (value: any) => void) {
		const filter = this.getFilter();
		const templateType = dbStore.getTemplateType();
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getFileAndSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
		];

		if (clear) {
			this.setState({ isLoading: true });
		};

		UtilData.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit: !filter && clear ? 8 : Constant.limit.menuRecords,
		}, (message: any) => {
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
			items.unshift({ name: translate('popupSearchRecentObjects'), isSection: true });
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
				] as any[]).map(it => ({ ...it, isImport: true }));
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

			const settingsItems = settingsAccount.concat(settingsSpace).map(it => ({ ...it, isSettings: true }));
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
			items.push({ id: 'add', name, icon: 'plus', shortcut: [ cmd, 'N' ] });

			if (hasRelations) {
				items.push({ id: 'relation', name: translate('commonAddRelation'), icon: 'relation', shortcut: [ cmd, 'Shift', 'R' ] });
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

		const { close } = this.props;
		const filter = this.getFilter();
		const rootId = keyboard.getRootId();

		close(() => {
			// Object
			if (item.isObject) {
				UtilObject.openEvent(e, { ...item, id: item.id });
			} else 

			// Settings item
			if (item.isSettings) {
				popupStore.open('settings', { data: { page: item.id, isSpace: item.isSpace }, className: item.className });
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
		});

		analytics.event('SearchResult', { index: item.index + 1, length: filter.length });
	};

	getRowHeight (item: any) {
		return item && item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

	getFilter () {
		return this.refFilter ? this.refFilter.getValue() : '';
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId, position } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const content = obj.find('.content');
		const { wh } = UtilCommon.getWindowDimensions();
		const height = Math.min(wh - 64, HEIGHT_ITEM * LIMIT_HEIGHT);

		content.css({ height });
		position();
	};

});

export default PopupSearch;
