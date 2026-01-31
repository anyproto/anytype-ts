import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Label } from 'Component';
import { I, U, translate, Action, analytics } from 'Lib';

interface Props {
	route?: string;
};

const MemberCnt = observer(forwardRef<{}, Props>((props, ref) => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview || spaceview.isOneToOne) {
		return null;
	};

	const { route } = props;
	const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
	const text = spaceview.isShared ? 
		`${members.length} ${U.Common.plural(members.length, translate('pluralMember'))}` : 
		translate('commonPersonalSpace');

	const onClick = (e: any) => {
		Action.openSpaceShare(analytics.route.widget);
		analytics.event('ClickSpaceWidgetInvite', { route });
	};

	return <Label text={text} onClick={onClick} />;

}));

export default MemberCnt;