import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, Sync } from 'ts/component';
import { I, Util, SmileUtil, DataUtil, crumbs, focus } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup: boolean;
	dataset?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class HeaderMainEdit extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onNavigation = this.onNavigation.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onRelation = this.onRelation.bind(this);
		this.onSync = this.onSync.bind(this);
		this.onOpen = this.onOpen.bind(this);

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
		
		const canAdd = !root.isObjectRelation() && !root.isObjectType();
		const object = blockStore.getDetails(breadcrumbs, rootId);
		const cn = [ 'header', 'headerMainEdit' ];

		if (commonStore.popupIsOpenList([ 'navigation', 'search' ]) || commonStore.menuIsOpen('blockRelationView')) {
			cn.push('active');
		};

		return (
			<div id="header" className={cn.join(' ')}>
				{isPopup ? (
					<div className="side left">
						<div className="item" onClick={this.onOpen}>
							<Icon className="expand" />
							Open as page
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

					{!isPopup && canAdd ? (
						<Icon id="button-header-add" className={[ 'plus', 'big', (root.isObjectReadOnly() ? 'dis' : '') ].join(' ')} arrow={false} tooltip="Create new page" onClick={this.onAdd} />
					) : ''}
					{config.allowDataview ? (
						<Icon id="button-header-relation" tooltip="Relations" menuId="blockRelationList" className="relation big" onClick={this.onRelation} />
					) : ''}
				</div>

				<div className="side right">
					<Sync id="button-header-sync" rootId={rootId} onClick={this.onSync} />
					<Icon id="button-header-more" tooltip="Menu" className="more big" onClick={this.onMore} />
				</div>
			</div>
		);
	};

	onHome (e: any) {
		this.props.history.push('/main/index');
	};
	
	onBack (e: any) {
		crumbs.restore(I.CrumbsType.Page);
		this.props.history.goBack();
	};
	
	onForward (e: any) {
		crumbs.restore(I.CrumbsType.Page);
		this.props.history.goForward();
	};

	onOpen () {
		const { rootId } = this.props;
		const object = blockStore.getDetails(rootId, rootId);

		DataUtil.objectOpen(object);
	};
	
	onMore (e: any) {
		const { isPopup, match, rootId } = this.props;

		const param: any = {
			element: `${this.getContainer()} #button-header-more`,
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 0,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				match: match,
			}
		};

		if (!isPopup) {
			param.fixedY = 40;
			param.className = 'fixed';
		};

		commonStore.menuCloseAll();
		window.setTimeout(() => { commonStore.menuOpen('blockMore', param); }, Constant.delay.menu);
	};

	onAdd (e: any) {
		const { rootId } = this.props;
		const { focused } = focus;
		const root = blockStore.getLeaf(rootId, rootId);
		const fb = blockStore.getLeaf(rootId, focused);

		if (!root || root.isObjectReadOnly()) {
			return;
		};
		
		let targetId = '';
		let position = I.BlockPosition.Bottom;
		
		if (fb) {
			if (fb.isTextTitle()) {
				const first = blockStore.getFirstBlock(rootId, 1, (it: I.Block) => { return it.isFocusable() && !it.isTextTitle(); });
				if (first) {
					targetId = first.id;
					position = I.BlockPosition.Top;
				};
			} else 
			if (fb.isFocusable()) {
				targetId = fb.id;
			};
		};
		
		DataUtil.pageCreate(e, rootId, targetId, { iconEmoji: SmileUtil.random() }, position, (message: any) => {
			DataUtil.objectOpen({ id: message.targetId });
		});
	};

	onSync (e: any) {
		const { isPopup, match, rootId } = this.props;

		const param: any = {
			type: I.MenuType.Vertical, 
			element: `${this.getContainer()} #button-header-sync`,
			offsetX: 0,
			offsetY: 0,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: rootId,
			}
		};

		if (!isPopup) {
			param.fixedY = 40;
			param.className = 'fixed';
		};

		commonStore.menuCloseAll();
		window.setTimeout(() => { commonStore.menuOpen('threadList', param); }, Constant.delay.menu);
	};

	onNavigation (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { match, rootId } = this.props;

		commonStore.popupOpen('navigation', {
			preventResize: true, 
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

		commonStore.popupOpen('search', {
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

		Util.tooltipShow('Click to search', path, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Util.tooltipHide();
	};

	onRelation () {
		const { isPopup, rootId } = this.props;

		const param: any = {
			element: `${this.getContainer()} #button-header-relation`,
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 0,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			onClose: () => {
				commonStore.menuCloseAll();
			},
			data: {
				relationKey: '',
				readOnly: false,
				rootId: rootId,
			},
		};

		if (!isPopup) {
			param.fixedY = 40;
			param.className = 'fixed';
		};

		commonStore.menuCloseAll();
		window.setTimeout(() => { commonStore.menuOpen('blockRelationView', param); }, Constant.delay.menu);
	};

	getContainer () {
		const { isPopup } = this.props;
		return (isPopup ? '.popup' : '') + ' .header';
	};
	
};

export default HeaderMainEdit;