import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { I, history as historyPopup, UtilCommon, keyboard } from 'Lib';
import { Page } from 'Component';
import { menuStore } from 'Store';

interface Props extends I.Popup, RouteComponentProps<any> {};

const PopupPage = observer(class PopupPage extends React.Component<Props> {

	_isMounted = false;
	ref = null;

	render () {
		const { param } = this.props;
		const { data } = param;
		const { matchPopup } = data;

		return (
			<div id="wrap">
				<Page 
					ref={ref => this.ref = ref} 
					{...this.props} 
					rootId={matchPopup.params.id} 
					isPopup={true} 
					matchPopup={matchPopup} 
				/>
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
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
		keyboard.setWindowTitle();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const { getId } = this.props;
		const win = $(window);
		const obj = $(`#${getId()}`);

		win.on('resize.popupPage', () => this.resize());

		obj.find('.innerWrap').on('scroll.common', () => {
			menuStore.list.forEach(it => {
				win.trigger('resize.' + UtilCommon.toCamelCase(`menu-${it.id}`));
			});
		});
	};

	unbind () {
		const { getId } = this.props;
		const win = $(window);
		const obj = $(`#${getId()}`);

		win.off('resize.popupPage');
		obj.find('.innerWrap').off('scroll.common');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId, position } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const loader = obj.find('#loader');
		const hh = UtilCommon.sizeHeader();

		loader.css({ width: obj.width(), height: obj.height() });
		position();

		raf(() => { obj.css({ top: hh + 20, marginTop: 0 }); });
	};

});

export default PopupPage;