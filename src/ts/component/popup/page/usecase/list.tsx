import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Loader, Title, Label, EmptySearch, Icon, Filter } from 'Component';
import { I, C, S, U, translate, analytics, Onboarding } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Navigation } from 'swiper/modules';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';

const HEIGHT = 378;
const LIMIT = 2;

const PopupUsecasePageList = observer(forwardRef<{}, I.PopupUsecase>((props, ref) => {

	const { getAuthor, onAuthor, position, onPage } = props;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ category, setCategory ] = useState(null);
	const [ dummy, setDummy ] = useState(0);

	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const filterRef = useRef(null);
	const swiperRef = useRef(null);
	const cacheRef = useRef(new CellMeasurerCache({
		defaultHeight: HEIGHT,
		fixedWidth: true,
	}));
	const timeoutResizeRef = useRef(0);
	const timeoutFilterRef = useRef(0);

	const reset = () => {
		cacheRef.current.clearAll();

		if (listRef.current) {
			listRef.current.recomputeRowHeights(0);
		};
	};

	const onClick = (e: any, item: any) => {
		onPage('item', { object: item });
	};

	const onCategory = (item: any) => {
		setCategory(item.id == category?.id ? null : item);
		analytics.event('ClickGalleryTab', { type: item.id });
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeoutFilterRef.current);
		timeoutFilterRef.current = window.setTimeout(() => setDummy(dummy + 1), 500);
	};

	const onFilterClear = () => {
		setDummy(dummy + 1);
	};

	const load = () => {
		setIsLoading(true);

		C.GalleryDownloadIndex((message: any) => {
			const categories = (message.categories || []).map(it => ({ ...it, name: categoryName(it.id) }));
			const list = message.list || [];

			S.Common.gallery = { categories, list };
			Onboarding.start('collaboration', true, false);
			setIsLoading(false);
		});
	};

	const getCategories = () => {
		const { gallery } = S.Common;
		return (gallery.categories || []).filter(it => it.list.length > 0);
	};

	const getItems = () => {
		const ret: any[] = [];
		const filter = String(filterRef.current?.getValue() || '');

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

	const onResize = ({ width }) => {
		window.clearTimeout(timeoutResizeRef.current);
		timeoutResizeRef.current = window.setTimeout(() => {}, 10);
	};

	const categoryName = (id: string) => {
		return translate(U.Common.toCamelCase(`usecaseCategory-${id}`));
	};

	useEffect(() => {
		if (!S.Common.gallery.list.length) {
			load();
		};

		analytics.event('ScreenGallery');
	}, [load]);

	useEffect(() => {
		reset();
		position();
	});

	useEffect(() => {
		return () => {
			window.clearTimeout(timeoutResizeRef.current);
			window.clearTimeout(timeoutFilterRef.current);
		};
	}, []);

	const categories = getCategories();
	const items = getItems();
	const filter = filterRef.current ? filterRef.current.getValue() : '';

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
				onClick={() => onCategory(item)}
			>
				{item.icon ? <Icon className={item.icon} /> : ''}
				{item.name}
			</div>
		);
	};

	const Item = (item: any) => {
		const screenshot = item.screenshots.length ? item.screenshots[0] : '';

		return (
			<div className="item" onClick={e => onClick(e, item)}>
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
				cache={cacheRef.current}
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
		<div ref={nodeRef} className="wrap">
			<div className="categories">
				<Swiper
					direction="horizontal"
					slidesPerView="auto"
					slidesPerGroupAuto={true}
					spaceBetween={8}
					onSwiper={swiper => swiperRef.current = swiper}
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
					ref={filterRef}
					id="store-filter"
					icon="search"
					placeholder={translate('commonSearchPlaceholder')}
					onChange={onFilterChange}
					onClear={onFilterClear}
				/>
			</div>

			<div className="items">
				{!items.length ? (
					<EmptySearch text={textEmpty} />
				) : (
					<WindowScroller scrollElement={$('#popupUsecase-innerWrap').get(0)}>
						{({ height, isScrolling, registerChild, scrollTop }) => (
							<AutoSizer disableHeight={true} className="scrollArea" onResize={onResize}>
								{({ width }) => (
									<List
										ref={listRef}
										autoHeight={true}
										height={Number(height) || 0}
										width={Number(width) || 0}
										deferredMeasurmentCache={cacheRef.current}
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

}));

export default PopupUsecasePageList;