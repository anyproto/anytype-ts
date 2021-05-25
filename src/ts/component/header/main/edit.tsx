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
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class HeaderMainEdit extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onNavigation = this.onNavigation.bind(this);
		this.onRelation = this.onRelation.bind(this);
		this.onSync = this.onSync.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onRelation = this.onRelation.bind(this);

		this.onPathOver = this.onPathOver.bind(this);
		this.onPathOut = this.onPathOut.bind(this);
	};

	render () {
		const { match, isPopup, rootId } = this.props;
		const { config } = commonStore;
		const { breadcrumbs } = blockStore;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};
		
		const canAdd = !root.isObjectRelation() && !root.isObjectType() && !root.isObjectSet() && !root.isObjectFile() && !root.isObjectImage();
		const object = detailStore.get(breadcrumbs, rootId, []);
		const cn = [ 'header', 'headerMainEdit' ];

		if (popupStore.isOpenList([ 'search' ]) || menuStore.isOpen('blockRelationView')) {
			cn.push('active');
		};

		return (
			<div id="header" className={cn.join(' ')}>
				{isPopup ? (
					<div className="side left">
						<Icon className={[ 'back', 'big', (!historyPopup.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={this.onBack} />
						<Icon className={[ 'forward', 'big', (!historyPopup.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={this.onForward} />

						<div className="btn" onClick={this.onOpen}>
							<Icon className="expand" />
							<div className="txt">Open as object</div>
						</div>
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
							<IconObject object={object} />
							<div className="name">{Util.shorten(object.name, 32)}</div>
						</div>
					</div>
					<div className="icons">
						{config.allowDataview && canAdd ? (
							<Icon id="button-header-relation" tooltip="Relations" className="relation big" onClick={this.onRelation} />
						) : ''}
					</div>
				</div>

				<div className="side right">
					<Sync id="button-header-sync" rootId={rootId} onClick={this.onSync} />
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

			param.fixedY = element.offset().top + element.height() + 4;
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
			param.fixedY = element.offset().top + element.height() + 4;
			param.className = 'fixed';
			param.classNameWrap = 'fromHeader';
		} else {
			param.offsetY = 4;
		};

		menuStore.closeAll(null, () => { menuStore.open('threadList', param); });
	};

	onNavigation (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId } = this.props;

		popupStore.open('navigation', {
			data: {
				rootId: rootId,
				type: I.NavigationType.Go, 
			},
		});
	};

	onSearch (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { isPopup, rootId } = this.props;

		if (isPopup) {
			return;
		};

		popupStore.open('search', {
			preventResize: true, 
			data: {
				rootId: rootId,
				type: I.NavigationType.Go, 
			},
		});
	};

	onRelation () {
		if (menuStore.isOpen()) {
			menuStore.closeAll();
			return;
		};

		const { isPopup, rootId } = this.props;
		const elementId = `${this.getContainer()} #button-header-relation`;
		const param: any = {
			element: elementId,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			subIds: Constant.menuIds.cell,
			onClose: () => {
				menuStore.closeAll();
			},
			data: {
				relationKey: '',
				readOnly: false,
				rootId: rootId,
			},
		};

		if (!isPopup) {
			const element = $(elementId);
			param.fixedY = element.offset().top + element.height() + 4;
			param.className = 'fixed';
			param.classNameWrap = 'fromHeader';
		} else {
			param.offsetY = 4;
		};

		menuStore.closeAll(null, () => { menuStore.open('blockRelationView', param); });
	};

	onPathOver () {
		const { isPopup } = this.props;
		if (isPopup) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const path = node.find('.path');

		Util.tooltipShow('Click to search', path, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Util.tooltipHide(false);
	};

	getContainer () {
		const { isPopup } = this.props;
		return (isPopup ? '.popup' : '') + ' .header';
	};
	
};

export default HeaderMainEdit;