import * as React from 'react';
import { Title, Icon, Label, Input, Button, Checkbox } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';

const PopupSubscriptionPlan = observer(class PopupSubscriptionPlan extends React.Component<I.Popup> {

	refCheckbox: any = null;

	constructor (props: I.Popup) {
		super(props);

		this.onCheck = this.onCheck.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const tierContent = this.getTierContent(tier);
		const tiers = {
			1: { idx: 1 },
			2: { idx: 2, price: 99, period: 1 },
			3: { idx: 3, price: 399, period: 5 },
		};
		const current = tiers[tier];

		let content: any = null;

		if (tier == 1) {
			content = (
				<React.Fragment>
					<Title text={translate(`popupSubscriptionPlanFreeTitleStep1`)} />
					<Label text={translate(`popupSubscriptionPlanFreeText`)} />

					<div className="inputWrapper">
						<Input placeholder={translate(`commonEmail`)} />
					</div>

					<div className="check" onClick={this.onCheck}>
						<Checkbox ref={ref => this.refCheckbox = ref} value={false} /> {translate('popupSubscriptionPlanFreeCheckboxText')}
					</div>

					<Button className="c36" text={translate('commonSubmit')} />
				</React.Fragment>
			);
		} else {
			let period = '';

			if (current.period == 1) {
				period = translate('popupSettingsPaymentItemPerYear')
			} else {
				period = UtilCommon.sprintf(translate('popupSettingsPaymentItemPerYears'), current.period);
			};

			content = (
				<React.Fragment>
					<Title text={translate(`popupSubscriptionPlanPaidTitle`)} />
					<Label text={translate(`popupSubscriptionPlanPaidText`)} />

					<div className="inputWrapper">
						<Input placeholder={translate(`popupSubscriptionPlanPaidPlaceholder`)} />
						<div className="ns">.any</div>
					</div>
					<div className="statusBar"> </div>

					<div className="priceWrapper">
						<span className="price">{`$${current.price}`}</span>{period}
					</div>

					<Button className="c36" text={translate('popupSubscriptionPlanPayByCard')} />
					<Button className="c36" text={translate('popupSubscriptionPlanPayByCrypto')} />
				</React.Fragment>
			);
		}

		return (
			<div className={['sides', `tier${tier}`].join(' ')}>
				<div className="side left">
					<Icon />
					<Title text={translate(`popupSettingsPaymentItemTitle${tier}`)} />
					<Label text={translate(`popupSettingsPaymentItemDescription${tier}`)} />

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

	onCheck () {
		const value = !this.refCheckbox.getValue();

		this.refCheckbox.setValue(value);
	};
});

export default PopupSubscriptionPlan;
