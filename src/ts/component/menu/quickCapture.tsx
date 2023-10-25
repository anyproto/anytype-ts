import * as React from 'react';
import $ from 'jquery';
import { IconObject, ObjectName, Icon, Filter } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, UtilData, UtilCommon } from 'Lib';
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

		const Item = (item: any) => (
			<div
				id={`item-${item.id}`}
				className="item"
				onClick={() => this.onClick(item)}
				onMouseEnter={(e: any) => { this.onOver(e, item); }}
				onMouseLeave={this.onOut}
			>
				{item.id == 'search' ? <Icon className="search" /> : (
					<React.Fragment>
						{item.id == 'add' ? <Icon className="add" /> : <IconObject object={item} />}
						<ObjectName object={item} />
					</React.Fragment>
				)}
			</div>
		);

		const Section = (section: any) => (
			<div className="row">
				<div className="name">{section.name}</div>
				<div className="items">
					{section.children.map((item: any, i: number) => (
						<Item key={i} idx={i} {...item} />
					))}
				</div>
			</div>
		);

		let content = null;

		if (!this.isExpanded) {
			content = (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} idx={i} {...item} />
					))}
				</div>
			);
		} else {
			content = (
				<React.Fragment>
					<Filter
						ref={ref => this.refFilter = ref}
						icon="search"
						onIconClick={() => this.refFilter.focus()}
						placeholder={translate('menuQuickCaptureSearchObjectTypes')}
						value={this.filter}
						onChange={this.onFilterChange}
					/>
					<div className="itemsWrapper">
						{items.map((section: any, i: number) => (
							<Section key={i} idx={i} {...section} />
						))}
					</div>
				</React.Fragment>
			);
		};

		return (
			<div ref={node => this.node = node} className="wrap">
				{content}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.load(true);
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

			this.setHover(items[this.n]);
		});

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			if (items[this.n]) {
				this.onClick(items[this.n]);
			};
		});
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
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
		];

		if (clear) {
			this.setState({ loading: true });
		};

		UtilData.search({
			filters,
			sorts,
			keys: Constant.defaultRelationKeys.concat(Constant.typeRelationKeys),
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
			{ id: 'objects', name: translate('commonObjects'), children: library.filter(it => (!groupKeys.includes(it.uniqueKey))) },
			{ id: 'groups', name: translate('menuQuickCaptureGroups'), children: library.filter(it => (groupKeys.includes(it.uniqueKey))) },
		];

		if (this.filter) {
			const store = items.filter(it => (it.spaceId == Constant.storeSpaceId) && !librarySources.includes(it.id));

			sections = sections.concat([
				{ id: 'store', name: translate('commonAnytypeLibrary'), children: store }
			]);

			sections[0].children.unshift({ id: 'add', name: UtilCommon.sprintf(translate('menuTypeSuggestCreateType'), this.filter) })
		};

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};

	getItems () {
		if (this.isExpanded) {
			return this.getSections();
		};

		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId, []);

		const items = UtilData.getObjectTypesForNewObject({ withCollection: true, withSet: true, withDefault: true }).filter(it => it.id != object.type);
		const itemIds = items.map(it => it.id);
		const defaultType = dbStore.getTypeById(commonStore.type);

		if (!itemIds.includes(defaultType.id)) {
			items.unshift(defaultType);
		};

		items.unshift({ id: 'search', icon: 'search', name: '' });

		return items;
	};

	onClick (item: any) {
		if (item.id == 'search') {
			this.onExpand();
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const targetId = '';
		const position = I.BlockPosition.Bottom;
		const details: any = { type: item.id };
		const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ];

		UtilObject.create(rootId, targetId, details, position, '', {}, flags, (message: any) => {
			UtilObject.openAuto({ id: message.targetId });
			analytics.event('CreateObject', { route: 'Navigation', objectType: item.id });
		});
	};

	onExpand () {
		this.isExpanded = true;
		menuStore.update('quickCapture', { className: 'expanded' });
		this.forceUpdate();

		window.setTimeout(() => {
			if (this.refFilter) {
				this.refFilter.focus();
			}
		}, 50);
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

};

export default MenuQuickCapture;
