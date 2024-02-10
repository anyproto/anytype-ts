import * as React from 'react';
import { Loader, Title, Label, EmptySearch, Icon, Filter } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';
import { commonStore } from 'Store';

interface State {
	isLoading: boolean;
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
	category = null;
	state = {
		isLoading: false
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
		const { isLoading } = this.state;
		const items = this.getItems();
		const { gallery } = commonStore;

		if (isLoading) {
			return <Loader id="loader" />;
		};

		let textEmpty = '';
		if (this.category) {
			textEmpty = UtilCommon.sprintf(translate('popupUsecaseListEmptyCategory'), this.category.name);
		};

		const Category = (item: any) => (
			<div className="item" onClick={() => this.onCategory(item)}>{item.name}</div>
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
				<div className="categories">
					<div className="inner">
						{gallery.categories.map((item: any, i: number) => (
							<Category key={i} {...item} />
						))}
					</div>

					<div className="gradient left" />
					<div className="gradient right" />

					<Icon className="arrow left" />
					<Icon className="arrow right" />
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
				categories: message.categories || [],
				list: message.list || [],
			};
			
			this.setState({ isLoading: false });
		});
	};

	componentDidUpdate (): void {
		this.reset();
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
		this.category = item;
		this.forceUpdate();
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => this.forceUpdate(), 500);
	};

	onFilterClear () {
		this.forceUpdate();
	};

	getItems () {
		const ret: any[] = [];
		const filter = this.refFilter ? this.refFilter.getValue() : '';
		
		let items = commonStore.gallery.list || [];
		if (this.category) {
			items = items.filter(it => this.category.list.includes(it.name));
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

};

export default PopupUsecasePageList;