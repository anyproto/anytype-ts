import * as React from 'react';
import { I } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { Page } from 'ts/component';
import { commonStore } from 'ts/store';

interface Props extends I.Popup, RouteComponentProps<any> {};

const $ = require('jquery');
const raf = require('raf');

class PopupPage extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, matchPopup } = data;
		
		return (
			<div id="wrap">
				<Page {...this.props} rootId={rootId} isPopup={true} matchPopup={matchPopup} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.unbind('resize.popup.page').on('resize.popup.page', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.popup.page');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId } = this.props;

		raf(() => {
			const win = $(window);
			const obj = $(`#${getId()} #innerWrap`);
			const width = Math.max(732, Math.min(960, win.width() - 128));

			obj.css({ width: width, marginLeft: -width / 2, marginTop: 0 });
		});
	};

};

export default PopupPage;