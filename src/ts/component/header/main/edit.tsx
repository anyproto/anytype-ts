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

		this.onPathOver = this.onPathOver.bind(this);
		this.onPathOut = this.onPathOut.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const { breadcrumbs } = blockStore;

		const details = blockStore.getDetails(breadcrumbs, rootId);
		const { iconEmoji, iconImage, name } = details;
		const cn = [ 'header', 'headerMainEditSearch' ];

		if (commonStore.popupIsOpen('navigation')) {
			cn.push('active');
		};
		
		return (
			<React.Fragment>
				<div className={cn.join(' ')}>
					<div className="mid">
						<Icon className="btn home" tooltip="Home" onClick={this.onHome} />
						<Icon className="btn back" tooltip="Back" onClick={this.onBack} />
						<Icon className="btn forward" tooltip="Forward" onClick={this.onForward} />

						<div className="path" onClick={this.onNavigation} onMouseOver={this.onPathOver} onMouseOut={this.onPathOut}>
							<div className="item">
								<Smile icon={iconEmoji} hash={iconImage} />
								<div className="name">{Util.shorten(name, 32)}</div>
							</div>
						</div>

						<Icon className="btn plus" tooltip="Create new page" onClick={this.onAdd} />
					</div>

					<div className="right">
						<Icon id={'button-' + rootId + '-more'} tooltip="Menu" className="more" onClick={this.onMore} />
					</div>
				</div>
			</React.Fragment>
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
			element: '#button-' + rootId + '-more',
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
		const fb = blockStore.getLeaf(rootId, focused);
		const details = { 
			iconEmoji: SmileUtil.random(), 
			name: Constant.default.name 
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
		
		DataUtil.pageCreate(e, rootId, targetId, details, position);
	};

	onNavigation (e: any) {
		console.log(e);

		const { rootId } = this.props;

		commonStore.popupOpen('navigation', {
			preventResize: true, 
			data: {
				rootId: rootId,
				pageId: rootId,
				type: I.NavigationType.Go, 
			},
		});
	};

	onPathOver () {
		const node = $(ReactDOM.findDOMNode(this));
		const path = node.find('.path');

		Util.tooltipShow('Click to open navigation<br/>Type to search', path, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Util.tooltipHide();
	};
	
};

export default HeaderMainEdit;