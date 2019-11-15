import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');
const raf = require('raf');

import PopupSettings from './settings';
import PopupTree from './tree';
import PopupPrompt from './prompt';

interface Props extends I.Popup {
	history: any;
	commonStore?: any;
};

@inject('commonStore')
@observer
class Popup extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
	};

	render () {
		const { id } = this.props;
		
		const Components: any = {
			settings: PopupSettings,
			tree: PopupTree,
			prompt: PopupPrompt,
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
			setTimeout(() => { node.css({ transform: 'none' }); }, 200);
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