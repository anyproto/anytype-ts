import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Filter, ObjectName } from 'Component';
import { I, UtilCommon, keyboard, UtilData, UtilObject, UtilMenu, analytics, focus, translate } from 'Lib';
import { commonStore, menuStore, dbStore } from 'Store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_DIV = 16;
const HEIGHT_FILTER = 44;
const LIMIT_HEIGHT = 6;

const MenuBlockLink = observer(class MenuBlockLink extends React.Component<I.Menu, State> {

	state = {
		loading: false,
	};

	_isMounted = false;	
	filter = '';
	index: any = null;
	cache: any = {};
	items: any[] = [];
	n = -1;
	top = 0;
	offset = 0;
	timeout = 0;
	refList: any = null;
	refFilter: any = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems(true);

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};

			const type = dbStore.getType(item.type);
			const cn = [];

			let object = { ...item, id: item.itemId };
			let content = null;

			if (item.isSection) {
				content = <div className={[ 'sectionName', (param.index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
			} else
			if (item.isDiv) {
				content = (
					<div className="separator" style={param.style}>
						<div className="inner" />
					</div>
				);
			} else {
				if ([ 'add', 'link' ].indexOf(item.itemId) >= 0) {
					cn.push(item.itemId);
					object = null;
				};

				if (item.isHidden) {
					cn.push('isHidden');
				};
				if (item.isBig) {
					cn.push('isBig');
				};

				content = (
					<MenuItemVertical 
						id={item.id}
						object={object}
						icon={item.icon}
						name={<ObjectName object={item} />}
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
						withDescription={item.isBig}
						description={type ? type.name : undefined}
						style={param.style}
						iconSize={40}
						forceLetter={true}
						className={cn.join(' ')}
					/>
				);
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					{content}
				</CellMeasurer>
			);
		};

		const list = (
			<div className="items">
				<InfiniteLoader
					rowCount={items.length}
					loadMoreRows={this.loadMoreRows}
					isRowLoaded={({ index }) => !!this.items[index]}
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
									overscanRowCount={10}
									onScroll={this.onScroll}
									scrollToAlignment="center"
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>
		);

		return (
			<div className="wrap">
				<Filter 
					ref={ref => this.refFilter = ref} 
					placeholder={translate('menuBlockLinkFilterPlaceholder')}
					value={filter}
					onChange={this.onFilterChange}
					onClear={this.onFilterClear}
				/>

				{filter ? list : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.load(true);
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems(false);

		if (this.filter != filter) {
			this.filter = filter;
			this.top = 0;
			this.n = -1;
			this.offset = 0;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};

		this.resize();
		this.props.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onFilterChange (e: any) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			menuStore.updateData(this.props.id, { filter: this.refFilter.getValue() });
		}, 500);
	};

	onFilterClear () {
		const { param, close } = this.props;
		const { data } = param;
		const { type, onChange } = data;

		onChange(type, '');
		close();
		focus.apply();
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (!filter) {
			return [];
		};

		const regProtocol = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
		const buttons: any[] = [
			{ id: 'add', name: UtilCommon.sprintf(translate('commonCreateObject'), filter), icon: 'plus' }
		];
		const items = [].concat(this.items).map(it => ({ ...it, isBig: true }));

		if (items.length) {
			items.push({ isDiv: true });
		};

		if (UtilCommon.matchUrl(filter) || filter.match(new RegExp(regProtocol))) {
			buttons.unshift({ id: 'link', name: translate('menuBlockLinkSectionsLinkToWebsite'), icon: 'link' });
		};

		const sections: any[] = [];

		if (items.length) {
			sections.push({ id: I.MarkType.Object, name: translate('commonObjects'), children: items });
		};

		sections.push({ id: I.MarkType.Link, name: '', children: buttons });

		return UtilMenu.sectionsMap(sections);
	};

	getItems (withSections: boolean) {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			if (withSections && section.name) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};
		return items;
	};
	
	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { skipIds, filter } = data;
		const skipTypes = UtilObject.getSystemTypes().filter(it => it != Constant.typeId.date);

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: skipTypes },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc, includeTime: true },
		];

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		UtilData.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit: Constant.limit.menuRecords,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
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
				this.setState({ loading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			this.props.close();
			return;
		};

		const { param, close } = this.props;
		const { data } = param;
		const { filter, onChange } = data;

		if (item.itemId == 'link') {
			onChange(I.MarkType.Link, filter);
		} else
		if (item.itemId == 'add') {
			const type = dbStore.getType(commonStore.type);

			UtilObject.create('', '', { name: filter }, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.SelectType ], (message: any) => {
				if (message.error.code) {
					return;
				};

				onChange(I.MarkType.Object, message.targetId);

				analytics.event('CreateObject', {
					route: 'Link',
					objectType: type.id,
					layout: type.layout,
					template: '',
				});
			});
		} else {
			onChange(I.MarkType.Object, item.itemId);
		};

		close();
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getRowHeight (item: any) {
		let h = HEIGHT_ITEM;
		if (item.isSection) h = HEIGHT_SECTION;
		if (item.isBig) h = HEIGHT_ITEM_BIG;
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	getListHeight () {
		return this.getItems(true).reduce((res: number, item: any) => res + this.getRowHeight(item), 0);
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { filter } = data;
		const obj = $(`#${getId()} .content`);
		const offset = 12;

		let height = HEIGHT_FILTER;
		if (filter) {
			height += this.getListHeight() + offset;
			obj.removeClass('initial');
		} else {
			obj.addClass('initial');
		};

		obj.css({ height });
		position();
	};
	
});

export default MenuBlockLink;