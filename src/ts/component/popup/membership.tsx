import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Label } from 'Component';
import { I, translate, UtilCommon, UtilData } from 'Lib';
import { authStore } from 'Store';

import PageFree from './page/membership/free';
import PagePaid from './page/membership/paid';
import PageCurrent from './page/membership/current';
import PageSuccess from './page/membership/success';

interface State {
	isEditing: boolean;
};

const PopupMembership = observer(class PopupMembership extends React.Component<I.Popup, State> {

	state = {
		isEditing: false,
	};

	constructor (props: I.Popup) {
		super(props);

		this.onChangeEmail = this.onChangeEmail.bind(this);
	};

	render () {
		const { membership } = authStore;
		const { isEditing } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { tier, success } = data;
		const tierContent = this.getTierContent(tier);
		const tierItem = UtilData.getMembershipTier(tier);
		const cn = [ 'sides', `tier${tier}` ];

		let content: any = null;

		if (success) {
			cn.push('success');
			content = <PageSuccess {...this.props} />;
		} else
		if (!isEditing && (membership.tier == tier)) {
			content = <PageCurrent {...this.props} onChangeEmail={this.onChangeEmail} />;
		} else
		if (tier == I.MembershipTier.Explorer) {
			content = <PageFree {...this.props} />;
		} else {
			content = <PagePaid {...this.props} />;
		};

		return (
			<div className={cn.join(' ')}>
				<div className="side left">
					<Icon />
					<Title text={tierItem.name} />
					<Label text={tierItem.description} />

					<div className="contentList">
						<Label text={translate('popupMembershipWhatsIncluded')} />
						<ul>
							{tierContent.map((text, idx) => (
								<li key={idx}>{text}</li>
							))}
						</ul>
					</div>
				</div>

				<div className="side right">{content}</div>
			</div>
		);
	};

	getTierContent (tier: I.MembershipTier): string[] {
		const tierItem = UtilData.getMembershipTier(tier);
		const { features, nameMinLength } = tierItem;
		const list = [];

		if (nameMinLength) {
			list.push(UtilCommon.sprintf(translate(`popupMembershipTierFeatureAnyNameContent`), nameMinLength));
		};

		features.forEach(it => {
			list.push(UtilCommon.sprintf(translate(`popupMembershipTierFeature${it.featureId}Content`), it.value));
		});

		return list;
	};

	onChangeEmail () {
		this.setState({ isEditing: true });
	};

});

export default PopupMembership;
