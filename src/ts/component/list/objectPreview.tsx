import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Navigation } from 'swiper/modules';
import { PreviewObject, Icon } from 'Component';
import { I, U, translate } from 'Lib';

interface Props {
	canAdd?: boolean;
	defaultId?: string;
	getItems: () => any[];
	onClick?: (e: any, item: any) => void;
	onAdd?: (e: any) => void;
	onBlank?: (e: any) => void;
	onMenu?: (e: any, item: any) => void;
};

interface ListObjectPreviewRefProps {
	updateItem: (id: string) => void;
};

const ListObjectPreview = forwardRef<ListObjectPreviewRefProps, Props>(({
	canAdd = false,
	defaultId = '',
	getItems,
	onClick,
	onAdd,
	onBlank,
	onMenu,
}, ref) => {

	const nodeRef = useRef(null);
	const n = useRef(0);
	const objectRef = useRef(new Map());
	const swiperRef = useRef(null);

	const getItemsHandler = () => {
		const items = U.Common.objectCopy(getItems());

		if (canAdd) {
			items.push({ id: 'add' });
		};
		return items;
	};

	const onMouseEnter = (e: any, item: any) => {
		const items = getItemsHandler();

		n.current = items.findIndex(it => it.id == item.id);
		setActive();
	};

	const onMouseLeave = (e: any, item: any) => {
		const node = $(nodeRef.current);

		node.find('.item.hover').removeClass('hover');
		node.find('.hoverArea.hover').removeClass('hover');
	};

	const setActive = () => {
		const items = getItemsHandler();
		const item = items[n.current];

		if (!item) {
			return;
		};

		const node = $(nodeRef.current);

		node.find('.item.hover').removeClass('hover');
		node.find('.hoverArea.hover').removeClass('hover');
		node.find(`#item-${item.id}`).addClass('hover');
		node.find(`#item-${item.id} .hoverArea`).addClass('hover');
	};

	const updateItem = (id: string) => {
		objectRef.current.get(id)?.update();
	};

	const items = getItemsHandler();

	const ItemAdd = () => (
		<div id="item-add" className="item add" onClick={onAdd}>
			<Icon className="plus" />
			<div className="hoverArea" />
		</div>
	);

	const ItemBlank = (item: any) => (
		<div id={`item-${item.id}`} className="previewObject blank" onClick={onBlank}>
			{onMenu ? (
				<div id={`item-more-${item.id}`} className="moreWrapper" onClick={e => onMenu(e, item)}>
					<Icon className="more" />
				</div>
			) : ''}

			<div className="scroller">
				<div className="heading">
					<div className="name">{translate('commonBlank')}</div>
				</div>
			</div>
			<div className="border" />
		</div>
	);

	const Item = (item: any) => {
		if (item.id == 'add') {
			return <ItemAdd />;
		};

		const cn = [ 'item' ];

		if (onMenu) {
			cn.push('withMenu');
		};

		return (
			<div id={`item-${item.id}`} className={cn.join(' ')}>
				{defaultId == item.id ? <div className="defaultLabel">{translate('commonDefault')}</div> : ''}

				<div
					className="hoverArea"
					onMouseEnter={e => onMouseEnter(e, item)}
					onMouseLeave={e => onMouseLeave(e, item)}
				>
					<PreviewObject
						ref={ref => objectRef.current.set(item.id, ref)}
						size={I.PreviewSize.Medium}
						rootId={item.id}
						onClick={e => onClick(e, item)}
						onMore={onMenu ? e => onMenu(e, item) : null}
					/>
				</div>
			</div>
		);
	};

	useImperativeHandle(ref, () => ({
		updateItem,
	}));

	return (
		<div 
			ref={nodeRef}
			className="listObjectPreview"
		>
			<Swiper
				spaceBetween={16}
				slidesPerView={3}
				mousewheel={true}
				navigation={true}
				modules={[ Mousewheel, Navigation ]}
				onSwiper={swiper => swiperRef.current = swiper}
			>
				{items.map((item: any, i: number) => (
					<SwiperSlide key={i}>
						<Item key={i} {...item} index={i} />
					</SwiperSlide>
				))}
			</Swiper>
		</div>
	);

});

export default ListObjectPreview;