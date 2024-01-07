import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { IconObject, ObjectName, Icon, Filter } from 'Component';
import { analytics, C, I, keyboard, UtilObject, UtilMenu, translate, UtilData, UtilCommon, Action, Storage, Preview } from 'Lib';
import { commonStore, detailStore, dbStore, menuStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	isExpanded: boolean;
};

class MenuQuickCapture extends React.Component<I.Menu, State> {

	n = 0;
	node: any = null;
	_isMounted = false;

	filter = '';
	refFilter: any = null;
	timeoutFilter = 0;
	items: any[] = [];
	offset = 0;
	state = {
		isExpanded: false,
	};

	constructor (props: I.Menu) {
		super(props);

		this.onFilterChange = this.onFilterChange.bind(this);
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

			if ([ 'search', 'add' ].includes(item.itemId)) {
				icon = <Icon className={item.itemId} />;
			} else {
				icon = <IconObject object={item} />;
			};

			if (item.itemId != 'search') {
				name = <ObjectName object={item} />;
			};

			return (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onContextMenu={e => this.onContextMneu(e, item)}
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
		this._isMounted = true;
		this.load(true);
		this.rebind();
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
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
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

			this.items = this.items.concat((message.records || []).map(it => detailStore.mapper(it)));
			this.forceUpdate();
		});
	};

	getSections () {
		const { isExpanded } = this.state;
		const { space, type } = commonStore;

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

			const librarySources = library.map(it => it.sourceObject);
			const pinnedIds = Storage.getPinnedTypes();
			const pinned = pinnedIds.map(id => dbStore.getTypeById(id)).filter(it => it);
			const groups = library.filter(it => UtilObject.getSetLayouts().includes(it.recommendedLayout));
			const objects = library.filter(it => !UtilObject.getSetLayouts().includes(it.recommendedLayout) && !pinnedIds.includes(it.id));

			if (this.filter) {
				objects.push({ 
					id: 'add', 
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
			const pinned = Storage.getPinnedTypes();
			const pinnedItems = pinned.map(id => dbStore.getTypeById(id)).filter(it => it);

			items = UtilData.getObjectTypesForNewObject().filter(it => !pinned.includes(it.id));
			items = items.slice(0, 5 - pinnedItems.length);
			items.push(dbStore.getSetType());
			items.push(dbStore.getCollectionType());
			items = [].concat(pinnedItems, items);
			items = items.filter(it => it);
			
			items = items.map((it, i) => {
				it.tooltip = translate('commonNewObject');
				it.caption = String(i + 1);
				return it;
			});

			items.unshift({ 
				id: 'search', 
				icon: 'search', 
				name: '', 
				tooltip: translate('menuQuickCaptureTooltipSearch'),
				caption: '0',
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
			keyboard.shortcut('0, 1, 2, 3, 4, 5, 6, 7, 8, 9', e, (pressed) => {
				e.preventDefault();

				const n = Number(pressed);
				if (!n || !items[n - 1]) {
					this.onExpand();
				} else {
					this.onClick(e, items[n - 1]);
				};
				ret = true;
			});
		};

		if (!ret) {
			onKeyDown(e);
		};
	};

	onClick (e: any, item: any) {
		if (item.itemId == 'search') {
			this.onExpand();
			return;
		};

		const { close } = this.props;

		const cb = (created?: any) => {
			const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ];
			const type = created || item;

			C.ObjectCreate({ layout: type.recommendedLayout }, flags, item.defaultTemplateId, type.uniqueKey, commonStore.space, (message: any) => {
				if (message.error.code || !message.details) {
					return;
				};

				UtilObject.openAuto(message.details);
				analytics.event('CreateObject', { route: 'Navigation', objectType: type.id });
			});
		};

		if (item.itemId == 'add') {
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
				Action.install(item, true, message => cb(message.details));
			};
		};

		close();
	};

	onContextMneu (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		if (!this.state.isExpanded) {
			return;
		};

		const { getId, param } = this.props;
		const { className, classNameWrap } = param;
		const isPinned = Storage.getPinnedTypes().includes(item.itemId);
		const canDefault = !UtilObject.getSetLayouts().includes(item.recommendedLayout);

		const options = [
			{ id: 'open', name: translate('menuQuickCaptureOpenType') },
			{ id: 'pin', name: (isPinned ? translate('menuQuickCaptureUnpin') : translate('menuQuickCapturePin')) },
			canDefault ? { id: 'default', name: translate('commonSetDefault') } : null,
			{ isDiv: true },
			{ id: 'remove', name: translate('commonDelete'), color: 'red' },
		];

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
							UtilObject.openAuto(item);
							break;
						};

						case 'pin': {
							isPinned ? Storage.removePinnedType(item.itemId) : Storage.addPinnedType(item.itemId);
							this.forceUpdate();
							break;
						};

						case 'default': {
							commonStore.typeSet(item.uniqueKey);
							analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route: 'Settings' });
							this.forceUpdate();
							break;
						};

						case 'remove': {
							if (blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ])) {
								Action.uninstall(item, true);
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

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const pinned = Storage.getPinnedTypes();

		Storage.setPinnedTypes(arrayMove(pinned, oldIndex, newIndex));
		this.forceUpdate();
	};

	beforePosition () {
		const node = $(this.node);

		node.find('.item').each((i: number, item: any) => {
			item = $(item);
			item.find('.iconObject').length ? item.addClass('withIcon') : item.removeClass('withIcon');
		});
	};

};

export default MenuQuickCapture;
