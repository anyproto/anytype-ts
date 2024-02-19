import * as React from 'react';
import { Title, Icon, Label } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import PageFree from './page/subscription/free';
import PagePaid from './page/subscription/paid';

const PopupSubscriptionPlan = observer(class PopupSubscriptionPlan extends React.Component<I.Popup> {

	constructor (props: I.Popup) {
		super(props);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const tierContent = this.getTierContent(tier);
		const tiers = {
			1: { idx: 1 },
			2: { idx: 2, price: 99, period: 1, minNameLength: 7 },
			3: { idx: 3, price: 399, period: 5, minNameLength: 5 },
		};
		const current = tiers[tier];

		let content: any = null;

		if (tier == 1) {
			content = <PageFree {...this.props} />;
		} else {
			content = <PagePaid current={current} />;
		};

		return (
			<div className={[ 'sides', `tier${tier}` ].join(' ')}>
				<div className="side left">
					<Icon />
					<Title text={translate(`popupSettingsMembershipTitle${tier}`)} />
					<Label text={translate(`popupSettingsMembershipDescription${tier}`)} />

					<div className="contentList">
						<Label text={translate('popupSubscriptionPlanWhatsIncluded')} />
						<ul>
							{tierContent.map((text, idx) => (
								<li key={idx}>{translate(text)}</li>
							))}
						</ul>
					</div>
				</div>

				<div className="side right">{content}</div>
			</div>
		);
	};

	getTierContent (tier) {
		const content = {
			1: [
				'popupSubscriptionPlanTier1Content1',
				'popupSubscriptionPlanTier1Content2',
				'popupSubscriptionPlanTier1Content3',
			],
			2: [
				'popupSubscriptionPlanTier2Content1',
				'popupSubscriptionPlanTier2Content2',
				'popupSubscriptionPlanTier2Content3',
				'popupSubscriptionPlanTier2Content4',
			],
			3: [
				'popupSubscriptionPlanTier3Content1',
				'popupSubscriptionPlanTier3Content2',
				'popupSubscriptionPlanTier3Content3',
				'popupSubscriptionPlanTier3Content4',
				'popupSubscriptionPlanTier3Content5',
			]
		};

		return content[tier];
	};
});

export default PopupSubscriptionPlan;
