import * as React from 'react';
import $ from 'jquery';
import { IconObject, ObjectName, Icon, Filter } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, UtilData, UtilCommon, Action, Storage } from 'Lib';
import { commonStore, dbStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

class MenuQuickCapture extends React.Component<I.Menu> {

	state = {
		loading: false,
	};

	n = -1;
	node: any = null;
	_isMounted = false;

	filter = '';
	refFilter: any = null;
	timeoutFilter = 0;
	items: any[] = [];
	offset = 0;

	isExpanded: boolean = false;

	constructor (props: I.Menu) {
		super(props);

		this.onOut = this.onOut.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render () {
		const items = this.getItems();

		const Item = (item: any) => {
			let icon = null;
			let name = null;

			if ([ 'search', 'add' ].includes(item.id)) {
				icon = <Icon className={item.id} />;
			} else {
				icon = <IconObject object={item} />;
			};

			if (item.id != 'search') {
				name = <ObjectName object={item} />;
			};

			return (
				<div
					id={`item-${item.id}`}
					className={item.isSection ? 'label' : 'item'}
					onClick={() => this.onClick(item)}
					onMouseEnter={(e: any) => { this.onOver(e, item); }}
					onMouseLeave={this.onOut}
				>
					{icon}
					{name}
				</div>
			);
		};

		return (
			<div ref={node => this.node = node} className="wrap">
				{this.isExpanded ? (
					<Filter
						ref={ref => this.refFilter = ref}
						icon="search"
						onIconClick={() => this.refFilter.focus()}
						placeholder={translate('menuQuickCaptureSearchObjectTypes')}
						value={this.filter}
						onChange={this.onFilterChange}
					/>
				) : ''}
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} idx={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.load(true);
	};

	componentDidUpdate () {
		this.props.position();
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
		if (!this._isMounted) {
			return;
		};

		const filter = String(this.filter || '');
		const sorts = [
			{ relationKey: 'spaceId', type: I.SortType.Desc },
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		let filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ Constant.storeSpaceId, commonStore.space ] },
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
			{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts().concat(UtilObject.getSetLayouts()) },
		];

		if (clear) {
			this.setState({ loading: true });
		};

		UtilData.search({
			filters,
			sorts,
			keys: UtilData.typeRelationKeys(),
			fullText: filter,
			offset: this.offset,
			limit: Constant.limit.menuRecords,
			ignoreWorkspace: true,
		}, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat((message.records || []).map(it => detailStore.mapper(it)));

			if (clear) {
				this.setState({ loading: false });
				this.props.position();
			} else {
				this.forceUpdate();
			};
		});
	};

	getSections () {
		const { space } = commonStore;
		const items = UtilCommon.objectCopy(this.items || []).map(it => ({ ...it, object: it }));
		const library = items.filter(it => (it.spaceId == space));
		const librarySources = library.map(it => it.sourceObject);
		const groupKeys = [ Constant.typeKey.set, Constant.typeKey.collection ];

		let sections: any[] = [
			{ id: 'objects', name: translate('commonObjects'), children: this.sortLastUsed(library.filter(it => (!groupKeys.includes(it.uniqueKey)))) },
			{ id: 'groups', name: translate('menuQuickCaptureGroups'), children: this.sortLastUsed(library.filter(it => (groupKeys.includes(it.uniqueKey)))) },
		];

		if (this.filter) {
			const store = items.filter(it => (it.spaceId == Constant.storeSpaceId) && !librarySources.includes(it.id));

			sections = sections.concat([
				{ id: 'store', name: translate('commonAnytypeLibrary'), children: store },
			]);

			sections[0].children.unshift({ id: 'add', name: UtilCommon.sprintf(translate('menuTypeSuggestCreateType'), this.filter) });
		};

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId, []);

		let items: any[] = [];

		if (this.isExpanded) {
			const sections = this.getSections();

			sections.forEach((section: any, i: number) => {
				if (section.name && section) {
					items.push({ id: section.id, name: section.name, isSection: true });
				};

				items = items.concat(section.children);
			});

		} else {
			items = UtilData.getObjectTypesForNewObject({ withCollection: true, withSet: true, withDefault: true }).filter(it => it.id != object.type);
			items = this.sortLastUsed(items);

			const itemIds = items.map(it => it.id);
			const defaultType = dbStore.getTypeById(commonStore.type);

			if (!itemIds.includes(defaultType.id)) {
				items.unshift(defaultType);
			};

			items.unshift({ id: 'search', icon: 'search', name: '' });
		};

		this.props.position();

		return items;
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.filter = this.refFilter.getValue();
			this.n = -1;
			this.offset = 0;
			this.load(true);
		}, Constant.delay.keyboard);
	};

	onKeyDown (e: any) {
		const items = this.getItems();

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowleft, arrowdown, arrowright', e, (pressed) => {
			e.preventDefault();

			const dir = [ 'arrowup', 'arrowleft' ].includes(pressed) ? -1 : 1;

			this.n += dir;

			if (this.n < 0) {
				this.n = items.length - 1;
			};

			if (this.n > items.length - 1) {
				this.n = 0;
			};

			const next = items[this.n];

			if (next.isSection) {
				this.onKeyDown(e);
				return;
			};

			this.setHover(items[this.n]);
		});

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			if (items[this.n]) {
				this.onClick(items[this.n]);
			};
		});

		keyboard.shortcut('0, 1, 2, 3, 4, 5, 6, 7 ,8, 9', e, (pressed) => {
			if (this.isExpanded) {
				return;
			};

			const n = Number(pressed);

			if (!n || !items[n - 1]) {
				this.onExpand();
				return;
			};

			this.onClick(items[n - 1]);
		});
	};

	onClick (item: any) {
		if (item.id == 'search') {
			this.onExpand();
			return;
		};

		const cb = (created?: any) => {
			const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ];
			const layout = created ? created.recommendedLayout : item.recommendedLayout;
			const uniqueKey = created ? created.uniqueKey : item.uniqueKey;
			const lastUsedTypes = Storage.get('lastUsedTypes') || {};

			C.ObjectCreate({ layout }, flags, item.defaultTemplateId, uniqueKey, commonStore.space, (message: any) => {
				if (message.error.code || !message.details) {
					return;
				};

				const { id, layout, type, createdDate } = message.details;

				lastUsedTypes[type] = createdDate;
				Storage.set('lastUsedTypes', lastUsedTypes);

				UtilObject.openAuto({ id, layout });
				analytics.event('CreateObject', { route: 'Navigation', objectType: created ? created.id : item.id });
			});
		};

		if (item.id == 'add') {
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
				Action.install(item, true, () => cb);
			};
		};
	};

	onExpand () {
		const { getId } = this.props;

		$(`#${getId()}`).addClass('expanded');

		this.isExpanded = true;
		this.forceUpdate();

		window.setTimeout(() => {
			if (this.refFilter) {
				this.refFilter.focus();
			};
		}, 15);
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setHover(item);
		};
	};

	onOut () {
		if (!keyboard.isMouseDisabled) {
			this.setHover();
		};
	};

	setHover (item?: any) {
		const node = $(this.node);

		node.find('.item.hover').removeClass('hover');
		if (item) {
			node.find('#item-' + item.id).addClass('hover');
		};
	};

	sortLastUsed (items: any[]) {
		const lastUsedTypes = Storage.get('lastUsedTypes') || {};

		return items.sort((c1: any, c2: any) => {
			const d1 = lastUsedTypes[c1.id];
			const d2 = lastUsedTypes[c2.id];
			if (d1 > d2 || !d2) return -1;
			if (d1 < d2) return 1;
			return 0;
		});
	};
};

export default MenuQuickCapture;
