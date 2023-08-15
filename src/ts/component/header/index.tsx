import * as React from 'react';
import { I, UtilObject, Renderer, keyboard, sidebar, Preview } from 'Lib';
import { detailStore, menuStore } from 'Store';

import HeaderAuthIndex from './auth';
import HeaderMainObject from './main/object';
import HeaderMainHistory from './main/history';
import HeaderMainGraph from './main/graph';
import HeaderMainNavigation from './main/navigation';
import HeaderMainStore from './main/store';
import HeaderMainEmpty from './main/empty';

interface Props extends I.HeaderComponent {
	component: string;
	className?: string;
};

const Components = {
	authIndex:			 HeaderAuthIndex,
	mainObject:			 HeaderMainObject,
	mainHistory:		 HeaderMainHistory,
	mainGraph:			 HeaderMainGraph,
	mainNavigation:		 HeaderMainNavigation,
	mainStore:			 HeaderMainStore,
	mainEmpty:			 HeaderMainEmpty,
};

class Header extends React.Component<Props> {

	refChild: any = null;

	constructor (props: Props) {
		super(props);

		this.onSearch = this.onSearch.bind(this);
		this.onNavigation = this.onNavigation.bind(this);
		this.onGraph = this.onGraph.bind(this);
		this.onTooltipShow = this.onTooltipShow.bind(this);
		this.onTooltipHide = this.onTooltipHide.bind(this);
		this.menuOpen = this.menuOpen.bind(this);
		this.onDoubleClick = this.onDoubleClick.bind(this);
	};
	
	render () {
		const { component, className, rootId } = this.props;
		const Component = Components[component] || null;
		const cn = [ 'header', component, className ];

		if (![ 'authIndex', 'mainIndex' ].includes(component)) {
			cn.push('isCommon');
		};

		return (
			<div id="header" className={cn.join(' ')} onDoubleClick={this.onDoubleClick}>
				<Component 
					ref={ref => this.refChild = ref} 
					{...this.props} 
					onSearch={this.onSearch}
					onNavigation={this.onNavigation}
					onGraph={this.onGraph}
					onTooltipShow={this.onTooltipShow}
					onTooltipHide={this.onTooltipHide}
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

	onSearch () {
		keyboard.onSearchPopup();
	};

	onNavigation () {
		UtilObject.openPopup({ id: this.props.rootId, layout: I.ObjectLayout.Navigation });
	};
	
	onGraph () {
		UtilObject.openAuto({ id: this.props.rootId, layout: I.ObjectLayout.Graph });
	};

	onTooltipShow (e: any, text: string, caption?: string) {
		const t = Preview.tooltipCaption(text, caption);
		if (t) {
			Preview.tooltipShow({ text: t, element: $(e.currentTarget), typeY: I.MenuDirection.Bottom });
		};
	};

	onTooltipHide () {
		Preview.tooltipHide(false);
	};

	onDoubleClick () {
		Renderer.send('winCommand', 'maximize');
	};

	menuOpen (id: string, elementId: string, param: Partial<I.MenuParam>) {
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

		menuStore.closeAllForced(null, () => { menuStore.open(id, menuParam); });
	};

	getContainer () {
		return (this.props.isPopup ? '.popup' : '') + ' .header';
	};

};

export default Header;