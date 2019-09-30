import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, PopupProfile } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');
const raf = require('raf');

interface Props extends I.PopupInterface {
	commonStore?: any;
};

@inject('commonStore')
@observer
class Popup extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.close = this.close.bind(this);
	};

	render () {
		const { id } = this.props;
		const cn = [ 'popup', 'popup-' + id ];
		const Components: any = {
			profile: PopupProfile
		};
		const Component = Components[id];
		
		if (!Component) {
			return <div>Component {id} not found</div>
		};
		
		return (
			<div className={cn.join(' ')}>
				<Icon className="close" onMouseDown={this.close} />
				<Component {...this.props} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.unbind();
		
		$(window).on('resize.popup orientationchange.popup', () => { this.resize(); });
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('resize.popup orientationchange.popup');
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));		
		raf(() => {
			node.css({ 
				marginTop: -node.outerHeight() / 2,
				marginLeft: -node.outerWidth() / 2
			});			
		});
	};
	
	close () {
		const { id, commonStore } = this.props;
		commonStore.popupClose(id);
	};
	
};

export default Popup;