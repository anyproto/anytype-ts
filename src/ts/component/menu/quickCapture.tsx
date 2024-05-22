import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { IconObject, ObjectName, Icon, Filter } from 'Component';
import { analytics, C, I, keyboard, UtilObject, UtilMenu, translate, UtilData, UtilCommon, Action, Storage, Preview } from 'Lib';
import { commonStore, detailStore, dbStore, menuStore, blockStore } from 'Store';
const Constant = require('json/constant.json');

interface State {
	isExpanded: boolean;
};

const LIMIT_PINNED = 5;

enum SystemIds {
	Add = 'add',
	Search = 'search',
	Clipboard = 'clipboard',
};

class MenuQuickCapture extends React.Component<I.Menu, State> {

	n = 0;
	node: any = null;
	_isMounted = false;

	filter = '';
	refFilter: any = null;
	timeoutFilter = 0;
	intervalClipboard = 0;
	items: any[] = [];
	clipboardItems: any[] = [];
	offset = 0;
	state = {
		isExpanded: false,
	};

	constructor (props: I.Menu) {
		super(props);

		this.onFilterChange = this.onFilterChange.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};

	render () {
		const { isExpanded } = this.state;
		const { getId } = this.props;
		const sections = this.getSections();
		const { type } = commonStore;

		const Items = SortableContainer(({ items }) => (
			<div className="items">
				{items.map((item, i) => (
					<SortableItem key={i} {...item} index={i} />
				))}
			</div>
		));

		const Section = section => (
			<div id={`section-${section.id}`} className="section">
				{section.name ? <div className="name">{section.name}</div> : ''}

				{section.id == 'pinned' ? (
					<Items 
						items={section.children}
						axis="xy" 
						lockToContainerEdges={true}
						transitionDuration={150}
						distance={10}
						onSortStart={this.onSortStart}
						onSortEnd={this.onSortEnd}
						helperClass="isDragging"
						helperContainer={() => $(`#${getId()} #section-${section.id} .items`).get(0)}
					/>
				) : (
					<div className="items">
						{section.children.map((item, i) => (
							<Item key={i} {...item} />
						))}
					</div>
				)}
			</div>
		);

		const SortableItem = SortableElement(item => (<Item {...item} />));

		const Item = (item: any) => {
			const cn = [ 'item' ];

			let icon = null;
			let name = null;

			if (item.itemId == type) {
				cn.push('isDefault');
			};

			if (item.className) {
				cn.push(item.className);
			};

			if ([ SystemIds.Search, SystemIds.Add, SystemIds.Clipboard ].includes(item.itemId)) {
				icon = <Icon className={item.itemId} />;
			} else {
				icon = <IconObject object={item} />;
			};

			if (![ SystemIds.Search, SystemIds.Clipboard ].includes(item.itemId)) {
				name = <ObjectName object={item} />;
			};

			return (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onContextMenu={e => this.onContextMenu(e, item)}
					onMouseEnter={e => this.onOver(e, item)}
					onMouseLeave={e => this.onOut(e, item)}
				>
					{icon}
					{name}
				</div>
			);
		};

		return (
			<div ref={node => this.node = node} className="wrap">
				{isExpanded ? (
					<Filter
						ref={ref => this.refFilter = ref}
						icon="search"
						onIconClick={() => this.refFilter.focus()}
						placeholder={translate('menuQuickCaptureSearchObjectTypes')}
						value={this.filter}
						onChange={this.onFilterChange}
						focusOnMount={true}
					/>
				) : ''}
				<div className="sections scrollWrap">
					{sections.map((section: any, i: number) => (
						<Section key={i} {...section} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { isExpanded } = data;

		this._isMounted = true;
		this.load(true);
		this.rebind();

		const check = async () => {
			const items = await this.getClipboardData();
			const needUpdate = this.clipboardItems.length != items.length;

			this.clipboardItems = items;

			if (needUpdate) {
				this.forceUpdate();
			};
		};

		check();
		this.intervalClipboard = window.setInterval(check, 2000);

		if (isExpanded) {
			this.onExpand();
		};
	};

	componentDidUpdate () {
		const filter = this.refFilter?.getValue();

		if (this.filter != filter) {
			this.filter = filter;
			this.n = 0;
			this.offset = 0;
			this.load(true);
			return;
		};

		this.props.position();
		this.rebind();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		window.clearInterval(this.intervalClipboard);
	};

	rebind () {
		const { getId, close, setActive } = this.props;

		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => setActive(), 15);

		if (commonStore.navigationMenu == I.NavigationMenuMode.Hover) {
			$(`#${getId()}`).off(`mouseleave`).on(`mouseleave`, () => {
				if (!this.state.isExpanded) {
					close();
				};
			});
		};
	};

	unbind () {
		$(window).off('keydown.menu');
		$(`#${this.props.getId()}`).off(`mouseleave`);
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const filter = String(this.filter || '');
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ Constant.storeSpaceId, commonStore.space ] },
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
			{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts().concat(UtilObject.getSetLayouts()) },
		];
		const sorts = [
			{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		UtilData.search({
			filters,
			sorts,
			keys: UtilData.typeRelationKeys(),
			fullText: filter,
			offset: this.offset,
			ignoreWorkspace: true,
		}, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records || []);
			this.forceUpdate();
		});
	};

	getSections () {
		const { isExpanded } = this.state;
		const { space, type } = commonStore;
		const pinnedIds = Storage.getPinnedTypes();
		const hasClipboard = this.clipboardItems && this.clipboardItems.length;
		const cmd = keyboard.cmdSymbol();

		let sections: any[] = [];
		let items: any[] = [];

		if (isExpanded) {
			const items = UtilCommon.objectCopy(this.items || []).map(it => ({ ...it, object: it }));
			const library = items.filter(it => (it.spaceId == space)).map((it, i) => {
				if (isExpanded && (it.id == type)) {
					it.tooltip = translate('commonDefaultType');
				};
				return it;
			});

			const pinned = items.filter(it => pinnedIds.includes(it.id)).sort((c1: any, c2: any) => UtilData.sortByPinnedTypes(c1, c2, pinnedIds));
			const librarySources = library.map(it => it.sourceObject);
			const groups = library.filter(it => UtilObject.getSetLayouts().includes(it.recommendedLayout) && !pinnedIds.includes(it.id));
			const objects = library.filter(it => !UtilObject.getSetLayouts().includes(it.recommendedLayout) && !pinnedIds.includes(it.id));

			if (this.filter) {
				objects.push({ 
					id: SystemIds.Add, 
					name: UtilCommon.sprintf(translate('menuTypeSuggestCreateType'), this.filter),
				});
			};

			sections = sections.concat([
				{ id: 'groups', name: translate('menuQuickCaptureGroups'), children: groups },
				{ id: 'objects', name: translate('commonObjects'), children: objects },
			]);

			if (pinned.length) {
				sections.unshift({ id: 'pinned', name: translate('menuQuickCapturePinned'), children: pinned });
			};

			if (this.filter) {
				sections.push({ 
					id: 'store', name: translate('commonAnytypeLibrary'), 
					children: items.filter(it => (it.spaceId == Constant.storeSpaceId) && !librarySources.includes(it.id)),
				});
			};
		} else {
			const pinned = pinnedIds.map(id => dbStore.getTypeById(id)).filter(it => it).slice(0, LIMIT_PINNED);

			items = UtilData.getObjectTypesForNewObject().filter(it => !pinnedIds.includes(it.id));
			items = items.slice(0, LIMIT_PINNED - pinned.length);
			items.push(dbStore.getSetType());
			items.push(dbStore.getCollectionType());
			items = [].concat(pinned, items);
			items = items.filter(it => it);
			
			items = items.map((it, i) => {
				it.tooltip = translate('commonNewObject');
				it.caption = String(i + 1);
				return it;
			});

			items.unshift({ 
				id: SystemIds.Search, 
				icon: 'search', 
				name: '', 
				tooltip: translate('menuQuickCaptureTooltipSearch'),
				caption: '0',
			});

			items.push({ 
				id: SystemIds.Clipboard, 
				icon: 'clipboard', 
				name: '', 
				tooltip: translate('menuQuickCaptureTooltipClipboard'),
				caption: `${cmd} + V`,
				className: [ 'clipboard', (hasClipboard ? 'active' : '') ].join(' '),
			});

			sections.push({ id: 'collapsed', children: items });
		};

		return UtilMenu.sectionsMap(sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		}));
	};

	getItems () {
		const sections = this.getSections();

		let items: any[] = [];
		sections.forEach((section: any, i: number) => {
			if (section.name && section) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};

			items = items.concat(section.children);
		});
		return items;
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => this.forceUpdate(), Constant.delay.keyboard);
	};

	onKeyDown (e: any) {
		const { isExpanded } = this.state;
		const { setHover, onKeyDown } = this.props;
		const items = this.getItems();
		const length = items.length;
		const cmd = keyboard.cmdKey();

		keyboard.disableMouse(true);

		let ret = false;

		keyboard.shortcut('arrowup, arrowleft, arrowdown, arrowright, tab', e, (pressed: string) => {
			e.preventDefault();

			const dir = [ 'arrowup', 'arrowleft' ].includes(pressed) ? -1 : 1;

			this.n += dir;

			if (this.n < 0) {
				this.n = length - 1;
			};

			if (this.n > length - 1) {
				this.n = 0;
			};

			setHover(items[this.n], true);
			ret = true;
		});

		if (!isExpanded) {
			keyboard.shortcut('0, 1, 2, 3, 4, 5, 6, 7, 8, 9', e, (pressed: string) => {
				e.preventDefault();

				const n = Number(pressed) || 0;
				if (items[n]) {
					this.onClick(e, items[n]);
				};
				ret = true;
			});
		};

		keyboard.shortcut(`${cmd}+v`, e, () => {
			e.preventDefault();

			this.onPaste();
			ret = true;
		});

		if (!ret) {
			onKeyDown(e);
		};
	};

	onClick (e: any, item: any) {
		if (item.itemId == SystemIds.Clipboard) {
			this.onPaste();
			return;
		};

		if (item.itemId == SystemIds.Search) {
			this.onExpand();
			analytics.event('ScreenObjectTypeSearch');
			return;
		};

		const { close } = this.props;

		const cb = (created?: any) => {
			const { isExpanded } = this.state;
			const type = created || item;

			if (isExpanded && this.filter.length) {
				analytics.event('TypeSearchResult');
			};

			let flags: I.ObjectFlag[] = [];
			if (!UtilObject.isSetLayout(type.recommendedLayout)) {
				flags = flags.concat([ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
			};

			C.ObjectCreate({ layout: type.recommendedLayout }, flags, item.defaultTemplateId, type.uniqueKey, commonStore.space, (message: any) => {
				if (message.error.code || !message.details) {
					return;
				};

				const object = message.details;

				UtilObject.openAuto(object);
				analytics.createObject(object.type, object.layout, analytics.route.navigation, message.middleTime);
			});
		};

		if (item.itemId == SystemIds.Add) {
			C.ObjectCreateObjectType({ name: this.filter }, [], commonStore.space, (message: any) => {
				if (!message.error.code) {
					cb(message.details);
					analytics.event('CreateType');
				};
			});
		} else {
			if (item.isInstalled) {
				cb();
			} else {
				Action.install({ ...item, id: item.itemId }, true, message => cb(message.details));
			};
		};

		close();
	};

	onContextMenu (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		if (!this.state.isExpanded) {
			return;
		};

		if ([ SystemIds.Add, SystemIds.Search, SystemIds.Clipboard ].includes(item.itemId)) {
			return;
		};

		const { getId, param } = this.props;
		const { className, classNameWrap } = param;
		const type = dbStore.getTypeById(item.itemId);
		const isPinned = Storage.getPinnedTypes().includes(item.itemId);
		const canPin = type.isInstalled;
		const canDefault = type.isInstalled && !UtilObject.getSetLayouts().includes(item.recommendedLayout) && (type.id != commonStore.type);
		const canDelete = type.isInstalled && blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);
		const route = analytics.route.navigation;

		let options: any[] = [
			canPin ? { id: 'pin', name: (isPinned ? translate('menuQuickCaptureUnpin') : translate('menuQuickCapturePin')) } : null,
			canDefault ? { id: 'default', name: translate('commonSetDefault') } : null,
			{ id: 'open', name: translate('menuQuickCaptureOpenType') },
		];

		if (canDelete) {
			options = options.concat([
				{ isDiv: true },
				{ id: 'remove', name: translate('commonDelete'), color: 'red' },
			]);
		};

		menuStore.open('select', {
			element: `#${getId()} #item-${item.id}`,
			vertical: I.MenuDirection.Top,
			offsetY: -4,
			className,
			classNameWrap,
			data: {
				options,
				onSelect: (event: any, element: any) => {
					switch (element.id) {

						case 'open': {
							UtilObject.openAuto({ ...item, id: item.itemId });
							break;
						};

						case 'pin': {
							isPinned ? Storage.removePinnedType(item.itemId) : Storage.addPinnedType(item.itemId);
							analytics.event(isPinned ? 'UnpinObjectType' : 'PinObjectType', { objectType: item.uniqueKey, route });
							this.forceUpdate();
							break;
						};

						case 'default': {
							commonStore.typeSet(item.uniqueKey);
							analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route });
							this.forceUpdate();
							break;
						};

						case 'remove': {
							if (blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ])) {
								Action.uninstall({ ...item, id: item.itemId }, true, route);
							};
							break;
						};
					};
				}
			}
		});
	};

	onExpand () {
		$(`#${this.props.getId()}`).addClass('isExpanded');
		this.setState({ isExpanded: true });
	};

	onOver (e: any, item: any) {
		if (keyboard.isMouseDisabled) {
			return;
		};

		this.props.setActive(item);

		if (item.tooltip) {
			const node = $(this.node);
			const element = node.find(`#item-${item.id}`);
			const t = Preview.tooltipCaption(item.tooltip, item.caption);

			Preview.tooltipShow({ text: t, element });
		};
	};

	onOut (e: any, item: any) {
		Preview.tooltipHide();
	};

	onSortStart () {
		keyboard.disableSelection(true);
		$(this.node).addClass('isDragging');
		$('body').addClass('grab');
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const pinned = Storage.getPinnedTypes();

		Storage.setPinnedTypes(arrayMove(pinned, oldIndex, newIndex));
		this.forceUpdate();

		keyboard.disableSelection(false);
		$('body').removeClass('grab');
	};

	async onPaste () {
		const type = dbStore.getTypeById(commonStore.type);
		const data = await this.getClipboardData();

		data.forEach(async item => {
			let text = '';
			let html = '';

			if (item.types.includes('text/plain')) {
				const textBlob = await item.getType('text/plain');

				if (textBlob) {
					text = await textBlob.text();
				};
			};

			if (item.types.includes('text/html')) {
				const htmlBlob = await item.getType('text/html');

				if (htmlBlob) {
					html = await htmlBlob.text();
				};
			};

			if (!text && !html) {
				return;
			};

			const url = UtilCommon.matchUrl(text);

			if (url) {
				C.ObjectCreateBookmark({ source: url }, commonStore.space, (message: any) => {
					UtilObject.openAuto(message.details);
				});
			} else {
				C.ObjectCreate({}, [], type?.defaultTemplateId, type?.uniqueKey, commonStore.space, (message: any) => {
					if (message.error.code) {
						return;
					};

					const object = message.details;

					C.BlockPaste (object.id, '', { from: 0, to: 0 }, [], false, { html, text }, '', () => {
						UtilObject.openAuto(object);
					});

					analytics.createObject(object.type, object.layout, analytics.route.clipboard, message.middleTime);
				});
			};
		});
	};

	async getClipboardData () {
		let ret = [];
		try { ret = await navigator.clipboard.read(); } catch (e) { /**/ };
		return ret;
	};

	beforePosition () {
		const { getId } = this.props;
		const obj = $(`#${getId()}`);
		const { ww } = UtilCommon.getWindowDimensions();
		const sidebar = $('#sidebar');
		const sw = sidebar.outerWidth();
		
		obj.css({ width: '' });

		obj.find('.item').each((i: number, item: any) => {
			item = $(item);
			item.find('.iconObject').length ? item.addClass('withIcon') : item.removeClass('withIcon');
		});

		obj.css({ width: Math.min(ww - Constant.size.menu.border * 2 - sw, Math.ceil(obj.outerWidth())) });
	};

};

export default MenuQuickCapture;
