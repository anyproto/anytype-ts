import * as React from 'react';
import { I, ObjectUtil, Util, keyboard, sidebar, Preview } from 'Lib';
import { menuStore } from 'Store';

import HeaderAuthIndex from './auth';
import HeaderMainIndex from './main/index';
import HeaderMainEdit from './main/edit';
import HeaderMainHistory from './main/history';
import HeaderMainGraph from './main/graph';
import HeaderMainNavigation from './main/navigation';
import HeaderMainStore from './main/store';

interface Props extends I.HeaderComponent {
	component: string;
};

const Components = {
	authIndex:			 HeaderAuthIndex,
	mainIndex:			 HeaderMainIndex,
	mainEdit:			 HeaderMainEdit,
	mainHistory:		 HeaderMainHistory,
	mainGraph:			 HeaderMainGraph,
	mainNavigation:		 HeaderMainNavigation,
	mainStore:			 HeaderMainStore,
};

class Header extends React.Component<Props, object> {

	refChild: any = null;

	constructor (props: any) {
		super(props);

		this.onHome = this.onHome.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onNavigation = this.onNavigation.bind(this);
		this.onGraph = this.onGraph.bind(this);
		this.onStore = this.onStore.bind(this);
		this.onPathOver = this.onPathOver.bind(this);
		this.onPathOut = this.onPathOut.bind(this);
		this.menuOpen = this.menuOpen.bind(this);
	};
	
	render () {
		const { component } = this.props;
		const Component = Components[component] || null;
		const cn = [ 'header', component ];

		if ([ 'mainEdit', 'mainNavigation', 'mainGraph', 'mainStore', 'mainHistory' ].includes(component)) {
			cn.push('isCommon');
		};

		return (
			<div id="header" className={cn.join(' ')}>
				<Component 
					ref={(ref: any) => this.refChild = ref} 
					{...this.props} 
					onHome={this.onHome}
					onBack={() => { keyboard.onBack(); }}
					onForward={() => { keyboard.onForward(); }}
					onSearch={this.onSearch}
					onNavigation={this.onNavigation}
					onGraph={this.onGraph}
					onStore={this.onStore}
					menuOpen={this.menuOpen}
				/>
			</div>
		);
	};

	componentDidMount () {
		sidebar.resizePage();
	};

	componentDidUpdate () {
		sidebar.resizePage();
		this.refChild.forceUpdate();
	};

	onHome () {
		Util.route('/main/index');
	};
	
	onSearch () {
		keyboard.onSearchPopup();
	};

	onNavigation () {
		ObjectUtil.openPopup({ id: this.props.rootId, layout: I.ObjectLayout.Navigation });
	};
	
	onGraph () {
		ObjectUtil.openPopup({ id: this.props.rootId, layout: I.ObjectLayout.Graph });
	};

	onStore () {
		ObjectUtil.openPopup({ id: this.props.rootId, layout: I.ObjectLayout.Store });
	};

	onPathOver (e: any) {
		Preview.tooltipShow('Click to search', $(e.currentTarget), I.MenuDirection.Center, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Preview.tooltipHide(false);
	};

	menuOpen (id: string, elementId: string, param: Partial<I.MenuParam>) {
		if (menuStore.isOpen()) {
			menuStore.closeAll();
			return;
		};

		const { isPopup } = this.props;
		const st = $(window).scrollTop();
		const element = $(`${this.getContainer()} ${elementId}`);
		const menuParam: any = Object.assign({
			element,
			offsetY: 4,
		}, param);

		if (!isPopup) {
			menuParam.fixedY = element.offset().top + element.height() - st;
			menuParam.classNameWrap = 'fixed fromHeader';
		};

		menuStore.closeAll(null, () => { menuStore.open(id, menuParam); });
	};

	getContainer () {
		return (this.props.isPopup ? '.popup' : '') + ' .header';
	};

};

export default Header;