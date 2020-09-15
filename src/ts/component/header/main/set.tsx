import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile } from 'ts/component';
import { I, Util, SmileUtil, DataUtil, crumbs, focus } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

const $ = require('jquery');

@observer
class HeaderMainSet extends React.Component<Props, {}> {

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
		const cn = [ 'header', 'headerMainEdit' ];
		if (commonStore.popupIsOpen('navigation')) {
			cn.push('active');
		};

		return (
			<div id="header" className={cn.join(' ')}>
				<div className="side left">
					<Icon className="home" tooltip="Home" onClick={this.onHome} />
					<Icon className="back" tooltip="Back" onClick={this.onBack} />
					<Icon className="forward" tooltip="Forward" onClick={this.onForward} />
				</div>

				<div className="side center">
					<Icon className="nav" tooltip="Navigation" onClick={(e: any) => { this.onNavigation(e, true); }} />

					<div className="path" onMouseDown={(e: any) => { this.onNavigation(e, false); }} onMouseOver={this.onPathOver} onMouseOut={this.onPathOut}>
						<div className="item">
							<div className="name">New set</div>
						</div>
					</div>
				</div>

				<div className="side right">
					<Icon id="button-header-more" tooltip="Menu" className="more" onClick={this.onMore} />
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

		if (!root || root.isPageSet()) {
			return;
		};
		
		let targetId = '';
		let position = I.BlockPosition.Bottom;
		
		if (fb) {
			if (fb.isTitle()) {
				const first = blockStore.getFirstBlock(rootId, 1, (it: I.Block) => { return it.isFocusable() && !it.isTitle(); });
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

	onNavigation (e: any, expanded: boolean) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId } = this.props;

		commonStore.popupOpen('navigation', {
			preventResize: true, 
			data: {
				rootId: rootId,
				type: I.NavigationType.Go, 
				expanded: expanded,
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

export default HeaderMainSet;