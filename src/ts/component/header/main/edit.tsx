import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, Sync } from 'ts/component';
import { I, Util, DataUtil, crumbs, history as historyPopup, keyboard } from 'ts/lib';
import { commonStore, blockStore, detailStore, menuStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	dataset?: any;
}

const $ = require('jquery');
const Constant = require('json/constant.json');

const HeaderMainEdit = observer(class HeaderMainEdit extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onNavigation = this.onNavigation.bind(this);
		this.onSync = this.onSync.bind(this);
		this.onOpen = this.onOpen.bind(this);

		this.onPathOver = this.onPathOver.bind(this);
		this.onPathOut = this.onPathOut.bind(this);
	};

	render () {
		const { match, isPopup, rootId } = this.props;
		const { breadcrumbs } = blockStore;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const object = detailStore.get(breadcrumbs, rootId, [ 'templateIsBundled' ]);
		const canSync = !object.templateIsBundled && !root.isObjectFileKind();
		const cn = [ 'header', 'headerMainEdit' ];

		if (popupStore.isOpenList([ 'search' ]) || menuStore.isOpen('blockRelationView')) {
			cn.push('active');
		};

		return (
			<div id="header" className={cn.join(' ')}>
				{isPopup ? (
					<div className="side left">
						<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
						<Icon className={[ 'back', 'big', (!historyPopup.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={this.onBack} />
						<Icon className={[ 'forward', 'big', (!historyPopup.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={this.onForward} />
						<Icon className="nav big" tooltip="Navigation" onClick={(e: any) => { this.onNavigation(e); }} />
					</div>
				) : (
					<div className="side left">
						<Icon className="home big" tooltip="Home" onClick={this.onHome} />
						<Icon className="back big" tooltip="Back" onClick={this.onBack} />
						<Icon className="forward big" tooltip="Forward" onClick={this.onForward} />
						<Icon className="nav big" tooltip="Navigation" onClick={(e: any) => { this.onNavigation(e); }} />
					</div>
				)}

				<div className="side center">
					<div className="path" onMouseDown={(e: any) => { this.onSearch(e); }} onMouseOver={this.onPathOver} onMouseOut={this.onPathOut}>
						<div className="item">
							<div className="flex">
								<IconObject object={object} size={18} />
								<div className="name">{object.name}</div>
							</div>
						</div>
					</div>
				</div>

				<div className="side right">
					{canSync ? <Sync id="button-header-sync" rootId={rootId} onClick={this.onSync} /> : ''}
					<Icon id="button-header-more" tooltip="Menu" className="more big" onClick={this.onMore} />
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.init();
	};

	componentDidUpdate () {
		this.init();
	};

	init () {
		const node = $(ReactDOM.findDOMNode(this));
		node.addClass('show');

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { node.removeClass('show'); }, Constant.delay.header);
	};

	onHome (e: any) {
		this.props.history.push('/main/index');
	};
	
	onBack (e: any) {
		keyboard.back();
	};
	
	onForward (e: any) {
		keyboard.forward();
	};

	onOpen () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, []);

		DataUtil.objectOpen(object);
	};
	
	onMore (e: any) {
		if (menuStore.isOpen()) {
			menuStore.closeAll();
			return;
		};

		const { isPopup, match, rootId } = this.props;
		const st = $(window).scrollTop();
		const elementId = `${this.getContainer()} #button-header-more`;
		const param: any = {
			element: elementId,
			horizontal: I.MenuDirection.Right,
			subIds: Constant.menuIds.more,
			data: {
				rootId: rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				match: match,
			}
		};

		if (!isPopup) {
			const element = $(elementId);

			param.fixedY = element.offset().top + element.height() + 4 - st;
			param.className = 'fixed';
			param.classNameWrap = 'fromHeader';
		} else {
			param.offsetY = 4;
		};

		menuStore.closeAll(null, () => { menuStore.open('blockMore', param); });
	};

	onSync (e: any) {
		if (menuStore.isOpen()) {
			menuStore.closeAll();
			return;
		};

		const { isPopup, rootId } = this.props;
		const st = $(window).scrollTop();
		const elementId = `${this.getContainer()} #button-header-sync`;
		const param: any = {
			element: elementId,
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: rootId,
			}
		};

		if (!isPopup) {
			const element = $(elementId);
			param.fixedY = element.offset().top + element.height() + 4 - st;
			param.className = 'fixed';
			param.classNameWrap = 'fromHeader';
		} else {
			param.offsetY = 4;
		};

		menuStore.closeAll(null, () => { menuStore.open('threadList', param); });
	};

	onNavigation (e: any) {
		DataUtil.objectOpenPopup({ id: this.props.rootId, layout: I.ObjectLayout.Navigation });
	};

	onSearch (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { isPopup, rootId } = this.props;

		popupStore.open('search', {
			preventResize: true, 
			data: {
				rootId: rootId,
				type: I.NavigationType.Go, 
			},
		});
	};

	onPathOver () {
		const { isPopup } = this.props;
		if (isPopup) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const path = node.find('.path');

		Util.tooltipShow('Click to search', path, I.MenuDirection.Center, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Util.tooltipHide(false);
	};

	getContainer () {
		const { isPopup } = this.props;
		return (isPopup ? '.popup' : '') + ' .header';
	};
	
});

export default HeaderMainEdit;