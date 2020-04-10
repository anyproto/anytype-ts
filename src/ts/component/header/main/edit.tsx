import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile, DropTarget, HeaderItemPath } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { authStore, commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

const Constant = require('json/constant.json');

@observer
class HeaderMainEdit extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onPath = this.onPath.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const { breadcrumbs } = blockStore;
		const { account } = authStore;
		
		const childrenIds = blockStore.getChildren(breadcrumbs, breadcrumbs);
		const children = blockStore.getChildren(breadcrumbs, breadcrumbs);
		
		const PathItemHome = (item: any) => (
			<DropTarget {...this.props} className="item" id={rootId} rootId="" dropType={I.DragItem.Menu} onClick={this.onHome} onDrop={this.onDrop}>
				<Icon className="home" />
				<div className="name">{Util.shorten(account.name || 'Home', 16)}</div>
				<Icon className="arrow" />
			</DropTarget>
		);
		
		return (
			<div className="header headerMainEdit">
				<div className="path">
					<Icon className="plus-edit" onClick={this.onAdd} />
					<Icon className="back" onClick={this.onBack} />
					<Icon className="forward" onClick={this.onForward} />
					<PathItemHome />
					{children.map((item: any, i: any) => (
						<HeaderItemPath {...this.props} key={item.id} rootId={rootId} block={item} onPath={this.onPath} onDrop={this.onDrop} index={i + 1} />
					))}
				</div>
				
				<div className="menu">
					<Icon id={'button-' + rootId + '-more'} className="more" onClick={this.onMore} />
				</div>
			</div>
		);
	};
	
	onAdd (e: any) {
		DataUtil.pageCreate(e, this.props, '', Constant.default.name);
	};
	
	onHome (e: any) {
		const { breadcrumbs } = blockStore;
		
		C.BlockCutBreadcrumbs(breadcrumbs, 0, (message: any) => {
			this.props.history.push('/main/index');
		});
	};
	
	onPath (e: any, block: I.Block, index: number) {
		e.persist();
		
		const { rootId } = this.props;
		const { breadcrumbs } = blockStore;
		
		if (block.content.targetBlockId != rootId) {
			C.BlockCutBreadcrumbs(breadcrumbs, index, (message: any) => {
				DataUtil.pageOpen(e, this.props, block.id, block.content.targetBlockId);
			});
		};
	};
	
	onBack (e: any) {
		const { breadcrumbs } = blockStore;
		const children = blockStore.getChildren(breadcrumbs, breadcrumbs);
		
		C.BlockCutBreadcrumbs(breadcrumbs, (children.length > 0 ? children.length - 1 : 0), (message: any) => {
			this.props.history.goBack();			
		});
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
	
	onMore (e: any) {
		const { rootId, match } = this.props;
		
		commonStore.menuOpen('blockMore', { 
			element: '#button-' + rootId + '-more',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: rootId,
				blockId: rootId,
				match: match,
				onSelect: (item: any) => {
				},
			}
		});
	};
	
};

export default HeaderMainEdit;