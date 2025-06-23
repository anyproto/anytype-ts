import * as React from 'react';
import { Loader, Title, Label, EmptySearch, Icon, Filter } from 'Component';
import { I, C, S, U, translate, analytics, Onboarding } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Navigation } from 'swiper/modules';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';

interface State {
	isLoading: boolean;
	category: any;
};

const HEIGHT = 378;
const LIMIT = 2;

class PopupUsecasePageList extends React.Component<I.PopupUsecase, State> {

	node = null;
	refList = null;
	refFilter = null;
	swiper: any = null;
	cache: any = {};
	timeoutResize = 0;
	timeoutFilter = 0;
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
		const categories = this.getCategories();
		const items = this.getItems();
		const filter = this.refFilter ? this.refFilter.getValue() : '';

		if (isLoading) {
			return <Loader id="loader" />;
		};

		let textEmpty = '';
		if (filter) {
			textEmpty = U.Common.sprintf(translate('popupUsecaseListEmptyFilter'), filter);
		} else
		if (category) {
			textEmpty = U.Common.sprintf(translate('popupUsecaseListEmptyCategory'), category.name);
		};

		const Category = (item: any) => {
			const cn = [ 'item' ];

			if (category && (category?.id == item.id)) {
				cn.push('active');
			};

			return (
				<div 
					className={cn.join(' ')} 
					id={`category-${item.id}`}
					onClick={() => this.onCategory(item)}
				>
					{item.icon ? <Icon className={item.icon} /> : ''}
					{item.name}
				</div>
			);
		};

		const Item = (item: any) => {
			const screenshot = item.screenshots.length ? item.screenshots[0] : '';

			return (
				<div className="item" onClick={e => this.onClick(e, item)}>
					<div className="info">
						<div className="name">{item.title}</div>
						<div className="author" onClick={() => onAuthor(item.author)}>
							{U.Common.sprintf(translate('popupUsecaseAuthorShort'), getAuthor(item.author))}
						</div>
					</div>					
					<div className="pictureWrapper">
						<div className="picture" style={{ backgroundImage: `url("${screenshot}")` }}></div>
					</div>
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
					<div key={`gallery-row-${param.index}`} className="row" style={param.style}>
						{item.children.map(child => <Item key={child.id} {...child} />)}
					</div>
				</CellMeasurer>
			);
		};

		return (
			<div ref={ref => this.node = ref} className="wrap">
				<div className="categories">
					<Swiper
						direction="horizontal"
						slidesPerView="auto"
						slidesPerGroupAuto={true}
						spaceBetween={8}
						onSwiper={swiper => this.swiper = swiper}
						navigation={true}
						mousewheel={true}
						modules={[ Navigation, Mousewheel ]}
					>
						{categories.map((item: any, i: number) => (
							<SwiperSlide key={item.id}>
								<Category {...item} />
								{item.id == 'made-by-any' ? <div className="div" /> : ''}
							</SwiperSlide>
						))}
					</Swiper>
				</div>

				<Label className="banner" text={translate('popupUsecaseBanner')} onClick={() => U.Common.showWhatsNew()} />

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
											rowHeight={HEIGHT}
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
		if (!S.Common.gallery.list.length) {
			this.load();
		};

		analytics.event('ScreenGallery');
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
		this.setState({ category: (item.id == this.state.category?.id ? null : item) });

		analytics.event('ClickGalleryTab', { type: item.id });
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => this.forceUpdate(), 500);
	};

	onFilterClear () {
		this.forceUpdate();
	};

	load () {
		this.setState({ isLoading: true });

		C.GalleryDownloadIndex((message: any) => {
			const categories = (message.categories || []).map(it => ({ ...it, name: this.categoryName(it.id) }));
			const list = message.list || [];

			S.Common.gallery = { categories, list };
			Onboarding.start('collaboration', true, false);
			this.setState({ isLoading: false });
		});
	};

	getCategories () {
		const { gallery } = S.Common;
		return (gallery.categories || []).filter(it => it.list.length > 0);
	};

	getItems () {
		const { category } = this.state;
		const ret: any[] = [];
		const filter = this.refFilter ? this.refFilter.getValue() : '';
		
		let items = S.Common.gallery.list || [];
		if (category) {
			items = items.filter(it => category.list.includes(it.name));
		};

		if (filter) {
			const reg = new RegExp(U.Common.regexEscape(filter), 'gi');
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
		return translate(U.Common.toCamelCase(`usecaseCategory-${id}`));
	};

};

export default PopupUsecasePageList;