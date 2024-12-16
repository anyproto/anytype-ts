import * as React from 'react';
import $ from 'jquery';
import { Title, Label, Button, Tag, Icon, Loader, Error } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Mousewheel } from 'swiper/modules';

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
						<Label text={U.Common.sprintf(translate('popupUsecaseAuthor'), author)} onClick={() => onAuthor(object.author)} />
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
						<Label text={U.Common.sprintf(translate('popupUsecaseUpdated'), U.Date.dateWithFormat(S.Common.dateFormat, U.Date.now()))} />
						<Label text={U.File.size(object.size)} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		const object = this.getObject();

		analytics.event('ScreenGalleryInstall', { name: object.name, route: this.getRoute() });
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

		arrowLeft.toggleClass('hide', !idx);
		arrowRight.toggleClass('hide', idx >= length - 1);
	};

	onMenu () {
		const { getId, close } = this.props;
		const object = this.getObject();
		const route = this.getRoute();

		const cb = (spaceId: string, isNew: boolean) => {
			C.ObjectImportExperience(spaceId, object.downloadLink, object.title, isNew, (message: any) => {
				if (!message.error.code) {
					analytics.event('GalleryInstall', { name: object.name, route });
				};
			});
			close();
		};

		S.Menu.open('select', {
			element: `#${getId()} #button-install`,
			offsetY: 2,
			noFlipX: true,
			className: 'spaceSelect',
			data: {
				options: this.getSpaceOptions(),
				noVirtualisation: true, 
				onSelect: (e: any, item: any) => {
					const isNew = item.id == 'add';
					const withChat = U.Object.isAllowedChat();

					this.setState({ isLoading: true });
					analytics.event('ClickGalleryInstallSpace', { type: isNew ? 'New' : 'Existing', route });

					if (isNew) {
						C.WorkspaceCreate({ name: object.title, iconOption: U.Common.rand(1, J.Constant.count.icon) }, I.Usecase.None, withChat, (message: any) => {
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

		analytics.event('ClickGalleryInstall', { name: object.name, route });
	};

	getSpaceOptions (): any[] {
		let list: any[] = [
			{ name: translate('popupUsecaseMenuLabel'), isSection: true }
		];

		if (U.Space.canCreateSpace()) {
			list.push({ id: 'add', icon: 'add', name: translate('popupUsecaseSpaceCreate'), isBig: true });
		};

		list = list.concat(U.Space.getList()
			.filter(it => U.Space.canMyParticipantWrite(it.targetSpaceId))
			.map(it => ({ ...it, iconSize: 48, object: it, isBig: true })));
		
		return list;
	};

	getObject (): any {
		return this.props.param.data.object || {};
	};

	getRoute (): string {
		return String(this.props.param.data.route || '');
	};

};

export default PopupUsecasePageItem;