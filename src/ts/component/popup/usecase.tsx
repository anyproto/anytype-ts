import * as React from 'react';
import $ from 'jquery';
import { Title, Label, Button, Tag, Icon } from 'Component';
import { I, UtilCommon, UtilFile, UtilDate, translate, Renderer } from 'Lib';
import { menuStore, dbStore, detailStore, popupStore } from 'Store';
import { Swiper, SwiperSlide } from 'swiper/react';
import Constant from 'json/constant.json';

class PopupUsecase extends React.Component<I.Popup> {

	node = null;
	swiper = null;

	constructor (props: I.Popup) {
		super(props);

		this.onMenu = this.onMenu.bind(this);
		this.onAuthor = this.onAuthor.bind(this);
		this.onSwiper = this.onSwiper.bind(this);
	};
	
	render () {
		const object = this.getObject();
		const author = this.getAuthor();
		const screenshots = object.screenshots || [];
		const categories = object.categories || [];

		return (
			<div ref={ref => this.node = ref}>
				<div className="titleWrap">
					<div className="side left">
						<Title text={object.title} />
						<Label text={UtilCommon.sprintf(translate('popupUsecaseAuthor'), author)} onClick={this.onAuthor} />
					</div>
					<div className="side right">
						<Button id="button-install" text={translate('popupUsecaseInstall')} arrow={true} onClick={this.onMenu} />
					</div>
				</div>

				<div className="screenWrap">
					<Swiper 
						spaceBetween={20} 
						slidesPerView={1}
						onSlideChange={() => this.checkArrows()}
						onSwiper={swiper => this.onSwiper(swiper)}
					>
						{screenshots.map((url: string, i: number) => (
							<SwiperSlide key={i}>
								<div className="screen" style={{ backgroundImage: `url('${url}')` }} />
							</SwiperSlide>
						))}
    				</Swiper>

					<Icon id="arrowLeft" className="arrow left" onClick={() => this.onArrow(-1)} />
					<Icon id="arrowRight" className="arrow right" onClick={() => this.onArrow(1)} />
				</div>

				<div className="footerWrap">
					<div className="side left">
						<Label text={object.description} />
					</div>
					<div className="side right">
						<div className="tags">
							{categories.map((name: string, i: number) => (
								<Tag key={i} text={name} />
							))}
						</div>
						<Label text={UtilCommon.sprintf(translate('popupUsecaseUpdated'), UtilDate.date(UtilDate.dateFormat(I.DateFormat.MonthAbbrBeforeDay), UtilDate.now()))} />
						<Label text={UtilFile.size(object.size)} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		window.setTimeout(() => this.checkArrows(), 10);
	};

	onSwiper (swiper) {
		this.swiper = swiper;
	};

	onArrow (dir: number) {
		dir < 0 ? this.swiper.slidePrev() : this.swiper.slideNext();
	};

	checkArrows () {
		const node = $(this.node);
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const idx = this.swiper.activeIndex;
		const length = this.swiper.slides.length;

		!idx ? arrowLeft.addClass('hide') : arrowLeft.removeClass('hide');
		idx >= length - 1 ? arrowRight.addClass('hide') : arrowRight.removeClass('hide');
	};

	onMenu () {
		const { getId } = this.props;

		menuStore.open('select', {
			element: `#${getId()} #button-install`,
			offsetY: 2,
			noFlipX: true,
			className: 'spaceSelect',
			data: {
				options: this.getSpaceOptions(),
				noVirtualisation: true, 
				noScroll: true,
				onSelect: (e: any, item: any) => {
					console.log('SPACE', item);

					if (item.id == 'add') {
						popupStore.open('settings', { 
							className: 'isSpaceCreate',
							data: { 
								page: 'spaceCreate', 
								isSpace: true,
								onCreate: id => {
									console.log('onCreate', id);
								},
							}, 
						});
					} else {
						
					};
				},
			}
		});
	};

	getSpaceOptions (): any[] {
		const subId = Constant.subId.space;
		
		let list = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id));

		list = list.map(it => ({ id: it.id, name: it.name, iconSize: 48, object: it }));

		if (list.length < Constant.limit.space) {
			list.unshift({ id: 'add', icon: 'add', name: translate('popupUsecaseSpaceCreate') });
		};
		list.unshift({ name: translate('popupUsecaseMenuLabel'), isSection: true });

		return list;
	};

	onAuthor () {
		const object = this.getObject();

		if (object.author) {
			Renderer.send('urlOpen', object.author);
		};
	};

	getObject (): any {
		const { param } = this.props;
		const { data } = param;

		return data.object || {};
	};

	getAuthor (): string {
		const object = this.getObject();

		if (!object.author) {
			return '';
		};

		let a: any = {};
		try { a = new URL(object.author); } catch (e) {};

		return String(a.pathname || '').replace(/^\//, '');
	};

};

export default PopupUsecase;