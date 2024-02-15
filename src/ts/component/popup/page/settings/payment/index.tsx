import * as React from 'react';
import { Title, Label, Button, Icon } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import $ from 'jquery';

const PopupSettingsPagePaymentIndex = observer(class PopupSettingsPagePaymentIndex extends React.Component<I.PopupSettings> {

	state = {
		currentSlide: 0
	};
	node: any = null;
	slideWidth: number = 0;

	render () {
		const { onPage } = this.props;
		const { currentSlide } = this.state;
		const style = { left: -this.slideWidth * currentSlide };

		const slides = [
			{ title: translate('popupSettingsPaymentIndexSlide0Title'), text: translate('popupSettingsPaymentIndexSlide0Text') },
			{ title: translate('popupSettingsPaymentIndexSlide0Title'), text: translate('popupSettingsPaymentIndexSlide0Text') },
			{ title: translate('popupSettingsPaymentIndexSlide0Title'), text: translate('popupSettingsPaymentIndexSlide0Text') },
		];
		const tiers = [
			{ idx: 1 },
			{ idx: 2, price: 99, period: 1 },
			{ idx: 3, price: 399, period: 5 },
		];

		const SlideItem = (slide) => (
			<div className={[ 'slide', `slide${slide.idx}` ].join(' ')}>
				<div className="textWrapper">
					<div className={[ 'illustration', `slide${slide.idx}` ].join(' ')} />
					<Title text={slide.title} />
					<Label text={slide.text} />
				</div>
			</div>
		);

		const TierItem = (item: any) => {
			let price = '';
			let period = '';

			if (!item.price) {
				price = translate('popupSettingsPaymentItemJustEmail');
			} else {
				price = `$${item.price}`;
			};

			if (item.period) {
				if (item.period == 1) {
					period = translate('popupSettingsPaymentItemPerYear')
				} else {
					period = UtilCommon.sprintf(translate('popupSettingsPaymentItemPerYears'), item.period);
				};
			};

			return (
				<div className={[ 'tier', `tier${item.idx}` ].join(' ')}>
					<div className="top">
						<div className={[ 'icon', `tier${item.idx}` ].join(' ')} />
						<Title text={translate(`popupSettingsPaymentItemTitle${item.idx}`)} />
						<Label text={translate(`popupSettingsPaymentItemDescription${item.idx}`)} />
					</div>
					<div className="bottom">
						<div className="priceWrapper">
							<span className="price">{price}</span>{period}
						</div>
						<Button text={translate('popupSettingsPaymentItemLearnMore')} />
					</div>
				</div>
			);
		};

		return (
			<div ref={node => this.node = node}>
				<div className="membershipTitle">{translate('popupSettingsPaymentIndexTitle')}</div>
				<Label className="description" text={translate('popupSettingsPaymentIndexText')} />

				<div className="slider">
					<div style={style} className="feed">
						{slides.map((slide, idx) => (
							<SlideItem key={idx} idx={idx} {...slide} />
						))}
					</div>
					<div className="bullits">
						{slides.map((slide, idx) => {
							const cn = [ 'bullit', currentSlide == idx ? 'active' : '' ];

							return <div className={cn.join(' ')} onClick={() => this.setState({ currentSlide: idx })} key={idx} />;
						})}
					</div>
				</div>

				<div className="tiers">
					{tiers.map((tier, idx) => (
						<TierItem key={idx} {...tier} />
					))}
				</div>

				<div className="actionItems">
					<div className="item">
						<Label text={translate('popupSettingsPaymentIndexMembershipLevelsDetails')} />
						<Icon />
					</div>
					<div className="item">
						<Label text={translate('popupSettingsPaymentIndexPrivacyPolicy')} />
						<Icon />
					</div>
					<div className="item">
						<Label text={translate('popupSettingsPaymentIndexTermsAndConditions')} />
						<Icon />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.slideWidth = $(this.node).width() + 16;

		$(window).on('resize.membership', () => {
			console.log('WIDTH: ', $(this.node).width() + 16)
			this.slideWidth = $(this.node).width() + 16;
		});
	};

	componentWillUnmount () {
		$(window).off('resize.membership');
	};

});

export default PopupSettingsPagePaymentIndex;
