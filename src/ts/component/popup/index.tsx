import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { I, Util, analytics, Storage, Preview } from 'Lib';
import { Dimmer } from 'Component';
import { menuStore, popupStore } from 'Store';
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
		};
		
		const popupId = this.getId();
		const Component = Components[id];
		const cn = [ 'popup', popupId ];

		if (className) {
			cn.push(className);
		};
		
		if (!Component) {
			return <div>Component {id} not found</div>
		};

		return (
			<div 
				ref={node => this.node = node}
				id={popupId} 
				className={cn.join(' ')}
			>
				<div id={popupId + '-innerWrap'} className="innerWrap">
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
		const { id } = this.props;

		this._isMounted = true;
		this.position();
		this.unbind();
		this.animate();
		
		analytics.event('popup', { params: { id } });
		$(window).on('resize.popup', () => { this.position(); });
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	unbind () {
		$(window).off('resize.popup');
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
		const { param } = this.props;

		if (param.preventResize) {
			return;
		};
		
		raf(() => {
			if (!this._isMounted) {
				return;
			};
					
			const node = $(this.node);
			const inner = node.find('.innerWrap');

			inner.css({ 
				marginTop: -inner.outerHeight() / 2,
				marginLeft: -inner.outerWidth() / 2
			});			
		});
	};

	close () {
		const { param } = this.props;
		const { preventMenuClose } = param;

		Preview.previewHide(true);
		Preview.tooltipHide(true);

		if (!preventMenuClose) {
			menuStore.closeAll();
		};
		popupStore.close(this.props.id);
	};

	storageGet () {
		return Storage.get(this.getId()) || {};
	};

	storageSet (data: any) {
		Storage.set(this.getId(), data);
	};

	getId (): string {
		return Util.toCamelCase('popup-' + this.props.id);
	};

};

export default Popup;