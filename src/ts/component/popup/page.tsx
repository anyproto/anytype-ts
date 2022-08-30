import * as React from 'react';
import { I, history as historyPopup, Util } from 'Lib';
import { RouteComponentProps } from 'react-router';
import { Page } from 'Component';
import { observer } from 'mobx-react';
import { menuStore } from 'Store';

interface Props extends I.Popup, RouteComponentProps<any> {};

const $ = require('jquery');
const raf = require('raf');

const PopupPage = observer(class PopupPage extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	ref: any = null;

	render () {
		const { param } = this.props;
		const { data } = param;
		const { matchPopup } = data;

		return (
			<div id="wrap">
				<Page 
					ref={(ref: any) => { this.ref = ref; }} 
					{...this.props} 
					rootId={matchPopup.params.id} 
					isPopup={true} 
					matchPopup={matchPopup} 
				/>
			</div>
		);
	};

	componentDidMount () {
		const { param, getId } = this.props;
		const { data } = param;
		const { matchPopup } = data;

		this._isMounted = true;
		this.rebind();
		this.resize();

		historyPopup.pushMatch(matchPopup);
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		historyPopup.clear();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const { getId } = this.props;
		const win = $(window);
		const obj = $(`#${getId()}`);

		win.on('resize.popupPage', () => { this.resize(); });

		obj.find('.innerWrap').on('scroll', () => {
			for (let menu of menuStore.list) {
				win.trigger('resize.' + Util.toCamelCase('menu-' + menu.id));
			};
		});
	};

	unbind () {
		const { getId } = this.props;
		const win = $(window);
		const obj = $(`#${getId()}`);

		win.off('resize.popupPage');
		obj.find('.innerWrap').off('scroll');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId, position } = this.props;

		raf(() => {
			const win = $(window);
			const obj = $(`#${getId()}-innerWrap`);
			const loader = obj.find('#loader');
			const ww = win.width();
			const width = Math.max(1096, Math.min(1096, ww - 128));

			width >= ww ? obj.addClass('full') : obj.removeClass('full');

			obj.css({ width: width });
			loader.css({ width: width, height: obj.height() });
			position();
		});
	};

});

export default PopupPage;