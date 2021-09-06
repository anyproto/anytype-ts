import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util, Storage } from 'ts/lib';
import { Dimmer } from 'ts/component';
import { menuStore, popupStore } from 'ts/store';
import { RouteComponentProps } from 'react-router';

import PopupSettings from './settings';
import PopupNavigation from './navigation';
import PopupSearch from './search';
import PopupHelp from './help';
import PopupPrompt from './prompt';
import PopupPreview from './preview';
import PopupConfirm from './confirm';
import PopupShortcut from './shortcut';
import PopupPage from './page';
import PopupTemplate from './template';
import PopupGraph from './graph';

interface Props extends I.Popup, RouteComponentProps<any> {};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');

class Popup extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	isAnimating: boolean = false;

	constructor (props: any) {
		super(props);

		this.position = this.position.bind(this);
		this.close = this.close.bind(this);
		this.getId = this.getId.bind(this);
	};

	render () {
		const { id } = this.props;

		const Components: any = {
			settings: PopupSettings,
			navigation: PopupNavigation,
			search: PopupSearch,
			confirm: PopupConfirm,
			prompt: PopupPrompt,
			help: PopupHelp,
			preview: PopupPreview,
			shortcut: PopupShortcut,
			page: PopupPage,
			template: PopupTemplate,
			graph: PopupGraph,
		};
		
		const popupId = this.getId();
		const Component = Components[id];
		const cn = [ 'popup', popupId ];
		
		if (!Component) {
			return <div>Component {id} not found</div>
		};

		return (
			<div id={popupId} className={cn.join(' ')}>
				<div id="innerWrap" className="innerWrap">
					<div className="content">
						<Component 
							{...this.props} 
							position={this.position} 
							close={this.close}
							getId={this.getId} 
						/>
					</div>
				</div>
				<Dimmer onClick={this.close} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.position();
		this.unbind();
		this.animate();
		
		$(window).on('resize.popup', () => { this.position(); });
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('resize.popup');
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
			
			const node = $(ReactDOM.findDOMNode(this)); 
			const wrap = node.find('#innerWrap');

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
					
			const node = $(ReactDOM.findDOMNode(this));
			const inner = node.find('#innerWrap');

			inner.css({ 
				marginTop: -inner.outerHeight() / 2,
				marginLeft: -inner.outerWidth() / 2
			});			
		});
	};

	close () {
		Util.linkPreviewHide(true);
		Util.tooltipHide(true);

		menuStore.closeAll();
		popupStore.close(this.props.id);
	};

	getId (): string {
		return Util.toCamelCase('popup-' + this.props.id);
	};

};

export default Popup;