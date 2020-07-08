import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { Dimmer } from 'ts/component';
import { commonStore } from 'ts/store';

import PopupSettings from './settings';
import PopupArchive from './archive';
import PopupNavigation from './navigation';
import PopupNew from './new';
import PopupPrompt from './prompt';
import PopupPreview from './preview';
import PopupEditorPage from './editor/page';
import PopupFeedback from './feedback';

interface Props extends I.Popup {
	history: any;
};

const $ = require('jquery');
const raf = require('raf');

class Popup extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.position = this.position.bind(this);
		this.close = this.close.bind(this);
	};

	render () {
		const { id } = this.props;
		
		const Components: any = {
			settings: PopupSettings,
			archive: PopupArchive,
			navigation: PopupNavigation,
			prompt: PopupPrompt,
			new: PopupNew,
			preview: PopupPreview,
			editorPage: PopupEditorPage,
			feedback: PopupFeedback,
		};
		
		const popupId = Util.toCamelCase('popup-' + id);
		const Component = Components[id];
		const cn = [ 'popup', popupId ];
		
		if (!Component) {
			return <div>Component {id} not found</div>
		};

		return (
			<div id={popupId} className={cn.join(' ')}>
				<div id="innerWrap" className="innerWrap">
					<div className="content">
						<Component {...this.props} position={this.position} close={this.close} />
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
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this)); 
			node.addClass('show');
			window.setTimeout(() => { node.css({ transform: 'none' }); }, 210);
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
		commonStore.popupClose(this.props.id);
	};

};

export default Popup;