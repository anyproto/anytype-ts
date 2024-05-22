import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { I, UtilCommon, analytics, Storage, Preview, translate } from 'Lib';
import { Dimmer } from 'Component';
import { menuStore, popupStore, commonStore } from 'Store';
const Constant = require('json/constant.json');

import PopupSettings from './settings';
import PopupSettingsOnboarding from './settings/onboarding';
import PopupSearch from './search';
import PopupHelp from './help';
import PopupPrompt from './prompt';
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
import PopupMembershipFinalization from './membership/finalization';

class Popup extends React.Component<I.Popup> {

	_isMounted = false;
	node = null;
	isAnimating = false;

	constructor (props: I.Popup) {
		super(props);

		this.position = this.position.bind(this);
		this.close = this.close.bind(this);
		this.storageGet = this.storageGet.bind(this);
		this.storageSet = this.storageSet.bind(this);
		this.getId = this.getId.bind(this);
		this.onDimmer = this.onDimmer.bind(this);
	};

	render () {
		const { id, param } = this.props;
		const { className } = param;

		const Components: any = {
			settings:				 PopupSettings,
			settingsOnboarding:		 PopupSettingsOnboarding,
			search:					 PopupSearch,
			confirm:				 PopupConfirm,
			prompt:					 PopupPrompt,
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
			membershipFinalization:  PopupMembershipFinalization,
		};
		
		const popupId = this.getId();
		const Component = Components[id];
		const cn = [ 'popup', popupId ];

		if (className) {
			cn.push(className);
		};

		if (popupStore.showDimmerIds().includes(id)) {
			cn.push('showDimmer');
		};
		
		if (!Component) {
			return <div>{UtilCommon.sprintf(translate('popupIndexComponentNotFound'), id)}</div>;
		};

		return (
			<div 
				ref={node => this.node = node}
				id={popupId} 
				className={cn.join(' ')}
			>
				<div id={`${popupId}-innerWrap`} className="innerWrap">
					<div className="content">
						<Component 
							{...this.props} 
							position={this.position} 
							close={this.close}
							storageGet={this.storageGet}
							storageSet={this.storageSet}
							getId={this.getId} 
						/>
					</div>
				</div>
				<Dimmer onClick={this.onDimmer} />
			</div>
		);
	};
	
	componentDidMount () {
		const { id, param } = this.props;

		this._isMounted = true;

		if (!param.preventResize) {
			this.position();
		};

		this.rebind();
		this.animate();

		analytics.event('popup', { params: { id } });
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	rebind () {
		const { id, param } = this.props;

		this.unbind();

		if (!param.preventResize) {
			$(window).on(`resize.popup${id}`, () => this.position());
		};
	};

	unbind () {
		const { id } = this.props;

		$(window).off(`resize.popup${id}`);
	};
	
	animate () {
		if (this.isAnimating) {
			return;
		};

		this.isAnimating = true;
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(this.node); 
			const wrap = node.find('.innerWrap');

			node.addClass('show');
			window.setTimeout(() => { 
				wrap.css({ transform: 'none' }); 
				this.isAnimating = false;
			}, popupStore.getTimeout());
		});
	};
	
	position () {
		const { id } = this.props;

		raf(() => {
			if (!this._isMounted) {
				return;
			};
					
			const node = $(this.node);
			const inner = node.find('.innerWrap');
			const { ww } = UtilCommon.getWindowDimensions();

			const sidebar = $('#sidebar');
			const isRight = sidebar.hasClass('right');
			const width = inner.outerWidth();
			const height = inner.outerHeight();

			let sw = 0;
			if (commonStore.isSidebarFixed && sidebar.hasClass('active') && !popupStore.showDimmerIds().includes(id)) {
				sw = sidebar.outerWidth();
			};

			let x = (ww - sw) / 2 - width / 2;
			if (!isRight) {
				x += sw;
			};
			if (width >= ww - sw) {
				x -= sw / 2;
			};

			inner.css({ left: x, marginTop: -height / 2, });
		});
	};

	close (callBack?: () => void) {
		const { id, param } = this.props;
		const { preventMenuClose } = param;

		Preview.previewHide(true);
		Preview.tooltipHide(true);

		if (!preventMenuClose) {
			menuStore.closeAll();
		};

		popupStore.close(id, callBack);
	};

	onDimmer () {
		if (!this.props.param.preventClose) {
			this.close();
		};
	};

	storageGet () {
		return Storage.get(this.getId()) || {};
	};

	storageSet (data: any) {
		Storage.set(this.getId(), data);
	};

	getId (): string {
		return UtilCommon.toCamelCase('popup-' + this.props.id);
	};

};

export default Popup;
