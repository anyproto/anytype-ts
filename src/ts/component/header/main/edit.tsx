import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile, DropTarget } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	authStore?: any;
	blockStore?: any;
	dataset?: any;
};

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
	};

	render () {
		const { authStore, rootId } = this.props;
		const { account } = authStore;
		
		let path: I.Block[] = [];
		this.getPath(rootId, path);
		
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
				<DropTarget {...this.props} className="item" id={item.id} rootId={rootId} dropType={I.DragItem.Menu} onClick={(e: any) => { this.onPath(e, item.id); }} onDrop={this.onDrop}>
					<Smile icon={fields.icon} />
					<div className="name">{fields.name}</div>
					<Icon className="arrow" />
				</DropTarget>
			);
		};
		
		return (
			<div className="header headerMainFolder">
				<div className="path">
					<Icon className="back" onClick={this.onBack} />
					<Icon className="forward" onClick={this.onForward} />
					<PathItemHome />
					{path.map((item: any, i: any) => (
						<PathItem key={i} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	getPath (id: string, path: I.Block[]) {
		const { blockStore, rootId } = this.props;
		const { blocks, root } = blockStore;
		const map = blockStore.getMap(blocks[root]);
		const block = blocks[root].find((it: any) => { return it.content.targetBlockId == id; });
		
		if (block) {
			path.unshift(block);
		};
		
		if (map[block.id].parentId != root) {
			this.getPath(map[block.id].parentId, path);
		};
	};
	
	onHome (e: any) {
		this.props.history.push('/main/index');
	};
	
	onPath (e: any, id: string) {
		const { blockStore } = this.props;
		const { blocks, root } = blockStore;
		const block = blocks[root].find((it: any) => { return it.id == id; });
		
		if (!block) {
			return;
		};
		
		this.props.history.push('/main/edit/' + block.content.targetBlockId);
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
	
};

export default HeaderMainEdit;