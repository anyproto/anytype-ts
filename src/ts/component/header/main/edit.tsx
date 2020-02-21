import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile, DropTarget } from 'ts/component';
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
		const { breadcrumbs, blocks } = blockStore;
		const { account } = authStore;
		const tree = blockStore.prepareTree(breadcrumbs, blocks[breadcrumbs]);
		
		const PathItemHome = (item: any) => (
			<DropTarget {...this.props} className="item" id={rootId} rootId="" dropType={I.DragItem.Menu} onClick={this.onHome} onDrop={this.onDrop}>
				<Icon className="home" />
				<div className="name">{account.name || 'Home'}</div>
				<Icon className="arrow" />
			</DropTarget>
		);
		
		const PathItem = (item: any) => {
			let content = item.content || {};
			let fields = content.fields || {}; 
			return (
				<DropTarget {...this.props} className="item" id={item.id} rootId={rootId} dropType={I.DragItem.Menu} onClick={(e: any) => { this.onPath(e, item); }} onDrop={this.onDrop}>
					<Smile icon={fields.icon} />
					<div className="name">{fields.name}</div>
					<Icon className="arrow" />
				</DropTarget>
			);
		};
		
		return (
			<div className="header headerMainEdit">
				<div className="path">
					<Icon className="plus-edit" onClick={this.onAdd} />
					<Icon className="back" onClick={this.onBack} />
					<Icon className="forward" onClick={this.onForward} />
					<PathItemHome />
					{tree.map((item: any, i: any) => (
						<PathItem key={item.id} {...item} index={i + 1} />
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
	
	onPath (e: any, block: any) {
		e.persist();
		
		const { rootId } = this.props;
		const { breadcrumbs } = blockStore;
		
		if (block.content.targetBlockId != rootId) {
			C.BlockCutBreadcrumbs(breadcrumbs, block.index, (message: any) => {
				DataUtil.pageOpen(e, this.props, block.id, block.content.targetBlockId);
			});
		};
	};
	
	onBack (e: any) {
		const { breadcrumbs, blocks } = blockStore;
		const tree = blockStore.prepareTree(breadcrumbs, blocks[breadcrumbs]);
		
		C.BlockCutBreadcrumbs(breadcrumbs, (tree.length > 0 ? tree.length - 1 : 0), (message: any) => {
			this.props.history.goBack();			
		});
	};
	
	onForward (e: any) {
		this.props.history.goForward();
	};
	
	onDrop (e: any, type: string, targetId: string, position: I.BlockPosition) {
		if (this.props.dataset && this.props.dataset.onDrop) {
			this.props.dataset.onDrop(e, type, targetId, position);			
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