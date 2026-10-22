import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { Title, Label, Button } from 'Component';
import { membership, getMembershipPage } from 'Lib/membership';

import Intro from './intro';
import Purchased from './purchased';
import State from './state';
import * as I from 'Interface';

const PageMainSettingsMembership = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { data, refreshing, refreshThrottled } = S.Membership;
	const statusView = S.Membership.getView(I.MembershipResource.Status);
	const productsView = S.Membership.getView(I.MembershipResource.Products);
	const childRef = useRef(null);

	const page = getMembershipPage(statusView, productsView, data);
	const isAnytypeNetwork = U.Data.isAnytypeNetwork();

	let content: any = null;
	let isUpdating = false;

	switch (page.kind) {
		case 'purchased': {
			isUpdating = S.Membership.isUpdating(I.MembershipResource.Status);
			content = <Purchased ref={childRef} {...props} isUpdating={isUpdating} />;
			break;
		};

		case 'intro': {
			isUpdating = S.Membership.isUpdating(I.MembershipResource.Status) || S.Membership.isUpdating(I.MembershipResource.Products);
			content = <Intro ref={childRef} {...props} />;
			break;
		};

		default: {
			content = <State view={page.view} />;
			break;
		};
	};

	// The hint promises an update: only while one can happen
	isUpdating = isUpdating && S.Common.isOnline;

	const onRefresh = () => {
		membership.refresh();
	};

	const resize = () => {
		childRef.current?.resize?.();
	};

	useEffect(() => {
		membership.onPageOpen();
		return () => membership.onPageClose();
	}, []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	const refreshCn = [ 'refresh' ];

	if (refreshing || refreshThrottled) {
		refreshCn.push('disabled');
	};

	return (
		<>
			<Title text={translate('popupSettingsMembershipTitle')} />

			{isAnytypeNetwork ? (
				<div className="membershipRefresh">
					{isUpdating ? <Label className="updating" text={translate('popupSettingsMembershipUpdating')} /> : ''}
					<Button
						className={refreshCn.join(' ')}
						color="blank"
						size={28}
						text={translate(refreshing ? 'popupSettingsMembershipRefreshing' : 'popupSettingsMembershipRefresh')}
						onClick={onRefresh}
					/>
				</div>
			) : ''}

			{content}
		</>
	);

});

export default PageMainSettingsMembership;
