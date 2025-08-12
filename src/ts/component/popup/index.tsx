import React, { forwardRef, useEffect, useRef } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { I, S, U, analytics, Storage, Preview, translate, sidebar } from 'Lib';
import { Dimmer } from 'Component';
import { observer } from 'mobx-react';

import PopupSettingsOnboarding from './settings/onboarding';
import PopupSearch from './search';
import PopupHelp from './help';
import PopupPreview from './preview';
import PopupConfirm from './confirm';
import PopupShortcut from './shortcut';
import PopupPage from './page';
import PopupExport from './export';
import PopupMigration from './migration';
import PopupPin from './pin';
import PopupPhrase from './phrase';
import PopupObjectManager from './objectManager';
import PopupUsecase from './usecase';
import PopupAbout from './about';
import PopupRelation from './relation';
import PopupInviteRequest from './invite/request';
import PopupInviteConfirm from './invite/confirm';
import PopupInviteQr from './invite/qr';
import PopupMembership from './membership';
import PopupMembershipActivation from './membership/activation';
import PopupMembershipFinalization from './membership/finalization';
import PopupShare from './share';
import PopupSpaceCreate from './space/create';
import PopupSpaceJoinByLink from './space/joinByLink';
import PopupLogout from './logout';
import PopupOnboarding from './onboarding';
import PopupApiCreate from './api/create';

const Popup = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { id, param } = props;
	const nodeRef = useRef(null);
	const componentRef = useRef(null);
	const isAnimatingRef = useRef(false);

	const getId = (): string => {
		return U.Common.toCamelCase('popup-' + id);
	};

	const storageGet = () => {
		return Storage.get(getId()) || {};
	};

	const storageSet = (data: any) => {
		const current = storageGet();
		Storage.set(getId(), Object.assign(current, data));
	};

	const close = (callBack?: () => void) => {
		const { preventMenuClose } = param;

		Preview.previewHide(true);
		Preview.tooltipHide(true);

		if (!preventMenuClose) {
			S.Menu.closeAll();
		};

		S.Popup.close(id, callBack);
	};

	const onDimmer = () => {
		if (!param.preventCloseByClick) {
			close();
		};
	};

	const rebind = () => {
		unbind();

		if (!param.preventResize) {
			$(window).on(`resize.popup${id}`, () => position());
		};
	};

	const unbind = () => {
		$(window).off(`resize.popup${id}`);
	};

	const animate = () => {
		window.setTimeout(() => {
			if (isAnimatingRef.current) {
				return;
			};
			
			isAnimatingRef.current = true;

			$(nodeRef.current).addClass('show');
			window.setTimeout(() => { isAnimatingRef.current = false; }, S.Popup.getTimeout());
		}, 50);
	};

	const position = () => {
		if (componentRef.current && componentRef.current.beforePosition) {
			componentRef.current.beforePosition();
		};

		raf(() => {
			const node = $(nodeRef.current);
			const inner = node.find('.innerWrap');
			const { ww } = U.Common.getWindowDimensions();

			const width = inner.outerWidth();
			const height = inner.outerHeight();

			let sw = 0;
			if (S.Popup.noDimmerIds().includes(id)) {
				sw = sidebar.getDummyWidth();
			};

			let x = (ww - sw) / 2 - width / 2 + sw;
			if (width >= ww - sw) {
				x -= sw / 2;
			};

			inner.css({ left: x, marginTop: -height / 2, });
		});
	};

	useEffect(() => {
		if (!param.preventResize) {
			position();
		};

		rebind();
		animate();

		analytics.event('popup', { params: { id } });

		return () => {
			unbind();
		};
	}, []);

	const { className } = param;

	const Components: any = {
		settingsOnboarding:		 PopupSettingsOnboarding,
		search:					 PopupSearch,
		confirm:				 PopupConfirm,
		help:					 PopupHelp,
		preview:				 PopupPreview,
		shortcut:				 PopupShortcut,
		page:					 PopupPage,
		export:					 PopupExport,
		migration:				 PopupMigration,
		pin:					 PopupPin,
		phrase:					 PopupPhrase,
		objectManager:			 PopupObjectManager,
		usecase:				 PopupUsecase,
		about:					 PopupAbout,
		relation:				 PopupRelation,
		inviteRequest:			 PopupInviteRequest,
		inviteConfirm:			 PopupInviteConfirm,
		inviteQr:				 PopupInviteQr,
		membership: 		 	 PopupMembership,
		membershipActivation: 	 PopupMembershipActivation,
		membershipFinalization:  PopupMembershipFinalization,
		share:					 PopupShare,
		spaceCreate:			 PopupSpaceCreate,
		spaceJoinByLink:		 PopupSpaceJoinByLink,
		logout: 				 PopupLogout,
		onboarding:				 PopupOnboarding,
		apiCreate:				 PopupApiCreate,
	};
	
	const popupId = getId();
	const Component = Components[id];
	const cn = [ 'popup', popupId ];

	if (className) {
		cn.push(className);
	};

	if (!S.Popup.noDimmerIds().includes(id)) {
		cn.push('showDimmer');
	};
	
	if (!Component) {
		return <div>{U.Common.sprintf(translate('popupIndexComponentNotFound'), id)}</div>;
	};

	return (
		<div 
			ref={nodeRef}
			id={popupId} 
			className={cn.join(' ')}
		>
			<div id={`${popupId}-innerWrap`} className="innerWrap">
				<div className="content">
					<Component 
						{...props}
						ref={componentRef}
						position={position} 
						close={close}
						storageGet={storageGet}
						storageSet={storageSet}
						getId={getId} 
					/>
				</div>
			</div>
			<Dimmer onClick={onDimmer} />
		</div>
	);
	
}));

export default Popup;