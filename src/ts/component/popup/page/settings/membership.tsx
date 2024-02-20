import * as React from 'react';
import $ from 'jquery';
import { Title, Label, Button, Icon, Loader } from 'Component';
import { I, C, translate, UtilCommon, UtilDate } from 'Lib';
import { popupStore } from 'Store';
import { observer } from 'mobx-react';
import Url from 'json/url.json';

const PopupSettingsPageMembership = observer(class PopupSettingsPageMembership extends React.Component<I.PopupSettings> {

	state = {
		loading: false,
		currentSlide: 0
	};

	node: any = null;
	slideWidth: number = 0;
	currentTier: I.SubscriptionTier = 0;
	currentTierValid: number = 0;

	render () {
		const { loading, currentSlide } = this.state;
		const style = { left: -this.slideWidth * currentSlide };

		const slides = [
			{ title: translate('popupSettingsMembershipSlide0Title'), text: translate('popupSettingsMembershipSlide0Text') },
			{ title: translate('popupSettingsMembershipSlide1Title'), text: translate('popupSettingsMembershipSlide1Text') },
			{ title: translate('popupSettingsMembershipSlide2Title'), text: UtilCommon.sprintf(translate('popupSettingsMembershipSlide2Text'), Url.vision) },
			{ title: translate('popupSettingsMembershipSlide3Title'), text: translate('popupSettingsMembershipSlide3Text') },
		];
		const tiers = [
			{ id: I.SubscriptionTier.Explorer },
			{ id: I.SubscriptionTier.Builder1WeekTEST, price: 99, period: 1 },
			{ id: I.SubscriptionTier.CoCreator1WeekTEST, price: 399, period: 5 },
		];

		const SlideItem = (slide) => (
			<div onClick={() => this.setState({ currentSlide: slide.idx })} className={[ 'slide', `slide${slide.idx}` ].join(' ')}>
				<div className={[ 'illustration', `slide${slide.idx}` ].join(' ')} />
				<div className="text">
					<Title text={slide.title} />
					<Label text={slide.text} />
				</div>
			</div>
		);

		const TierItem = (item: any) => {
			if (item.id < this.currentTier) {
				return null;
			};

			const isCurrent = item.id == this.currentTier;

			let price = '';
			let period = '';
			let currentLabel = null;
			let buttonText = translate('popupSettingsMembershipLearnMore');

			if (!item.price) {
				price = translate('popupSettingsMembershipJustEmail');
			} else {
				price = `$${item.price}`;
			};

			if (item.period) {
				if (item.period == 1) {
					period = translate('popupSettingsMembershipPerYear')
				} else {
					period = UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), item.period);
				};
			};

			if (isCurrent) {
				if (item.period && this.currentTierValid) {
					period = UtilCommon.sprintf(translate('popupSettingsMembershipValidUntil'), UtilDate.date('d M Y', this.currentTierValid))
				} else {
					period = translate('popupSettingsMembershipForeverFree');
				};

				currentLabel = <div className="currentLabel">{translate('popupSettingsMembershipCurrent')}</div>;
				buttonText = translate('popupSettingsMembershipManage');
			};

			return (
				<div className={[ 'tier', `tier${item.id}`, isCurrent ? 'current' : '' ].join(' ')}>
					<div className="top">
						{currentLabel}
						<div className={[ 'icon', `tier${item.id}` ].join(' ')} />
						<Title text={translate(`popupSettingsMembershipTitle${item.id}`)} />
						<Label text={translate(`popupSettingsMembershipDescription${item.id}`)} />
					</div>
					<div className="bottom">
						<div className="priceWrapper">
							<span className="price">{price}</span>{period}
						</div>
						<Button
							onClick={() => popupStore.open('subscriptionPlan', { data: { tier: item.id } })}
							className="c28"
							text={buttonText}
						/>
					</div>
				</div>
			);
		};

		return (
			<div ref={node => this.node = node}>
				<div className="membershipTitle">{this.currentTier ? translate('popupSettingsMembership') : translate('popupSettingsMembershipTitle')}</div>

				{loading ? <Loader/> : ''}

				{this.currentTier ? '' : (
					<React.Fragment>
						<Label className="description" text={translate('popupSettingsMembershipText')} />

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
					</React.Fragment>
				)}

				<div className="tiers">
					{tiers.map((tier, idx) => (
						<TierItem key={idx} {...tier} />
					))}
				</div>

				<div className="actionItems">
					<div className="item">
						<Label text={translate('popupSettingsMembershipLevelsDetails')} />
						<Icon />
					</div>
					<div className="item">
						<Label text={translate('popupSettingsMembershipPrivacyPolicy')} />
						<Icon />
					</div>
					<div className="item">
						<Label text={translate('popupSettingsMembershipTermsAndConditions')} />
						<Icon />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		// this.getStatus();

		this.slideWidth = $(this.node).width() + 16;
		$(window).on('resize.membership', () => {
			this.slideWidth = $(this.node).width() + 16;
		});
	};

	componentWillUnmount () {
		$(window).off('resize.membership');
	};

	getStatus () {
		this.setState({ loading: true });
		C.PaymentsSubscriptionGetStatus((message) => {
			this.setState({ loading: false });

			if (message.tier) {
				this.currentTier = message.tier;
				if (message.dateEnds) {
					this.currentTierValid = message.dateEnds;
				};

				this.forceUpdate();
			};
		});
	};

});

export default PopupSettingsPageMembership;
