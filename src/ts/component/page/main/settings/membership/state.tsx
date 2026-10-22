import React, { forwardRef } from 'react';
import { Label } from 'Component';
import * as I from 'Interface';
import Loader from './loader';

interface Props {
	view: I.MembershipView;
};

/**
 * What the membership page shows while nothing usable is known: a bounded loader, or why the
 * data is missing. Retrying is the Refresh button, shown in every state on the Anytype network
 * (hidden elsewhere, where there is nothing to fetch).
 */
const PageMainSettingsMembershipState = forwardRef<HTMLDivElement, Props>(({ view }, ref) => {

	let text = '';
	let hint = '';

	switch (view) {
		case I.MembershipView.Pending: {
			return <Loader />;
		};

		case I.MembershipView.Offline: {
			text = translate('popupSettingsMembershipOfflineText');
			hint = translate('popupSettingsMembershipOfflineHint');
			break;
		};

		case I.MembershipView.NotAnytypeNetwork: {
			text = translate('popupSettingsMembershipNotAnytypeNetworkText');
			break;
		};

		default: {
			text = translate('popupSettingsMembershipUnavailableText');
			hint = translate('popupSettingsMembershipUnavailableHint');
			break;
		};
	};

	return (
		<div ref={ref} className={[ 'loaderWrapper', 'isState', view ].join(' ')}>
			<div className="inner">
				<Label text={text} />
				{hint ? <Label className="hint" text={hint} /> : ''}
			</div>
		</div>
	);

});

export default PageMainSettingsMembershipState;
