import React, { forwardRef, useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Loader, IconObject, EmptySearch, Label, Filter, ObjectType } from 'Component';
import { I, C, S, U, J, keyboard, focus, translate, analytics, Action, Relation, Mark, sidebar } from 'Lib';

const HEIGHT_SECTION = 28;
const HEIGHT_SMALL = 38;
const HEIGHT_ITEM = 60;
const LIMIT_HEIGHT = 15;

const isMac = U.Common.isPlatformMac();

const PopupSearch = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, storageGet, storageSet, getId, close } = props;
	const { data } = param;
	const { route, onObjectSelect, skipIds } = data;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const backlinkRef = useRef(null);
	const nodeRef = useRef(null);
	const filterInputRef = useRef(null);
	const listRef = useRef(null);
	const rowsRef = useRef([]);
	const timeoutRef = useRef(0);
	const rebindTimeoutRef = useRef(0);
	const delayRef = useRef(0);
	const cacheRef = useRef({});
	const itemsRef = useRef([]);
	const nRef = useRef(0);
	const topRef = useRef(0);
	const offsetRef = useRef(0);
	const rangeRef = useRef<I.TextRange>({ from: 0, to: 0 });
	const storage = storageGet();
	const filter = String(storage.filter || '');
	const filterValueRef = useRef(filter);

	cacheRef.current = new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_SECTION });

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			topRef.current = scrollTop;
		};
	};

	const rebind = () => {
		unbind();

		const win = $(window);

		win.on('keydown.search', e => onKeyDown(e));
		win.on('archiveObject.search', (e: any, data: any) => {
			const ids = U.Common.objectCopy(data.ids);
			itemsRef.current = itemsRef.current.filter(it => !ids.includes(it.id));

			setDummy(dummy + 1);
		});
	};

	const unbind = () => {
		$(window).off('keydown.search archiveObject.search');
	};

	const onKeyDown = (e: any) => {
		e.stopPropagation();

		if (keyboard.isComposition) {
			return;
		};

		const items = getItems();
		const cmd = keyboard.cmdKey();
		const filter = getFilter();
		const item = items[nRef.current];
		const shortcutPrev = isMac ? 'arrowup, ctrl+p' : 'arrowup';
		const shortcutNext = isMac ? 'arrowdown, ctrl+n' : 'arrowdown';
		keyboard.disableMouse(true);
		keyboard.shortcut('escape', e, () => {
			if (backlinkRef.current) {
				onClearSearch();
			} else {
				close();
			};
		});

		keyboard.shortcut('shift+enter', e, () => {
			const links = Relation.getArrayValue(item.links);
			const backlinks = Relation.getArrayValue(item.backlinks);

			if (item && (links.length || backlinks.length)) {
				onBacklink(e, item);
			};
		});

		keyboard.shortcut(`${shortcutPrev}, ${shortcutNext}` , e, (pressed: string) => {
			const dir = [ 'arrowup', 'ctrl+p' ].includes(pressed) ? -1 : 1;
			onArrow(dir);
		});

		keyboard.shortcut(`enter, ${cmd}+enter`, e, () => {
			const route = U.Common.getRouteFromUrl(filter);

			if (route) {
				U.Router.go(route, {});
				return;
			};

			const item = items[nRef.current];
			if (item) {
				onClick(e, item);
			};
		});

		keyboard.shortcut(`${cmd}+l`, e, () => {
			e.preventDefault();

			const item = items[nRef.current];
			if (item && item.isObject) {
				U.Object.copyLink(item, S.Common.space, 'web', route);
			};
		});

		keyboard.shortcut('createObject', e, () => {
			e.preventDefault();
			e.stopPropagation();

			close(() => pageCreate(filter));
		});

		keyboard.shortcut('search', e, () => close());
	};

	const onArrow = (dir: number) => {
		if (!listRef.current) {
			return;
		};

		const items = getItems();
		const l = items.length;

		nRef.current += dir;

		if ((dir > 0) && (nRef.current > l - 1)) {
			nRef.current = 0;
		};

		if ((dir < 0) && (nRef.current < 0)) {
			nRef.current = l - 1;
		};

		const item = items[nRef.current];
		if (item && item.isSection) {
			onArrow(dir);
			return;
		};

		listRef.current.scrollToRow(Math.max(0, nRef.current));
		setActive(item);
	};

	const setActive = (item: any) => {
		if (!item) {
			return;
		};

		const node = $(nodeRef.current);

		nRef.current = getItems().findIndex(it => it.id == item.id);
		unsetActive();

		node.find(`#item-${item.id}`).addClass('active');
	};

	const unsetActive = () => {
		$(nodeRef.current).find('.item.active').removeClass('active');
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeoutRef.current);

		if (filterValueRef.current == v) {
			return;
		};

		timeoutRef.current = window.setTimeout(() => {
			storageSet({ filter: v });

			if (filterValueRef.current != v) {
				analytics.event('SearchInput', { route });
			};

			filterValueRef.current = v;
			rangeRef.current = filterInputRef.current?.getRange();
			reload();

			if (!delayRef.current) {
				delayRef.current = J.Constant.delay.keyboard;
			};
		}, delayRef.current);
	};

	const onFilterSelect = (e: any) => {
		rangeRef.current = filterInputRef.current.getRange();
	};

	const onFilterClear = () => {
		storageSet({ filter: '' });
		analytics.event('SearchInput', { route });
	};

	const onBacklink = (e: React.MouseEvent, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		storageSet({ backlink: item.id });
		filterInputRef.current?.setValue('');
		setBacklinkState(item, 'Empty', () => reload());
	};

	const setBacklinkState = (item: any, type: string, callBack?: () => void) => {
		filterInputRef.current?.setValue('');
		backlinkRef.current = item;

		analytics.event('SearchBacklink', { route, type });
		callBack?.();
	};

	const onClearSearch = () => {
		offsetRef.current = 0;
		filterInputRef.current?.setValue('');
		backlinkRef.current = null;

		storageSet({ backlink: '' });
		reload();
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			offsetRef.current += J.Constant.limit.menuRecords;
			load(false, () => resolve(null));
		});
	};

	const reload = () => {
		nRef.current = 0;
		offsetRef.current = 0;
		topRef.current = 0;
		load(true, () => {
			const items = getItems().filter(it => !it.isSection);

			if (items.length) {
				window.setTimeout(() => setActive(items[0]));
			};
		});
	};

	const load = (clear: boolean, callBack?: () => void) => {
		const { space } = S.Common;
		const layouts = U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it));
		const filters: any[] = U.Subscription.getBaseFilters().concat([
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: layouts },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
		]);
		const sorts = [
			{ relationKey: '_score', type: I.SortType.Desc },
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		].map(U.Subscription.sortMapper);

		let limit = J.Constant.limit.menuRecords;

		if (!filterValueRef.current && clear && !backlinkRef.current) {
			limit = 9;
		};

		if (backlinkRef.current) {
			const links = Relation.getArrayValue(backlinkRef.current.links);
			const backlinks = Relation.getArrayValue(backlinkRef.current.backlinks);

			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: [].concat(links, backlinks) });
		};

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			setIsLoading(true);
		};

		C.ObjectSearchWithMeta(space, filters, sorts, J.Relation.default.concat([ 'pluralName', 'links', 'backlinks', '_score' ]), filterValueRef.current, offsetRef.current, limit, (message) => {
			if (message.error.code) {
				setIsLoading(false);
				return;
			};

			if (clear) {
				itemsRef.current = [];
			};

			const records = (message.records || []).map(it => {
				it = S.Detail.mapper(it);
				it.links = Relation.getArrayValue(it.links);
				it.backlinks = Relation.getArrayValue(it.backlinks);
				return it;
			});

			itemsRef.current = itemsRef.current.concat(records);

			if (itemsRef.current.length) {
				U.Subscription.destroyList([ J.Constant.subId.search ], true, () => {
					U.Subscription.subscribeIds({
						subId: J.Constant.subId.search,
						ids: itemsRef.current.map(it => it.id),
						noDeps: true,
					});
				});
			};

			if (clear) {
				setIsLoading(false);
			};

			callBack?.();
		});
	};

	const getItems = () => {
		const filter = getFilter();
		const lang = J.Constant.default.interfaceLang;
		const canWrite = U.Space.canMyParticipantWrite();

		let name = '';
		if (filter) {
			name = U.String.sprintf(translate('commonCreateObjectWithName'), filter);
		} else {
			name = translate('commonCreateObject');
		};

		let items = S.Record.checkHiddenObjects(itemsRef.current);

		if (backlinkRef.current) {
			items.unshift({ name: U.String.sprintf(translate('popupSearchBacklinksFrom'), backlinkRef.current.name), isSection: true, withClear: true });
		} else
		if (!filter && items.length) {
			items.unshift({ name: translate('popupSearchRecentObjects'), isSection: true });
		};

		items = items.map(it => {
			it.isObject = true;
			return it;
		});

		if (onObjectSelect) {
			return items;
		};

		/* Settings and pages */

		if (filter) {
			const reg = new RegExp(U.String.regexEscape(filter), 'gi');

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
				{ id: 'dataIndex', icon: 'settings-storage', name: translate('popupSettingsLocalStorageTitle') },
				{ id: 'phrase', icon: 'settings-phrase', name: translate('popupSettingsPhraseTitle') },
				{ id: 'spaceList', icon: 'settings-spaces', name: translate('popupSettingsSpacesListTitle') },
				{ id: 'dataPublish', icon: 'settings-sites', name: translate('popupSettingsDataManagementDataPublishTitle') },
				{ id: 'api', icon: 'settings-api', name: translate('popupSettingsApiTitle') },
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

	const pageCreate = (name: string) => {
		keyboard.pageCreate({ name }, analytics.route.search, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			nRef.current = item.index;
			setActive(item);
		};
	};

	const onClick = (e: any, item: any) => {
		if (!item) {
			return;
		};

		if (e.persist) {
			e.persist();
		};

		e.stopPropagation();

		const filter = getFilter();
		const rootId = keyboard.getRootId();
		const metaList = item.metaList || [];
		const meta = metaList.length ? metaList[0] : {};

		close(() => {
			// Object
			if (item.isObject) {
				if (onObjectSelect) {
					onObjectSelect(item);
					return;
				};

				U.Object.openEvent(e, { ...item, id: item.id }, {
					onRouteChange: () => {
						if (!meta.blockId) {
							return;
						};

						window.setTimeout(() => {
							focus.scroll(keyboard.isPopup(), meta.blockId);
						}, J.Constant.delay.route);
					},
				});
			} else

			// Settings item
			if (item.isSettings) {
				Action.openSettings(item.id, '');
			} else
			// Import action
			if (item.isImport) {
				Action.import(item.format, J.Constant.fileExtension.import[item.format]);

			// Buttons
			} else {
				switch (item.id) {
					case 'add': {
						pageCreate(filter);
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

	const onContext = (e: any, item: any) => {
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
				allowedNewTab: true,
			},
		});
	};

	const getRowHeight = (item: any, index: number) => {
		let h = HEIGHT_ITEM;
		if (item.isSection) {
			h = HEIGHT_SECTION;
		} else
		if (item.isSmall) {
			h = HEIGHT_SMALL;
		};
		if (cacheRef.current && (cacheRef.current as any).rowHeight) {
			h = Math.max((cacheRef.current as any).rowHeight({ index }), h);
		};
		return h;
	};

	const getFilter = () => {
		return String(filterInputRef.current?.getValue() || '');
	};

	useEffect(() => {
		const storage = storageGet();
		const filter = String(storage.filter || '');

		const setFilter = () => {
			if (!filterInputRef.current) {
				return;
			};

			rangeRef.current = { from: 0, to: filter.length };
			filterInputRef.current.setValue(filter);
			filterInputRef.current.setRange(rangeRef.current);

			reload();
		};

		focus.clear(true);
		rebindTimeoutRef.current = window.setTimeout(() => rebind(), J.Constant.delay.popup);

		if (storage.backlink) {
			U.Object.getById(storage.backlink, {}, item => setBacklinkState(item, 'Saved', () => setFilter()));
		} else {
			setFilter();
		};

		analytics.event('ScreenSearch', { route, type: (filter ? 'Saved' : 'Empty') });

		return () => {
			unbind();
			U.Subscription.destroyList([ J.Constant.subId.search ]);
			window.clearTimeout(timeoutRef.current);
			window.clearTimeout(rebindTimeoutRef.current);
		};
	}, []);

	useEffect(() => {
		const items = getItems();

		setActive(items[nRef.current]);

		if (listRef.current) {
			listRef.current.recomputeRowHeights(0);
			listRef.current.scrollToPosition(topRef.current);
		};
	});

	const items = getItems();
	const shift = keyboard.shiftSymbol();

	const Context = (meta: any): any => {
		const { highlight, relationKey, ranges } = meta;
		const relationDetails = meta.relationDetails || {};

		let key: any = '';
		let value: any = '';

		if (relationKey) {
			if ([ 'name', 'pluralName', 'type', 'snippet' ].includes(relationKey)) {
				return '';
			} else {
				const relation = S.Record.getRelationByKey(relationKey);
				key = relation ? <div className="key">{relation.name}:</div> : '';
			};
		};

		if (highlight) {
			const text = Mark.toHtml(highlight, ranges.map(it => ({ type: I.MarkType.Highlight, range: it })));

			value = <div className="value" dangerouslySetInnerHTML={{ __html: U.String.sanitize(text) }} />;
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
			const type = S.Record.getTypeById(item.type);

			let advanced = null;

			if (item.links.length || item.backlinks.length) {
				advanced = (
					<Icon
						className="advanced"
						tooltipParam={{ text: translate('popupSearchTooltipSearchByBacklinks'), caption: `${shift} + Enter` }}
						onClick={e => onBacklink(e, item)}
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
				name = U.String.htmlSpecialChars(name);
			};

			content = (
				<div className="sides" onContextMenu={e => onContext(e, item)}>
					<div className="side left">
						<div className="name" dangerouslySetInnerHTML={{ __html: U.String.sanitize(name) }} />
						<Context {...meta} />
						<div className="caption">
							<ObjectType object={type} />
						</div>
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
				ref={node => rowsRef.current[item.index] = node}
				id={`item-${item.id}`}
				className={cn.join(' ')}
				onMouseOver={e => onOver(e, item)}
				onClick={e => onClick(e, item)}
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
					{item.withClear ? <div onClick={onClearSearch} className="clear">{translate('commonClear')}</div> : ''}
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
				cache={cacheRef.current}
				columnIndex={0}
				rowIndex={index}
			>
				{content}
			</CellMeasurer>
		);
	};

	const Footer = (props: { items: any[]; n: number }) => {
		const { items, n } = props;
		const item = items[n];
		const cmd = keyboard.cmdKey();

		const isObject = item && item.isObject;
		const isAction = item && (item.isSettings || item.isImport || item.id == 'add' || item.id == 'graph' || item.id == 'navigation');

		const Shortcut = (props: { keys: string[]; label: string }) => {
			const symbols = keyboard.getSymbolsFromKeys(props.keys);
			return (
				<div className="item">
					<div className="keys">
						{symbols.map((s, i) => (
							<Label key={i} text={s} />
						))}
					</div>
					<div className="label">{props.label}</div>
				</div>
			);
		};

		return (
			<div className="foot">
				<Shortcut keys={[ 'arrowup', 'arrowdown' ]} label={translate('popupSearchShortcutNavigate')} />
				<Shortcut keys={[ 'escape' ]} label={translate('popupSearchShortcutClose')} />
				{isObject ? (
					<>
						<Shortcut keys={[ 'enter' ]} label={translate('popupSearchShortcutOpen')} />
						<Shortcut keys={[ cmd, 'l' ]} label={translate('popupSearchShortcutCopyLink')} />
						<Shortcut keys={[ cmd, 'enter' ]} label={translate('popupSearchShortcutNewTab')} />
					</>
				) : ''}
				{isAction ? (
					<Shortcut keys={[ 'enter' ]} label={translate('popupSearchShortcutSelect')} />
				) : ''}
			</div>
		);
	};

	return (
		<div
			ref={nodeRef}
			className="wrap"
		>
			{isLoading ? <Loader id="loader" /> : ''}

			<div className="head">
				<Filter
					icon="search"
					value={filterValueRef.current}
					ref={filterInputRef}
					placeholder={translate('popupSearchPlaceholder')}
					onSelect={onFilterSelect}
					onChange={v => onFilterChange(v)}
					onKeyUp={(e, v) => onFilterChange(v)}
					onClear={onFilterClear}
				/>
			</div>

			{!items.length && !isLoading ? (
				<EmptySearch filter={filterValueRef.current} />
			) : ''}

			{cacheRef.current && items.length && !isLoading ? (
				<div key="items" className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={loadMoreRows}
						isRowLoaded={({ index }) => !!items[index]}
						threshold={LIMIT_HEIGHT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={listRef}
										width={width}
										height={height}
										deferredMeasurmentCache={cacheRef.current}
										rowCount={items.length}
										rowHeight={param => getRowHeight(items[param.index], param.index)}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										onScroll={onScroll}
										scrollToAlignment="center"
										overscanRowCount={20}
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			) : ''}

			<Footer items={items} n={nRef.current} />
		</div>
	);

}));

export default PopupSearch;
