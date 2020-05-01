import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';

const $ = require('jquery');
const raf = require('raf');

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

class Popup extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
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
				<div className="content">
					<Component {...this.props} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.unbind();
		this.animate();
		
		$(window).on('resize.popup', () => { this.resize(); });
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
	
	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
					
			const node = $(ReactDOM.findDOMNode(this));
			node.css({ 
				marginTop: -node.outerHeight() / 2,
				marginLeft: -node.outerWidth() / 2
			});			
		});
	};
	
};

export default Popup;