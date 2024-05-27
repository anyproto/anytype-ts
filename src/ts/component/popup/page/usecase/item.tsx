import * as React from 'react';
import $ from 'jquery';
import { Title, Label, Button, Tag, Icon, Loader, Error } from 'Component';
import { I, C, UtilCommon, UtilFile, UtilDate, translate, UtilSpace, analytics } from 'Lib';
import { menuStore } from 'Store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Mousewheel } from 'swiper/modules';
const Constant = require('json/constant.json');

interface State {
	isLoading: boolean;
	error: string;
};

class PopupUsecasePageItem extends React.Component<I.PopupUsecase, State> {

	node = null;
	swiper = null;
	refButton = null;
	state = { 
		isLoading: false,
		error: '',
	};

	constructor (props: I.PopupUsecase) {
		super(props);

		this.onMenu = this.onMenu.bind(this);
		this.onSwiper = this.onSwiper.bind(this);
	};
	
	render () {
		const { getAuthor, onAuthor, onPage } = this.props;
		const { isLoading, error } = this.state;
		const object = this.getObject();
		const author = getAuthor(object.author);
		const screenshots = object.screenshots || [];
		const categories = (object.categories || []).slice(0, 10);

		return (
			<div ref={ref => this.node = ref}>
				{isLoading ? <Loader id="loader" /> : ''}

				<div className="head">
					<div className="inner">
						<div className="element" onClick={() => onPage('', {})}>
							<Icon className="back" />
							{translate('commonBack')}
						</div>
					</div>
				</div>

				<div className="titleWrap">
					<div className="side left">
						<Title text={object.title} />
						<Label text={UtilCommon.sprintf(translate('popupUsecaseAuthor'), author)} onClick={() => onAuthor(object.author)} />
					</div>
					<div className="side right">
						<Button ref={ref => this.refButton = ref} id="button-install" text={translate('popupUsecaseInstall')} arrow={true} onClick={this.onMenu} />
					</div>
				</div>

				<Error text={error} />

				<div className="screenWrap">
					<Swiper 
						spaceBetween={20} 
						slidesPerView={1.05}
						mousewheel={true}
						autoplay={{
							waitForTransition: true,
							delay: 4000,
							disableOnInteraction: true,
						}}
						centeredSlides={true}
						loop={true}
						modules={[ Autoplay, Mousewheel ]}
						onSlideChange={() => this.checkArrows()}
						onSwiper={swiper => this.onSwiper(swiper)}
					>
						{screenshots.map((url: string, i: number) => (
							<SwiperSlide key={i}>
								<img className="screen" src={url} />
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
		const object = this.getObject();

		analytics.event('ScreenGalleryInstall', { name: object.name });
	};

	onSwiper (swiper) {
		this.swiper = swiper;
		this.checkArrows();
	};

	onArrow (dir: number) {
		dir < 0 ? this.swiper.slidePrev() : this.swiper.slideNext();
	};

	checkArrows () {
		if (!this.swiper) {
			return;
		};

		const node = $(this.node);
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const idx = this.swiper.activeIndex;
		const length = (this.swiper.slides || []).length;

		!idx ? arrowLeft.addClass('hide') : arrowLeft.removeClass('hide');
		idx >= length - 1 ? arrowRight.addClass('hide') : arrowRight.removeClass('hide');
	};

	onMenu () {
		const { getId, close } = this.props;
		const object = this.getObject();

		const cb = (spaceId: string, isNew: boolean) => {
			C.ObjectImportExperience(spaceId, object.downloadLink, object.title, isNew, (message: any) => {
				if (!message.error.code) {
					analytics.event('GalleryInstall', { name: object.name });
				};
			});
			close();
		};

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
					const isNew = item.id == 'add';

					this.setState({ isLoading: true });
					analytics.event('ClickGalleryInstallSpace', { type: isNew ? 'New' : 'Existing' });

					if (isNew) {
						C.WorkspaceCreate({ name: object.title, iconOption: UtilCommon.rand(1, Constant.iconCnt) }, I.Usecase.None, (message: any) => {
							if (!message.error.code) {
								cb(message.objectId, true);

								analytics.event('CreateSpace', { middleTime: message.middleTime, route: analytics.route.gallery });
							} else {
								this.setState({ isLoading: false, error: message.error.description });
							};
						});
					} else {
						cb(item.targetSpaceId, false);
					};
				},
			}
		});

		analytics.event('ClickGalleryInstall', { name: object.name });
	};

	getSpaceOptions (): any[] {
		let list: any[] = [
			{ name: translate('popupUsecaseMenuLabel'), isSection: true }
		];

		if (list.length < Constant.limit.space) {
			list.push({ id: 'add', icon: 'add', name: translate('popupUsecaseSpaceCreate') });
		};

		list = list.concat(UtilSpace.getList()
			.filter(it => UtilSpace.canMyParticipantWrite(it.targetSpaceId))
			.map(it => ({ ...it, iconSize: 48, object: it })));
		
		return list;
	};

	getObject (): any {
		const { param } = this.props;
		const { data } = param;

		return data.object || {};
	};

};

export default PopupUsecasePageItem;