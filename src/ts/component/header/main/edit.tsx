import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile, DropTarget, HeaderItemPath } from 'ts/component';
import { I, C, Util, DataUtil, crumbs } from 'ts/lib';
import { authStore, commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

const Constant = require('json/constant.json');
const LIMIT = 3;

@observer
class HeaderMainEdit extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onSkip = this.onSkip.bind(this);
		this.onPath = this.onPath.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onNavigation = this.onNavigation.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const { breadcrumbs } = blockStore;
		
		const childrenIds = blockStore.getChildren(breadcrumbs, breadcrumbs);
		const children = blockStore.getChildren(breadcrumbs, breadcrumbs);
		const slice = children.length > LIMIT ? children.slice(children.length - LIMIT, children.length) : children;
		const n = children.length - LIMIT;
		
		const PathItemHome = (item: any) => (
			<div className="item"onClick={this.onHome}>
				<Icon className="home" />
				<div className="name">Home</div>
				<Icon className="arrow" />
			</div>
		);
		
		const PathItemSkip = (item: any) => (
			<div id="button-header-skip" className="item" onClick={this.onSkip}>
				<div className="name">...</div>
				<Icon className="arrow" />
			</div>
		);
		
		return (
			<div className="header headerMainEdit">
				<div className="path">
					<Icon className="back" onClick={this.onBack} />
					<Icon className="forward" onClick={this.onForward} />
					<Icon className="nav" onClick={this.onNavigation} />
					<PathItemHome />
					{children.length > LIMIT ? <PathItemSkip /> : ''}
					{slice.map((item: any, i: any) => (
						<HeaderItemPath {...this.props} key={i} rootId={rootId} block={item} onPath={this.onPath} onDrop={this.onDrop} index={n + i + 1} />
					))}
				</div>
				
				<div className="menu">
					<Icon id={'button-' + rootId + '-more'} className="more" onClick={this.onMore} />
				</div>
			</div>
		);
	};
	
	onHome (e: any) {
		const { breadcrumbs } = blockStore;
		
		this.props.history.push('/main/index');
	};
	
	onSkip (e: any) {
		const { breadcrumbs } = blockStore;
		const children = blockStore.getChildren(breadcrumbs, breadcrumbs);
		const slice = children.slice(0, children.length - LIMIT);
	
		let options = [];
		for (let i in slice) {
			const item = slice[i];
			const details = blockStore.getDetail(breadcrumbs, item.content.targetBlockId);
			
			options.push({
				id: item.id,
				targetId: item.content.targetBlockId,
				index: i,
				withSmile: true,
				icon: details.iconEmoji,
				name: details.name,
			});
		};
		
		commonStore.menuOpen('select', { 
			element: '#button-header-skip',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 8,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			className: 'skip',
			data: {
				value: '',
				options: options,
				onSelect: (event: any, item: any) => {
					crumbs.cut(I.CrumbsType.Page, item.index);
					DataUtil.pageOpen(e, this.props, item.id, item.targetId);
				},
			}
		});
	};
	
	onPath (e: any, block: I.Block, index: number) {
		const { rootId } = this.props;
		
		if (rootId == block.content.targetBlockId) {
			return;
		};
		
		e.persist();
		
		crumbs.cut(I.CrumbsType.Page, index);
		DataUtil.pageOpen(e, this.props, block.id, block.content.targetBlockId);
	};
	
	onBack (e: any) {
		const { breadcrumbs } = blockStore;
		const children = blockStore.getChildren(breadcrumbs, breadcrumbs);
		
		crumbs.cut(I.CrumbsType.Page, (children.length > 0 ? children.length - 1 : 0));
		this.props.history.goBack();
	};
	
	onForward (e: any) {
		this.props.history.goForward();
	};
	
	onDrop (e: any, type: string, rootId: string, targetId: string, position: I.BlockPosition) {
		const { dataset } = this.props;
		const { onDrop } = dataset || {};
		
		console.log('onDrop', type, rootId, targetId, position);
		
		if (onDrop) {
			onDrop(e, type, rootId, targetId, position);
		};
	};
	
	onNavigation (e: any) {
		const { rootId } = this.props;
		
		commonStore.popupOpen('tree', { 
			data: { 
				type: 'move', 
				rootId: rootId,
				onConfirm: (id: string) => {
				},
			}, 
		});
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
				match: match
			}
		});
	};
	
};

export default HeaderMainEdit;