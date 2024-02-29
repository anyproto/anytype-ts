import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Label } from 'Component';
import { I, translate, UtilData } from 'Lib';
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

		const tiers = UtilData.getMembershipTiersMap();
		const tierItem = tiers[tier];
		const suffix = tierItem.idx;
		const cn = [ 'sides', `tier${suffix}` ];

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
					<Title text={translate(`popupSettingsMembershipTitle${suffix}`)} />
					<Label text={translate(`popupSettingsMembershipDescription${suffix}`)} />

					<div className="contentList">
						<Label text={translate('popupMembershipWhatsIncluded')} />
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

	getTierContent (tier: I.MembershipTier): string[] {
		switch (tier) {
			case I.MembershipTier.Explorer: {
				return  [
					'popupMembershipTier1Content1',
					'popupMembershipTier1Content2',
					'popupMembershipTier1Content3',
				];
			};

			case I.MembershipTier.Builder1WeekTEST: 
			case I.MembershipTier.Builder1Year: {
				return [
					'popupMembershipTier2Content1',
					'popupMembershipTier2Content2',
					'popupMembershipTier2Content3',
					'popupMembershipTier2Content4',
				];
			};

			case I.MembershipTier.CoCreator1WeekTEST:
			case I.MembershipTier.CoCreator1Year: {
				return [
					'popupMembershipTier3Content1',
					'popupMembershipTier3Content2',
					'popupMembershipTier3Content3',
					'popupMembershipTier3Content4',
					'popupMembershipTier3Content5',
				];
			};
		};
	};

	onChangeEmail () {
		this.setState({ isEditing: true });
	};

});

export default PopupMembership;
