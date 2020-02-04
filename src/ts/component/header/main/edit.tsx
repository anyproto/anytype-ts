import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile, DropTarget } from 'ts/component';
import { I, C, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	commonStore?: any;
	authStore?: any;
	blockStore?: any;
	dataset?: any;
};

const Constant = require('json/constant.json');

@inject('commonStore')
@inject('authStore')
@inject('blockStore')
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
		const { authStore, blockStore, rootId } = this.props;
		const { breadcrumbs, blocks } = blockStore;
		const { account } = authStore;
		const tree = blockStore.prepareTree(breadcrumbs, blocks[breadcrumbs] || []);
		
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
						<PathItem key={i} {...item} index={i} />
					))}
				</div>
				
				<div className="menu">
					<Icon id={'button-' + rootId + '-more'} className="more" onClick={this.onMore} />
				</div>
			</div>
		);
	};
	
	onAdd (e: any) {
		Util.pageCreate(e, this.props, Util.randomSmile(), Constant.defaultName);
	};
	
	onHome (e: any) {
		const { blockStore } = this.props;
		const { breadcrumbs } = blockStore;
		
		C.BlockCutBreadcrumbs(breadcrumbs, 0);
		this.props.history.push('/main/index');
	};
	
	onPath (e: any, block: any) {
		const { blockStore, rootId } = this.props;
		const { breadcrumbs } = blockStore;
		const { content } = block;
		const { targetBlockId } = content;
		
		if (targetBlockId != rootId) {
			C.BlockCutBreadcrumbs(breadcrumbs, block.index);
			Util.pageOpen(e, this.props, targetBlockId);
		};
	};
	
	onBack (e: any) {
		this.props.history.goBack();
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
		const { commonStore, rootId } = this.props;
		
		commonStore.menuOpen('blockMore', { 
			element: 'button-' + rootId + '-more',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: rootId,
				blockId: rootId,
				onSelect: (item: any) => {
				},
			}
		});
	};
	
};

export default HeaderMainEdit;