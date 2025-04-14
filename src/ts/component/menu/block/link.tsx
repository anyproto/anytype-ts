import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Filter, ObjectName } from 'Component';
import { I, S, U, J, keyboard, focus, translate, analytics, Preview } from 'Lib';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_DIV = 16;
const HEIGHT_FILTER = 44;
const LIMIT_HEIGHT = 6;

const MenuBlockLink = observer(class MenuBlockLink extends React.Component<I.Menu> {

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

		this.cache = new CellMeasurerCache({
			defaultHeight: HEIGHT_ITEM,
			fixedWidth: true,
		});
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

			const type = S.Record.getTypeById(item.type);
			const cn = [];

			let object = { ...item, id: item.itemId };
			let content = null;

			if (item.isSection) {
				content = <div className={[ 'sectionName', (param.index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
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
						name={<ObjectName object={item} withPlural={true} />}
						onMouseEnter={e => this.onOver(e, item)} 
						onClick={e => this.onClick(e, item)}
						withDescription={item.isBig}
						description={type ? type.name : undefined}
						style={param.style}
						iconSize={40}
						isDiv={item.isDiv}
						className={cn.join(' ')}
						withPlural={true}
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
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onFilterChange (e: any) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			S.Menu.updateData(this.props.id, { filter: this.refFilter.getValue() });
		}, J.Constant.delay.keyboard);
	};

	onFilterClear () {
		const { param, close } = this.props;
		const { data } = param;
		const { type, onChange, filter, onClear } = data;

		if (type !== null) {
			if (onClear) {
				onClear(filter);
			};

			if (onChange) {
				onChange(type, '');
			};
		};

		close();
		focus.apply();
		Preview.previewHide();
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (!filter) {
			return [];
		};

		const isLocal = filter.match(/^file:/) || U.Common.matchLocalPath(filter);
		const isUrl = U.Common.matchUrl(filter) || U.Common.matchDomain(filter);
		const items = [].concat(this.items);
		const sections: any[] = [];

		if (isLocal || isUrl) {
			items.unshift({ id: 'link', name: translate('menuBlockLinkSectionsLinkToWebsite'), icon: 'link', isLocal });
		};

		if (items.length) {
			sections.push({ id: I.MarkType.Object, children: items.map(it => ({ ...it, isBig: true })) });
		};

		sections.push({ 
			id: I.MarkType.Link, name: '', children: [
				{ id: 'add', name: U.Common.sprintf(translate('commonCreateObjectWithName'), filter), icon: 'plus' },
			] 
		});

		return U.Menu.sectionsMap(sections);
	};

	getItems (withSections: boolean) {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			if (items.length && section.children.length) {
				items.push({ isDiv: true });
			};
			if (withSections && section.name) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};
		return items;
	};
	
	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { skipIds, filter } = data;

		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it)) },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] },
			{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		];

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (!filter) {
			this.items = [];
			this.forceUpdate();
			return;
		};

		U.Data.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(null);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records || []);
			this.forceUpdate();
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
			let url = filter;

			if (item.isLocal && url && !url.match(/^file:/)) {
				url = `file://${url}`;
			};

			if (onChange) {
				onChange(I.MarkType.Link, url);
			};
		} else
		if (item.itemId == 'add') {
			U.Object.create('', '', { name: filter }, I.BlockPosition.Bottom, '', [ I.ObjectFlag.SelectType, I.ObjectFlag.SelectTemplate ], analytics.route.link, (message: any) => {
				if (onChange) {
					onChange(I.MarkType.Object, message.targetId);
				};
			});
		} else {
			if (onChange) {
				onChange(I.MarkType.Object, item.itemId);
			};
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

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems(true);
		const obj = $(`#${getId()} .content`);
		const offset = 12;

		let height = HEIGHT_FILTER;
		if (filter) {
			height += items.reduce((res: number, item: any) => res + this.getRowHeight(item), offset);
		};

		obj.css({ height }).toggleClass('initial', !filter);
		position();
	};
	
});

export default MenuBlockLink;