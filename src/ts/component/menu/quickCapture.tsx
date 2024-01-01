import * as React from 'react';
import $ from 'jquery';
import { IconObject, ObjectName, Icon, Filter } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, UtilData, UtilCommon, Action, Storage, Preview } from 'Lib';
import { commonStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

class MenuQuickCapture extends React.Component<I.Menu> {

	n = 0;
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

		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render () {
		const items = this.getItems();
		const { type } = commonStore;

		const Item = (item: any) => {
			const cn = [];

			let icon = null;
			let name = null;

			if (item.id == type) {
				cn.push('isDefault');
			};

			if (!item.isSection) {
				cn.push('item');

				if ([ 'search', 'add' ].includes(item.id)) {
					icon = <Icon className={item.id} />;
				} else {
					icon = <IconObject object={item} />;
				};
			} else {
				cn.push('label');
			};

			if (item.id != 'search') {
				name = <ObjectName object={item} />;
			};

			return (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
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
				{this.isExpanded ? (
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
				<div className="items scrollWrap">
					{items.map((item: any, i: number) => (
						<Item key={i} idx={i} {...item} />
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
		const { space, type } = commonStore;
		const items = UtilCommon.objectCopy(this.items || []).map(it => ({ ...it, object: it }));
		const library = items.filter(it => (it.spaceId == space)).map((it, i) => {
			if (this.isExpanded && (it.id == type)) {
				it.tooltip = translate('commonDefaultType');
			};
			return it;
		});
		const librarySources = library.map(it => it.sourceObject);
		const groupKeys = [ Constant.typeKey.set, Constant.typeKey.collection ];

		let sections: any[] = [
			{ id: 'groups', name: translate('menuQuickCaptureGroups'), children: library.filter(it => groupKeys.includes(it.uniqueKey)) },
			{ id: 'objects', name: translate('commonObjects'), children: library.filter(it => !groupKeys.includes(it.uniqueKey)) },
		];

		if (this.filter) {
			const store = items.filter(it => (it.spaceId == Constant.storeSpaceId) && !librarySources.includes(it.id));

			sections = sections.concat([
				{ id: 'store', name: translate('commonAnytypeLibrary'), children: store },
			]);

			sections[1].children.push({ 
				id: 'add', 
				name: UtilCommon.sprintf(translate('menuTypeSuggestCreateType'), this.filter),
			});
		};

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};

	getItems () {
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
			items = UtilData.getObjectTypesForNewObject({ withCollection: true, withSet: true, limit: 5 });
			
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
		};
		return items;
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => this.forceUpdate(), Constant.delay.keyboard);
	};

	onKeyDown (e: any) {
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

		if (!this.isExpanded) {
			keyboard.shortcut('0, 1, 2, 3, 4, 5, 6, 7, 8, 9', e, (pressed) => {
				if (this.isExpanded) {
					return;
				};

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
		const { close } = this.props;

		if (item.id == 'search') {
			this.onExpand();
			return;
		};

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
				Action.install(item, true, message => cb(message.details));
			};
		};

		close();
	};

	onExpand () {
		const { getId } = this.props;

		$(`#${getId()}`).addClass('expanded');

		this.isExpanded = true;
		this.forceUpdate();
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

	beforePosition () {
		const node = $(this.node);

		node.find('.item').each((i: number, item: any) => {
			item = $(item);
			item.find('.iconObject').length ? item.addClass('withIcon') : item.removeClass('withIcon');
		});
	};

};

export default MenuQuickCapture;
