import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject } from 'ts/component';
import { I, Util, SmileUtil, DataUtil, crumbs, focus } from 'ts/lib';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

const $ = require('jquery');

@observer
class HeaderMainObjectType extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onNavigation = this.onNavigation.bind(this);
		this.onAdd = this.onAdd.bind(this);

		this.onPathOver = this.onPathOver.bind(this);
		this.onPathOut = this.onPathOut.bind(this);
	};

	render () {
		const { match } = this.props;
		const cn = [ 'header', 'headerMainEdit' ];
		const objectType = dbStore.getObjectType('', match.params.id);

		if (commonStore.popupIsOpen('navigation')) {
			cn.push('active');
		};

		return (
			<div id="header" className={cn.join(' ')}>
				<div className="side left">
					<Icon className="home big" tooltip="Home" onClick={this.onHome} />
					<Icon className="back big" tooltip="Back" onClick={this.onBack} />
					<Icon className="forward big" tooltip="Forward" onClick={this.onForward} />
					<Icon className="nav big" tooltip="Navigation" onClick={(e: any) => { this.onNavigation(e); }} />
				</div>

				<div className="side center">
					<div className="path" onMouseDown={(e: any) => { this.onSearch(e); }} onMouseOver={this.onPathOver} onMouseOut={this.onPathOut}>
						<div className="item">
							<IconObject object={{ ...objectType, layout: I.ObjectLayout.ObjectType }} />
							<div className="name">{objectType.name}</div>
						</div>
					</div>
				</div>

				<div className="side right">
					<Icon id="button-header-more" tooltip="Menu big" className="more" onClick={this.onMore} />
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
	
	onMore (e: any) {
		const { rootId, match } = this.props;
		
		commonStore.menuOpen('blockMore', { 
			element: '#button-header-more',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 8,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				match: match,
			}
		});
	};

	onAdd (e: any) {
		const { rootId } = this.props;
		const { focused } = focus;
		const root = blockStore.getLeaf(rootId, rootId);
		const fb = blockStore.getLeaf(rootId, focused);

		if (!root || root.isObjectSet()) {
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
		
		DataUtil.pageCreate(e, rootId, targetId, { iconEmoji: SmileUtil.random() }, position);
	};

	onNavigation (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { root } = blockStore;

		commonStore.popupOpen('navigation', {
			preventResize: true, 
			data: {
				rootId: root,
				type: I.NavigationType.Go, 
				expanded: true,
			},
		});
	};

	onSearch (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { root } = blockStore;

		commonStore.popupOpen('search', {
			preventResize: true, 
			data: {
				rootId: root,
				type: I.NavigationType.Go, 
			},
		});
	};

	onPathOver () {
		const node = $(ReactDOM.findDOMNode(this));
		const path = node.find('.path');

		Util.tooltipShow('Click to search', path, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Util.tooltipHide();
	};
	
};

export default HeaderMainObjectType;