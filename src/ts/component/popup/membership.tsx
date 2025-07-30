import React, { forwardRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Label } from 'Component';
import { I, S, U, translate, analytics } from 'Lib';

import PageFree from './page/membership/free';
import PagePaid from './page/membership/paid';
import PageCurrent from './page/membership/current';
import PageSuccess from './page/membership/success';

const PopupMembership = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param } = props;
	const [ isEditing, setIsEditing ] = useState(false);
	const { membership } = S.Auth;
	const { data } = param;
	const { tier, success } = data;
	const tierItem = U.Data.getMembershipTier(tier);
	const cn = [ 'sides', `tier${tier}`, tierItem.color ];

	let content: any = null;
	if (success) {
		cn.push('success');
		content = <PageSuccess {...props} />;
	} else
	if (!isEditing && (membership.tier == tier)) {
		content = <PageCurrent {...props} onChangeEmail={() => setIsEditing(true)} />;
	} else
	if (!tierItem.price) {
		content = <PageFree {...props} />;
	} else {
		content = <PagePaid {...props} />;
	};

	useEffect(() => {
		analytics.event('ScreenMembership', { params: { tier } });
	}, []);

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

}));

export default PopupMembership;