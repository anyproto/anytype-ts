import * as React from 'react';
import { Title, Icon, Label } from 'Component';
import { I, C, translate, UtilCommon, Storage } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';
import PageFree from './page/membership/free';
import PagePaid from './page/membership/paid';
import PageCurrent from './page/membership/current';
import PageSuccess from './page/membership/success';
import Constant from 'json/constant.json';

const PopupMembership = observer(class PopupMembership extends React.Component<I.Popup> {

	currentTier: any = null;

	constructor (props: I.Popup) {
		super(props);

		this.onChangeEmail = this.onChangeEmail.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { tier, success } = data;
		const tierContent = this.getTierContent(tier);
		const tiers = UtilCommon.mapToObject(Constant.membershipTiers, 'id');
		const cn = [ 'sides', `tier${tier}` ];

		let content: any = null;

		if (success) {
			cn.push('success');
			content = <PageSuccess {...this.props} tier={tiers[tier]} />;
		} else
		if (this.currentTier && (this.currentTier.tier == tier)) {
			content = <PageCurrent current={this.currentTier} onChangeEmail={this.onChangeEmail} />;
		} else
		if (tier == 1) {
			content = <PageFree tier={tiers[tier]} />;
		} else {
			content = <PagePaid tier={tiers[tier]} />;
		};

		return (
			<div className={cn.join(' ')}>
				<div className="side left">
					<Icon />
					<Title text={translate(`popupSettingsMembershipTitle${tier}`)} />
					<Label text={translate(`popupSettingsMembershipDescription${tier}`)} />

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

	componentDidMount () {
		const { membership } = authStore;

		if (membership.tier) {
			this.currentTier = membership;
			this.forceUpdate();
		};
	};

	getTierContent (tier) {
		const content = {
			1: [
				'popupMembershipTier1Content1',
				'popupMembershipTier1Content2',
				'popupMembershipTier1Content3',
			],
			2: [
				'popupMembershipTier2Content1',
				'popupMembershipTier2Content2',
				'popupMembershipTier2Content3',
				'popupMembershipTier2Content4',
			],
			3: [
				'popupMembershipTier3Content1',
				'popupMembershipTier3Content2',
				'popupMembershipTier3Content3',
				'popupMembershipTier3Content4',
				'popupMembershipTier3Content5',
			]
		};

		return content[tier];
	};

	onChangeEmail () {
		this.currentTier = null;
		this.forceUpdate();
	};
});

export default PopupMembership;
