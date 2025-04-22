import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { MenuItemVertical, Loader, ObjectName, ObjectType, EmptySearch } from 'Component';
import { I, S, U, J, C, keyboard, Mark, translate, analytics } from 'Lib';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface State {
	isLoading: boolean;
};

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT_HEIGHT = 10;

const MenuBlockMention = observer(class MenuBlockMention extends React.Component<I.Menu, State> {

	state = {
		isLoading: false,
	};

	_isMounted = false;	
	filter = '';
	index: any = null;
	cache: any = {};
	items: any = [];
	n = 0;
	offset = 0;
	refList: any = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onClick = this.onClick.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { canAdd, pronounId } = data;
		const { isLoading } = this.state;
		const filter = this.getFilter();
		const items = this.getItems();

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};			

			const type = item.type ? S.Record.getTypeById(item.type) : null;
			const object = ![ 'add', 'selectDate' ].includes(item.id) ? item : null;
			const withPronoun = pronounId && (pronounId == item.id);
			const cn = [];

			if (item.id == 'add') {
				cn.push('add');
			};
			if (item.isHidden) {
				cn.push('isHidden');
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<MenuItemVertical 
						id={item.id}
						object={object}
						icon={item.icon}
						name={<ObjectName object={item} withPlural={true} withPronoun={withPronoun} />}
						onMouseEnter={e => this.onOver(e, item)} 
						onClick={e => this.onClick(e, item)}
						caption={type ? <ObjectType object={type} /> : ''}
						style={param.style}
						isDiv={item.isDiv}
						className={cn.join(' ')}
						withPlural={true}
						withPronoun={withPronoun}
					/>
				</CellMeasurer>
			);
		};

		return (
			<>
				{!items.length && !isLoading ? (
					<EmptySearch text={translate('commonNothingFound')} />
				) : ''}

				{items.length ? (
					<div className="items">
						{isLoading ? <Loader /> : (
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
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						)}
					</div>
				) : ''}
			</>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.load(true);
	};

	componentDidUpdate () {
		const { isLoading } = this.state;
		const items = this.getItems();
		const filter = this.getFilter();

		if ((this.filter != filter) && !isLoading) {
			this.filter = filter;
			this.n = 0;
			this.offset = 0;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

		this.rebind();
		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getFilter () {
		return String(S.Common.filter.text || '').replace(/^@/, '');
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { canAdd } = data;
		const filter = this.getFilter();
		const sections: any[] = [];
		

		let items = U.Common.objectCopy(this.items);

		const dates = items.filter(it => U.Object.isDateLayout(it.layout));

		items = items.filter(it => !U.Object.isDateLayout(it.layout));
		
		const length = items.length;
		
		if (dates.length) {
			sections.push({ 
				id: 'date', 
				name: translate('commonDates'), 
				children: [
					...dates,
					{ id: 'selectDate', icon: 'relation c-date', name: translate(`placeholderCell${I.RelationType.Date}`) },
					{ isDiv: true },
				]
			});
		};

		if (length) {
			sections.push({ id: I.MarkType.Object, name: translate('commonObjects'), children: items.filter(it => !U.Object.isDateLayout(it.layout)) });
		};

		if (filter && canAdd) {
			const children: any[] = [
				{ id: 'add', icon: 'plus', name: U.Common.sprintf(translate('commonCreateObjectWithName'), filter) }
			];

			if (length) {
				children.unshift({ isDiv: true });
			};

			sections.push({ children });
		};

		return sections;
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};

	load (clear: boolean, callBack?: (value: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { skipIds } = data;
		const filter = this.getFilter();
		const skipLayouts = U.Object.getSystemLayouts().filter(it => !U.Object.isDateLayout(it) && !U.Object.isTypeLayout(it));
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		];

		let filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: skipLayouts },
		];

		if (data.filters && data.filters.length) {
			filters = filters.concat(data.filters);
		};

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			this.setState({ isLoading: true });
		};

		U.Data.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit: J.Constant.limit.menuRecords,
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

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
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

		const { space } = S.Common;
		const { id, param, getId } = this.props;
		const { data } = param;
		const { onChange } = data;
		const { from } = S.Common.filter;

		const cb = (object: any) => {
			const name = U.Common.shorten(String(U.Object.name(object, true)), 30);
			const to = from + name.length;

			let marks = U.Common.objectCopy(data.marks || []);
			marks = Mark.adjust(marks, from, name.length);
			marks = Mark.toggle(marks, { 
				type: I.MarkType.Mention, 
				param: object.id, 
				range: { from, to },
			});

			onChange(object, name + ' ', marks, from, to + 1);
			analytics.event('ChangeTextStyle', { type: I.MarkType.Mention, count: 1, objectType: object.type });
		};

		let close = true;

		if (item.id == 'add') {
			const name = this.getFilter();

			U.Object.create('', '', { name }, I.BlockPosition.Bottom, '', [ I.ObjectFlag.SelectType, I.ObjectFlag.SelectTemplate ], analytics.route.mention, (message: any) => {
				cb(message.details);
			});
		} else 
		if (item.id == 'selectDate') {
			close = false;

			S.Menu.open('calendar', {
				element: `#${getId()} #item-${item.id}`,
				horizontal: I.MenuDirection.Center,
				rebind: this.rebind,
				parentId: id,
				data: { 
					canEdit: true,
					canClear: false,
					value: U.Date.now(),
					relationKey: J.Relation.key.mention,
					onChange: (value: number) => {
						C.ObjectDateByTimestamp(space, value, (message: any) => {
							if (!message.error.code) {
								cb(message.details);
								this.props.close();
							};
						});
					},
				},
			});

		} else {
			cb(item);
		};

		if (close) {
			this.props.close();
		};
	};

	getRowHeight (item: any) {
		let h = HEIGHT_ITEM;
		if (!item) {
			return h;
		};

		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);

		let height = 16;
		if (!items.length) {
			height += HEIGHT_ITEM;
		} else {
			height = items.reduce((res: number, current: any) => res + this.getRowHeight(current), height);
		};

		obj.css({ height });
		position();
	};
	
});

export default MenuBlockMention;
