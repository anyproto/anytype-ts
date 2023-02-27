import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Button, Icon, Header } from 'Component';
import { I, Util } from 'Lib';
import { popupStore } from 'Store';
import Constant from 'json/constant.json';

const PageMainEmpty = observer(class PageMainEmpty extends React.Component<I.PageComponent> {

	_isMounted = false;
	node = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		return (
			<div 
				ref={node => this.node = node}
				className="wrapper"
			>
				<Header component="mainEmpty" text="Search" layout={I.ObjectLayout.Space} {...this.props} />

				<div className="mid">
					<Icon className="ghost" />
					<Title text="Your space does not have home page yet" />
							
					<div className="buttons">
						<Button text="Select home page" color="blank" onClick={this.onClick} />
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onClick () {
		popupStore.open('settings', { data: { page: 'spaceIndex' } });
	};

	resize () {
		const win = $(window);
		const obj = Util.getPageContainer(this.props.isPopup);
		const node = $(this.node);
		const wrapper = obj.find('.wrapper');
		const platform = Util.getPlatform();
		const isPopup = this.props.isPopup && !obj.hasClass('full');
		const oh = obj.height();
		const header = node.find('#header');
		const hh = header.height();
		
		let wh = isPopup ? oh - hh : win.height();

		if (platform == I.Platform.Windows) {
			wh -= Constant.size.headerWindows;
		};

		wrapper.css({ height: wh, paddingTop: isPopup ? 0 : hh });
		
		if (isPopup) {
			const element = $('#popupPage .content');
			if (element.length) {
				element.css({ minHeight: 'unset', height: '100%' });
			};
		};
	};

});

export default PageMainEmpty;