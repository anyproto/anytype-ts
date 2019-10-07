import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PopupProfile, PopupSettings } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');
const raf = require('raf');

interface Props extends I.PopupInterface {
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
			profile: PopupProfile,
			settings: PopupSettings,
		};
		const Component = Components[id];
		const cn = [ 
			'popup', 
			Util.toCamelCase('popup-' + id) 
		];
		
		if (!Component) {
			return <div>Component {id} not found</div>
		};
		
		return (
			<div className={cn.join(' ')}>
				<Component {...this.props} />
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