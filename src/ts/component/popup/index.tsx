import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { I, UtilCommon, analytics, Storage, Preview, translate } from 'Lib';
import { Dimmer } from 'Component';
import { menuStore, popupStore, commonStore } from 'Store';
import Constant from 'json/constant.json';

import PopupSettings from './settings';
import PopupSearch from './search';
import PopupHelp from './help';
import PopupPrompt from './prompt';
import PopupPreview from './preview';
import PopupConfirm from './confirm';
import PopupShortcut from './shortcut';
import PopupPage from './page';
import PopupTemplate from './template';
import PopupExport from './export';
import PopupMigration from './migration';
import PopupPin from './pin';

class Popup extends React.Component<I.Popup> {

	_isMounted = false;
	node: any = null;
	isAnimating = false;

	constructor (props: I.Popup) {
		super(props);

		this.position = this.position.bind(this);
		this.close = this.close.bind(this);
		this.storageGet = this.storageGet.bind(this);
		this.storageSet = this.storageSet.bind(this);
		this.getId = this.getId.bind(this);
	};

	render () {
		const { id, param } = this.props;
		const { className } = param;

		const Components: any = {
			settings:	 PopupSettings,
			search:		 PopupSearch,
			confirm:	 PopupConfirm,
			prompt:		 PopupPrompt,
			help:		 PopupHelp,
			preview:	 PopupPreview,
			shortcut:	 PopupShortcut,
			page:		 PopupPage,
			template:	 PopupTemplate,
			export:		 PopupExport,
			migration:	 PopupMigration,
			pin:		 PopupPin,
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
			return <div>{UtilCommon.sprintf(translate('popupIndexComponentNotFound'), id)}</div>
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
				<Dimmer onClick={this.close} />
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
			}, Constant.delay.popup);
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

	close () {
		const { id, param } = this.props;
		const { preventMenuClose } = param;

		Preview.previewHide(true);
		Preview.tooltipHide(true);

		if (!preventMenuClose) {
			menuStore.closeAll();
		};
		popupStore.close(id);
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
