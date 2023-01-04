import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard } from 'Lib';
import { menuStore } from 'Store';
import Constant from 'json/constant.json';

const HeaderMainGraph = observer(class HeaderMainGraph extends React.Component<I.HeaderComponent> {

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onSearch = this.onSearch.bind(this);
		this.onFilter = this.onFilter.bind(this);
		this.onSettings = this.onSettings.bind(this);
	};

	render () {
		const { onHome, onForward, onBack, onGraph, onNavigation } = this.props;

		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={onGraph} />
					<Icon className="home big" tooltip="Home" onClick={onHome} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
					<Icon className="nav big" tooltip="Navigation" onClick={onNavigation} />
				</div>

				<div className="side center" />

				<div className="side right">
					<Icon id="button-header-search" className="search big" tooltip="Open as object" onClick={this.onSearch} />
					<Icon id="button-header-filter" className="filter big" tooltip="Open as object" onClick={this.onFilter} />
					<Icon id="button-header-setttins" className="settings big" tooltip="Open as object" onClick={this.onSettings} />
				</div>
			</React.Fragment>
		);
	};

	onSearch () {
	};

	onFilter () {
	};

	onSettings () {
		const { isPopup } = this.props;

		const st = $(window).scrollTop();
		const elementId = `${this.getContainer()} #button-header-setttins`;
		const param: any = {
			element: elementId,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
		};

		if (!isPopup) {
			const element = $(elementId);
			param.fixedY = element.offset().top + element.height() - st;
			param.classNameWrap = 'fixed fromHeader';
		};

		menuStore.closeAll(Constant.menuIds.graph, () => { menuStore.open('graphSettings', param); });
	};

	getContainer () {
		return (this.props.isPopup ? '.popup' : '') + ' .header';
	};

});

export default HeaderMainGraph;