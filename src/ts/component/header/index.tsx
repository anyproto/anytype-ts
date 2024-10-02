import * as React from 'react';
import { I, S, U, J, Renderer, keyboard, sidebar, Preview, translate } from 'Lib';
import { Icon } from 'Component';

import HeaderAuthIndex from './auth';
import HeaderMainObject from './main/object';
import HeaderMainHistory from './main/history';
import HeaderMainGraph from './main/graph';
import HeaderMainNavigation from './main/navigation';
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
	mainEmpty:			 HeaderMainEmpty,
};

class Header extends React.Component<Props> {

	refChild: any = null;

	constructor (props: Props) {
		super(props);

		this.menuOpen = this.menuOpen.bind(this);
		this.renderLeftIcons = this.renderLeftIcons.bind(this);
		this.renderTabs = this.renderTabs.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onTooltipShow = this.onTooltipShow.bind(this);
		this.onTooltipHide = this.onTooltipHide.bind(this);
		this.onDoubleClick = this.onDoubleClick.bind(this);
		this.onExpand = this.onExpand.bind(this);
		this.onRelation = this.onRelation.bind(this);
	};
	
	render () {
		const { component, className, withBanner } = this.props;
		const Component = Components[component] || null;
		const cn = [ 'header', component, className ];

		if (![ 'authIndex' ].includes(component)) {
			cn.push('isCommon');
		};

		if (withBanner) {
			cn.push('withBanner');
		};

		return (
			<div id="header" className={cn.join(' ')} onDoubleClick={this.onDoubleClick}>
				<Component 
					ref={ref => this.refChild = ref} 
					{...this.props} 
					onSearch={this.onSearch}
					onTooltipShow={this.onTooltipShow}
					onTooltipHide={this.onTooltipHide}
					menuOpen={this.menuOpen}
					renderLeftIcons={this.renderLeftIcons}
					renderTabs={this.renderTabs}
					onRelation={this.onRelation}
				/>
			</div>
		);
	};

	componentDidMount () {
		sidebar.resizePage(null, false);
	};

	componentDidUpdate () {
		sidebar.resizePage(null, false);
		this.refChild.forceUpdate();
	};

	renderLeftIcons (onOpen?: () => void) {
		return (
			<React.Fragment>
				<Icon 
					className="expand withBackground" 
					tooltip={translate('commonOpenObject')} 
					onClick={onOpen || this.onExpand} 
				/>
			</React.Fragment>
		);
	};

	renderTabs () {
		const { tab, tabs, onTab } = this.props;

		return (
			<div id="tabs" className="tabs">
				{tabs.map((item: any, i: number) => (
					<div 
						key={i}
						className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} 
						onClick={() => onTab(item.id)}
						onMouseOver={e => this.onTooltipShow(e, item.tooltip, item.tooltipCaption)} 
						onMouseOut={this.onTooltipHide}
					>
						{item.name}
					</div>
				))}
			</div>
		);
	};

	onExpand () {
		const { rootId, layout } = this.props;

		S.Popup.closeAll(null, () => U.Object.openRoute({ id: rootId, layout }));
	};

	onSearch () {
		keyboard.onSearchPopup('Header');
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
			menuParam.fixedY = element.offset().top + element.height() - st + 4;
			menuParam.classNameWrap = 'fixed fromHeader';
		};

		S.Menu.closeAllForced(null, () => S.Menu.open(id, menuParam));
	};

	onRelation (param?: Partial<I.MenuParam>, data?: any) {
		param = param || {};
		data = data || {};

		const { isPopup, rootId } = this.props;
		const cnw = [ 'fixed' ];

		if (!isPopup) {
			cnw.push('fromHeader');
		};

		this.menuOpen('blockRelationView', '#button-header-relation', {
			noFlipX: true,
			noFlipY: true,
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.cell,
			classNameWrap: cnw.join(' '),
			...param,
			data: {
				isPopup,
				rootId,
				...data,
			},
		});
	};

	getContainer () {
		return (this.props.isPopup ? '.popup' : '') + ' .header';
	};

};

export default Header;