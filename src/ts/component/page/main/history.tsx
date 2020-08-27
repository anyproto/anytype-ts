import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { HeaderMainHistory as Header, Block, Loader } from 'ts/component';
import { blockStore } from 'ts/store';
import { I, M, C, Util, dispatcher, Storage } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> { };

interface State {
	versions: I.Version[];
};

const $ = require('jquery');

@observer
class PageMainHistory extends React.Component<Props, State> {

	state = {
		versions: [] as I.Version[],
	};
	
	versionId: string = '';
	refHeader: any = null;

	constructor (props: any) {
		super(props);
	};

	render () {
		const { match } = this.props;
		const { versions } = this.state;
		const rootId = match.params.id;

		const root = blockStore.getLeaf(rootId, rootId);
		if (!this.versionId || !root) {
			return <Loader />;
		};

		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const children = blockStore.getChildren(rootId, rootId);
		const details = blockStore.getDetails(rootId, rootId);
		const length = childrenIds.length;

		const withIcon = details.iconEmoji || details.iconImage;
		const withCover = (details.coverType != I.CoverType.None) && details.coverId;
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });
		
		let cn = [ 'editorWrapper' ];
		let icon: any = { id: rootId + '-icon', childrenIds: [], fields: {}, content: {} };
		
		if (root && root.isPageProfile()) {
			cn.push('isProfile');
			icon.type = I.BlockType.IconUser;
		} else {
			icon.type = I.BlockType.IconPage;
		};

		if (root && root.isPageSet()) {
			cn.push('isDataview');
		};
		
		icon = new M.Block(icon);
		
		if (withIcon && withCover) {
			cn.push('withIconAndCover');
		} else
		if (withIcon) {
			cn.push('withIcon');
		} else
		if (withCover) {
			cn.push('withCover');
		};
		
		const Section = (item: any) => (
			<React.Fragment>
				<div className="section">
					<div className="date">{item.id}</div>
				</div>
				
				<div className="items">
					{item.list.map((item: any, i: number) => {
						return <Version key={i} {...item} />
					})}
				</div>
			</React.Fragment>
		);

		const Version = (item: any) => (
			<div className="item" onClick={(e: any) => { this.loadVersion(item.id); }}>
				<div className="date">{Util.date('d F Y, H:i:s', item.time)}</div>
				<div className="name">Emmy Noether</div>
			</div>
		);
		
		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} version={{ id: this.versionId, previousIds: [], authorId: '', authorName: '', time: 0 }} />
				<div id="body" className="flex">
					<div id="sideLeft" className="wrapper">
						<div className={cn.join(' ')}>
							{withCover ? <Block {...this.props} rootId={rootId} key={cover.id} block={cover} readOnly={true} /> : ''}
							<div className="editor">
								<div className="blocks">
									{withIcon ? (
										<Block 
											key={icon.id} 
											{...this.props} 
											rootId={rootId}
											block={icon} 
											className="root" 
											readOnly={true}
										/>	
									) : ''}
									
									{children.map((block: I.Block, i: number) => {
										return (
											<Block 
												key={block.id} 
												{...this.props}
												rootId={rootId}
												index={i}
												block={block}
												onKeyDown={() => {}}
												onKeyUp={() => {}} 
												onMenuAdd={() => {}}
												onPaste={() => {}}
												readOnly={true}
											/>
										)
									})}
								</div>

								<div className="blockLast" />
							</div>
						</div>
					</div>

					<div id="sideRight" className="list">
						{versions.map((item: any, i: number) => {
							return <Section key={i} {...item} />
						})}
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.loadList();
		this.resize();
		this.setId();
	};

	componentDidUpdate () {
		this.resize();
		this.setId();
	};

	setId () {
		const { match } = this.props;
		Storage.set('pageId', match.params.id);
	};
	
	loadList () { 
		const { match } = this.props;
		const rootId = match.params.id;

		C.HistoryVersions(rootId, '', 100, (message: any) => {
			if (message.error.code || !message.versions.length) {
				return;
			};

			this.setState({ versions: this.groupData(message.versions) });

			if (!this.versionId) {
				this.loadVersion(message.versions[0].id);
			};
		});
  	};
  
	loadVersion (id: string) {
		const { match } = this.props;
		const rootId = match.params.id;

		this.versionId = id;

		C.HistoryShow(rootId, id, (message: any) => {
			let bs = message.blockShow;
			dispatcher.onBlockShow(rootId, bs.type, bs.blocks, bs.details);
			
			this.forceUpdate();
		});
	};
	
	groupData (versions: any[]) { 
    	let groups: any[] = [];

		versions.reverse();
    
		for (let item of versions) {
			let groupId = Util.date('F Y', item.time);
			let group = groups.find((it: any) => { return it.id == groupId; });
      
			if (!group) {
				group = {
					id: Util.date('F Y', item.time),
					list: [],
				};
				groups.push(group);
      		};
      
      		group.list.push(item);
		};

		return groups;
	};

	resize () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const sideLeft = node.find('#sideLeft');
		const sideRight = node.find('#sideRight');
		const height = win.height();

		sideLeft.css({ height: height });
		sideRight.css({ height: height });
	};

};

export default PageMainHistory;