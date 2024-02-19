import * as React from 'react';
import { Loader, Title, Label, EmptySearch, Icon, Filter } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';
import { commonStore } from 'Store';

interface State {
	isLoading: boolean;
	category: any;
};

const HEIGHT = 450;
const LIMIT = 2;

class PopupUsecasePageList extends React.Component<I.PopupUsecase, State> {

	node = null;
	refList = null;
	refFilter = null;
	cache: any = {};
	timeoutResize = 0;
	timeoutFilter = 0;
	pages = 0;
	page = 0;
	state = {
		isLoading: false,
		category: null,
	};

	constructor (props: I.PopupUsecase) {
		super(props);

		this.cache = new CellMeasurerCache({
			defaultHeight: HEIGHT,
			fixedWidth: true,
		});

		this.onResize = this.onResize.bind(this);
		this.onCategory = this.onCategory.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
	};
	
	render () {
		const { getAuthor, onAuthor } = this.props;
		const { isLoading, category } = this.state;
		const items = this.getItems();
		const { gallery } = commonStore;
		const filter = this.refFilter ? this.refFilter.getValue() : '';

		if (isLoading) {
			return <Loader id="loader" />;
		};

		let textEmpty = '';
		if (filter) {
			textEmpty = UtilCommon.sprintf(translate('popupUsecaseListEmptyFilter'), filter);
		} else
		if (category) {
			textEmpty = UtilCommon.sprintf(translate('popupUsecaseListEmptyCategory'), category.name);
		};

		const Category = (item: any) => (
			<div 
				className={[ 'item', (category && (category?.id == item.id)) ? 'active' : '' ].join(' ')} 
				onClick={() => this.onCategory(item)}
			>
				{item.icon ? <Icon className={item.icon} /> : ''}
				{item.name}
			</div>
		);

		const Item = (item: any) => {
			const screenshot = item.screenshots.length ? item.screenshots[0] : '';

			return (
				<div className="item" onClick={e => this.onClick(e, item)}>
					<div className="picture" style={{ backgroundImage: `url("${screenshot}")` }}></div>
					<div className="name">{item.title}</div>
					<div className="descr">{item.description}</div>
					<div className="author" onClick={() => onAuthor(item.author)}>@{getAuthor(item.author)}</div>
				</div>
			);
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					{({ measure }) => (
						<div key={`gallery-row-${param.index}`} className="row" style={param.style}>
							{item.children.map(child => <Item key={child.id} {...child} />)}
						</div>
					)}
				</CellMeasurer>
			);
		};

		return (
			<div ref={ref => this.node = ref} className="wrap">
				<div id="categories" className="categories">
					<div id="inner" className="inner">
						{gallery.categories.map((item: any, i: number) => (
							<React.Fragment key={i}>
								<Category {...item} />
								{item.id == 'made-by-any' ? <div className="div" /> : ''}
							</React.Fragment>
						))}
					</div>

					<div id="gradientLeft" className="gradient left" />
					<div id="gradientRight" className="gradient right" />

					<Icon id="arrowLeft" className="arrow left" onClick={() => this.onArrow(-1)} />
					<Icon id="arrowRight" className="arrow right" onClick={() => this.onArrow(1)} />
				</div>

				<div className="mid">
					<Title text={translate('popupUsecaseListTitle')} />
					<Label text={translate('popupUsecaseListText')} />

					<Filter 
						ref={ref => this.refFilter = ref}
						id="store-filter"
						icon="search"
						placeholder={translate('commonSearchPlaceholder')}
						onChange={this.onFilterChange}
						onClear={this.onFilterClear}
					/>
				</div>

				<div className="items">
					{!items.length ? (
						<EmptySearch text={textEmpty} />
					) : (
						<WindowScroller scrollElement={$('#popupUsecase-innerWrap').get(0)}>
							{({ height, isScrolling, registerChild, scrollTop }) => (
								<AutoSizer disableHeight={true} className="scrollArea" onResize={this.onResize}>
									{({ width }) => (
										<List
											ref={ref => this.refList = ref}
											autoHeight={true}
											height={Number(height) || 0}
											width={Number(width) || 0}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={param => this.cache.rowHeight(param)}
											rowRenderer={rowRenderer}
											isScrolling={isScrolling}
											scrollTop={scrollTop}
										/>
									)}
								</AutoSizer>
							)}
						</WindowScroller>
					)}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		if (commonStore.gallery.list.length) {
			return;
		};

		this.setState({ isLoading: true });

		C.GalleryDownloadIndex((message: any) => {
			commonStore.gallery = {
				categories: (message.categories || []).map(it => ({ ...it, name: this.categoryName(it.id) })),
				list: message.list || [],
			};
			
			this.setState({ isLoading: false });
		});
	};

	componentDidUpdate (): void {
		this.reset();
		this.checkPage();
		this.props.position();
	};

	componentWillUnmount(): void {
		window.clearTimeout(this.timeoutResize);
		window.clearTimeout(this.timeoutFilter);
	};

	reset () {
		this.cache.clearAll();

		if (this.refList) {
			this.refList.recomputeRowHeights(0);
		};
	};

	onClick (e: any, item: any) {
		this.props.onPage('item', { object: item });
	};

	onCategory (item: any) {
		this.setState({ category: (item.id == this.state.category?.id ? null : item) });
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => this.forceUpdate(), 500);
	};

	onFilterClear () {
		this.forceUpdate();
	};

	getItems () {
		const { category } = this.state;
		const ret: any[] = [];
		const filter = this.refFilter ? this.refFilter.getValue() : '';
		
		let items = commonStore.gallery.list || [];
		if (category) {
			items = items.filter(it => category.list.includes(it.name));
		};

		if (filter) {
			const reg = new RegExp(UtilCommon.regexEscape(filter), 'gi');
			items = items.filter(it => reg.test(it.title) || reg.test(it.description));
		};

		let n = 0;
		let row = { children: [] };

		for (const item of items) {
			row.children.push(item);

			n++;
			if (n == LIMIT) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < LIMIT) {
			ret.push(row);
		};

		return ret.filter(it => it.children.length > 0);
	};

	onResize ({ width }) {
		window.clearTimeout(this.timeoutResize);
		this.timeoutResize = window.setTimeout(() => this.forceUpdate(), 10);
	};

	categoryName (id: string) {
		return translate(UtilCommon.toCamelCase(`usecaseCategory-${id}`));
	};

	calcPages () {
		const { categories } = commonStore.gallery;
		const node = $(this.node);
		const width = node.width();
		const items = node.find('#categories .item');

		let iw = 0;
		items.each((i, item) => {
			iw += $(item).outerWidth(true);
		});
		iw += 8 * categories.length + 1;

		this.pages = Number(Math.ceil(iw / width)) || 1;
	};

	checkPage () {
		const node = $(this.node);
		const gradientLeft = node.find('#gradientLeft');
		const gradientRight = node.find('#gradientRight');
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');

		this.calcPages();
		this.page = Math.max(0, this.page);
		this.page = Math.min(this.page, this.pages - 1);

		if (!this.page) {
			gradientLeft.hide();
			arrowLeft.hide();
		} else {
			gradientLeft.show();
			arrowLeft.show();
		};

		if (this.page == this.pages - 1) {
			gradientRight.hide();
			arrowRight.hide();
		} else {
			gradientRight.show();
			arrowRight.show();
		};
	};

	onArrow (dir: number) {
		const node = $(this.node);
		const inner = node.find('#categories #inner');

		this.page += dir;
		this.checkPage();

		inner.css({ transform: `translate3d(${-this.page * 100}%, 0px, 0px)` });
	};

};

export default PopupUsecasePageList;