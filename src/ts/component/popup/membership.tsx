import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Label } from 'Component';
import { I, S, U, translate, analytics } from 'Lib';

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
		const { membership } = S.Auth;
		const { isEditing } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { tier, success } = data;
		const tierItem = U.Data.getMembershipTier(tier);
		const cn = [ 'sides', `tier${tier}`, tierItem.color ];

		let content: any = null;
		if (success) {
			cn.push('success');
			content = <PageSuccess {...this.props} />;
		} else
		if (!isEditing && (membership.tier == tier)) {
			content = <PageCurrent {...this.props} onChangeEmail={this.onChangeEmail} />;
		} else
		if (tierItem.isExplorer) {
			content = <PageFree {...this.props} />;
		} else {
			content = <PagePaid {...this.props} />;
		};

		return (
			<div className={cn.join(' ')}>
				<div className="side left">
					<Icon className="tierIcon" />
					<Title text={tierItem.name} />
					<Label text={tierItem.description} />

					<div className="contentList">
						<Label text={translate('popupMembershipWhatsIncluded')} />
						<ul>
							{tierItem.features.map((text, idx) => (
								<li key={idx}>{text}</li>
							))}
						</ul>
					</div>
				</div>

				<div className="side right">{content}</div>
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;

		analytics.event('ScreenMembership', { params: { tier } });
	};

	onChangeEmail () {
		this.setState({ isEditing: true });
	};

});

export default PopupMembership;