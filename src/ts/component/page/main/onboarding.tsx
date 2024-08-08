import * as React from 'react';
import $ from 'jquery';
import { C, I, translate, U } from 'Lib';
import { Icon, Title, Label } from 'Component';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCreative } from 'swiper/modules';

enum Stage {
	Type	 = 0,
	Purpose	 = 1,
	Usecase	 = 2,
};

type State = {
	stage: Stage;
};

class PageMainOnboarding extends React.Component<I.PageComponent, State> {

	node: any = null;
	swiper = null;
	usecases: any[] = [];
	current: number = 0;

	state: State = {
		stage: Stage.Type,
	};
	param: any = {
		type: I.SpaceType.Private,
		purpose: 'personal',
		usecase: 0,
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.getItems = this.getItems.bind(this);
		this.onItemClick = this.onItemClick.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onSwiper = this.onSwiper.bind(this);
	};

	render () {
		const { stage } = this.state;
		const { type } = this.param;
		const cn = [ 'wrapper', `stage${Stage[stage]}` ];
		const items = this.getItems(stage);

		const Item = (el) => {
			const prefix = U.Common.toCamelCase(`onboardingExperienceItems-${el.id}`);

			let labelPrefix = '';
			if (el.id == 'personal') {
				labelPrefix = U.Common.toCamelCase(`onboardingExperienceItems-${el.id}-${I.SpaceType[type]}`)
			};

			return (
				<div onClick={() => this.onItemClick(el)} className={[ 'item', `item-${el.id}` ].join(' ')}>
					<Icon className={el.id} />
					<Title text={translate(`${prefix}Title`)} />
					<Label text={translate(`${labelPrefix ? labelPrefix : prefix}Text`)} />
				</div>
			);
		};

		const UsecaseItem = (el) => {
			const screenshot = el.screenshots.length ? el.screenshots[0] : '';

			return (
				<div className="item">
					<div className="picture" style={{ backgroundImage: `url("${screenshot}")` }}></div>
					<div className="text">
						<Title text={el.title} />
						<Label text={el.description} />
					</div>
				</div>
			);
		};

		let content = null;
		if (stage == Stage.Usecase) {
			content = (
				<div className="usecases">
					<Swiper
						effect={'creative'}
						creativeEffect={{
							prev: {
								translate: ['-90%', 0, 0],
								scale: 0.5,
								opacity: 0.5,
							},
							next: {
								translate: ['90%', 0, 0],
								scale: 0.5,
								opacity: 0.5,
							},
						}}
						modules={[EffectCreative]}
						spaceBetween={95}
						speed={400}
						slidesPerView={1.5}
						centeredSlides={true}
						onSlideChange={() => this.checkArrows()}
						onSwiper={swiper => this.onSwiper(swiper)}
					>
						{this.usecases.map((el: any, i: number) => (
							<SwiperSlide key={i}>
								<UsecaseItem {...el} />
							</SwiperSlide>
						))}
					</Swiper>

					<Icon id="arrowLeft" className="arrow left" onClick={() => this.onArrow(-1)} />
					<Icon id="arrowRight" className="arrow right" onClick={() => this.onArrow(1)} />
				</div>
			)
		} else {
			content = <div className="items">{items.map((el, i) => <Item key={i} {...el} />)}</div>;
		};

		return (
			<div ref={ref => this.node = ref} className={cn.join(' ')}>
				{this.canMoveBack() ? <Icon className="arrow back" onClick={this.onBack} /> : ''}

				<Title text={translate(`onboardingExperience${Stage[stage]}Title`)} />

				{content}
			</div>
		);
	};

	componentDidMount () {
		this.loadUsecases();
	};

	loadUsecases () {
		C.GalleryDownloadIndex((message: any) => {
			this.usecases = (message.list || []).slice(0,3);
			this.forceUpdate();
		});
	};

	getItems (stage: Stage) {
		const { type } = this.param;
		let ret = [];

		switch (stage) {
			default:
			case Stage.Type: {
				ret = [
					{ id: 'private', value: I.SpaceType.Private },
					{ id: 'shared', value: I.SpaceType.Shared },
				];

				break;
			};
			case Stage.Purpose: {
				ret = [
					{ id: 'personal', value: 'personal' },
					{ id: 'education', value: 'education' },
					{ id: 'work', value: 'work' },
				];

				if (type == I.SpaceType.Shared) {
					ret.push({ id: 'community', value: 'community' });
				};

				break;
			};
			case Stage.Usecase: {
				// getting usecases logic
				ret = this.usecases;
				break;
			};
		};

		return ret.map(it => ({ ...it, stage }));
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

	onItemClick (item: any) {
		const { stage } = this.state;
		const paramKey = Stage[stage].toLowerCase();

		this.param[paramKey] = item.value;
		this.setState({ stage: stage + 1 });
	};

	onBack () {
		if (!this.canMoveBack()) {
			return;
		};

		const { stage } = this.state;

		this.setState({ stage: stage - 1 });
	};

	canMoveBack (): boolean {
		return this.state.stage > Stage.Type;
	};

	onFinish (routeParam) {
		U.Data.onAuth({ routeParam });
		U.Data.onAuthOnce(true);
	};
};

export default PageMainOnboarding;
