import * as React from 'react';
import $ from 'jquery';
import { Header, Footer, Block, Loader, Icon, Deleted } from 'Component';
import { blockStore, detailStore } from 'Store';
import { I, M, C, Util, DataUtil, ObjectUtil } from 'Lib';
import { observer } from 'mobx-react';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';

interface State {
	versions: I.HistoryVersion[];
	loading: boolean;
	isDeleted: boolean;
};

const LIMIT = 100;
const GROUP_OFFSET = 300;

const PageMainHistory = observer(class PageMainHistory extends React.Component<I.PageComponent, State> {

	node: any = null;
	state = {
		versions: [] as I.HistoryVersion[],
		loading: false,
		isDeleted: false,
	};
	
	version: I.HistoryVersion = null;
	refHeader: any = null;
	refFooter: any = null;
	scrollLeft = 0;
	scrollRight = 0;
	lastId = '';

	constructor (props: I.PageComponent) {
		super(props);

		this.getWrapperWidth = this.getWrapperWidth.bind(this);
	};

	render () {
		const { versions, isDeleted } = this.state;
		const rootId = this.getRootId();
		const groups = this.groupData(versions);
		const root = blockStore.getLeaf(rootId, rootId);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (!this.version || !root) {
			return <Loader />;
		};

		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const children = blockStore.getChildren(rootId, rootId);
		const check = DataUtil.checkDetails(rootId);
		const object = check.object;
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		
		let cn = [ 'editorWrapper', check.className ];
		let icon: any = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		
		if (root && root.isObjectHuman()) {
			icon.type = I.BlockType.IconUser;
		};

		const Section = (item: any) => (
			<React.Fragment>
				<div className="section">
					<div className="date">{item.groupId}</div>
				</div>
				
				<div className="items">
					{item.list.map((item: any, i: number) => {
						return <Version key={i} {...item} />
					})}
				</div>
			</React.Fragment>
		);

		const Version = (item: any) => {
			const withChildren = item.list && item.list.length;
			return (
				<React.Fragment>
					<div id={'item-' + item.id} className={[ 'item', (withChildren ? 'withChildren' : '') ].join(' ')} onClick={(e: any) => { this.loadVersion(item.id); }}>
						{withChildren ? <Icon className="arrow" onClick={(e: any) => { this.toggleChildren(e, item.id); }} /> : ''}
						<div className="date">{Util.date('d F, H:i', item.time)}</div>
						{item.authorName ? <div className="name">{item.authorName}</div> : ''}
					</div>

					{withChildren ? (
						<div id={'children-' + item.id} className="children">
							{item.list.map((child: any, i: number) => {
								return <Version key={i} {...child} />
							})}
						</div>
					) : ''}
				</React.Fragment>
			);
		};
		
		return (
			<div ref={node => this.node = node}>
				<Header component="mainHistory" ref={ref => this.refHeader = ref} {...this.props} rootId={rootId} />

				<div id="body" className="flex">
					<div id="sideLeft" className="wrapper">
						<div className={cn.join(' ')}>
							<div className="editor">
								<div className="blocks">
									{check.withCover ? <Block {...this.props} rootId={rootId} key={cover.id} block={cover} readonly={true} /> : ''}
									{check.withIcon ? <Block {...this.props} rootId={rootId} key={icon.id} block={icon} readonly={true} /> : ''}
									
									{children.map((block: I.Block, i: number) => (
										<Block 
											key={block.id} 
											{...this.props}
											rootId={rootId}
											index={i}
											block={block}
											getWrapperWidth={this.getWrapperWidth}
											readonly={true}
										/>
									))}
								</div>
							</div>
						</div>
					</div>

					<div id="sideRight" className="list">
						<div className="wrap">
							{groups.map((item: any, i: number) => {
								return <Section key={i} {...item} />
							})}
						</div>
					</div>
				</div>

				<Footer 
					component="mainEdit" 
					ref={ref => { this.refFooter = ref; }} 
					{...this.props} 
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this.loadList('');
		this.resize();
	};

	componentDidUpdate () {
		const rootId = this.getRootId();
		const node = $(this.node);
		const sideLeft = node.find('#body > #sideLeft');
		const sideRight = node.find('#body > #sideRight');

		this.resize();

		if (this.version) {
			this.show(this.version.id);
		};

		sideLeft.scrollTop(this.scrollLeft);
		sideRight.scrollTop(this.scrollRight);

		sideLeft.off('scroll').scroll(() => { this.onScrollLeft(); });
		sideRight.off('scroll').scroll(() => { this.onScrollRight(); });

		blockStore.updateNumbers(rootId);

		if (this.refHeader) {
			this.refHeader.refChild.setVersion(this.version);
		};
	};

	onScrollLeft () {
		const node = $(this.node);
		const sideLeft = node.find('#sideLeft');
		
		this.scrollLeft = sideLeft.scrollTop();
	};

	onScrollRight () {
		const { versions } = this.state;
		const win = $(window);
		const node = $(this.node);
		const sideRight = node.find('#sideRight');
		const wrap = sideRight.find('.wrap');
		const sections = wrap.find('.section');

		this.scrollRight = sideRight.scrollTop();
		if (this.scrollRight >= wrap.height() - win.height()) {
			this.loadList(versions[versions.length - 1].id);
		};

		sections.each((i: number, item: any) => {
			item = $(item);
			const top = item.offset().top;
			
			let clone = sideRight.find('.section.fix.c' + i);
			if (top < 0) {
				if (!clone.length) {
					clone = item.clone();
					sideRight.prepend(clone);
					clone.addClass('fix c' + i).css({ zIndex: i + 1 });
				};
			} else {
				clone.remove();
			};
		});
	};

	show (id: string) {
		if (!id) {
			return;
		};

		const groups = this.groupData(this.state.versions);
		const versions = this.ungroupData(groups);
		const version = versions.find((it: any) => { return it.id == id; });

		if (!version) {
			return;
		};

		const month = groups.find((it: any) => { return it.groupId == this.monthId(version.time); });
		if (!month) {
			return;
		};

		const group = month.list.find((it: any) => { return it.groupId == version.groupId; });
		const node = $(this.node);
		const sideRight = node.find('#sideRight');
		const item = sideRight.find('#item-' + version.id);

		sideRight.find('.active').removeClass('active');
		item.addClass('active');

		if (group) {
			const groupItem = sideRight.find('#item-' + group.id);
			const children = sideRight.find('#children-' + group.id);

			groupItem.addClass('expanded');
			children.show();
		};
	};

	toggleChildren (e: any, id: string) {
		e.stopPropagation();

		const node = $(this.node);
		const sideRight = node.find('#sideRight');
		const item = sideRight.find('#item-' + id);
		const children = sideRight.find('#children-' + id);
		const isActive = item.hasClass('expanded');

		let height = 0;
		if (isActive) {
			item.removeClass('expanded');
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			setTimeout(() => { children.css({ height: 0 }); }, 15);
			setTimeout(() => { children.hide(); }, 215);
		} else {
			item.addClass('expanded');
			children.show();
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();

			children.css({ overflow: 'hidden', height: 0 });
			setTimeout(() => { children.css({ height: height }); }, 15);
			setTimeout(() => { children.css({ overflow: 'visible', height: 'auto' }); }, 215);
		};
	};
	
	loadList (lastId: string) { 
		const { versions, loading } = this.state;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		
		if (loading || (this.lastId && (lastId == this.lastId))) {
			return;
		};

		this.setState({ loading: true });
		this.lastId = lastId;

		C.HistoryGetVersions(rootId, lastId, LIMIT, (message: any) => {
			this.setState({ loading: false });

			if (message.error.code) {
				ObjectUtil.openRoute({ id: rootId, layout: object.layout });
				return;
			};

			const list = message.versions || [];
			this.setState({ versions: versions.concat(list) });

			if (!this.version && list.length) {
				this.loadVersion(list[0].id);
			};
		});
  	};
  
	loadVersion (id: string) {
		const rootId = this.getRootId();

		C.HistoryShowVersion(rootId, id, (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true });
				} else {
					ObjectUtil.openHome('route');
				};
				return;
			};

			this.version = message.version;
			this.forceUpdate();
		});
	};
	
	groupData (versions: I.HistoryVersion[]) {
		let months: any[] = [];
    	let groups: any[] = [];
		let groupId = 0;

		for (let i = 0; i < versions.length; ++i) {
			let version = versions[i];
			let prev = versions[i - 1];

			if (prev && ((prev.time - version.time > GROUP_OFFSET) || (prev.time - version.time < 0))) {
				groupId++;
			};

			let group = groups.find((it: any) => { return it.groupId == groupId; });
			if (!group) {
				group = { ...version, groupId: groupId, list: [] };
				groups.push(group);
      		} else {
				version.groupId = groupId;
				group.list.push(version);
			};
		};

		for (let group of groups) {
			if ((group.list.length == 1) && (group.time == group.list[0].time)) {
				group.list = [];
			};

			let groupId = this.monthId(group.time);
			let month = months.find((it: any) => { return it.groupId == groupId; });
      
			if (!month) {
				month = { groupId: groupId, list: [] };
				months.push(month);
      		};

      		month.list.push(group);
		};

		return months;
	};

	ungroupData (groups: any[]): I.HistoryVersion[] {
		let ret: I.HistoryVersion[] = [] as I.HistoryVersion[];
		for (let month of groups) {
			for (let group of month.list) {
				ret.push(group);
				ret = ret.concat(group.list);
			};
		};
		return ret;
	};

	monthId (time: number) {
		return Util.date('F Y', time);
	};

	resize () {
		const { isPopup } = this.props;

		const win = $(window);
		const node = $(this.node);
		const sideLeft = node.find('#body > #sideLeft');
		const sideRight = node.find('#body > #sideRight');
		const cover = node.find('.block.blockCover');
		const container = Util.getPageContainer(isPopup);
		const header = container.find('#header');
		const wrapper = $('.pageMainHistory .wrapper');
		const height = win.height();
		const hh = isPopup ? header.height() : Util.sizeHeader();

		sideLeft.css({ height });
		sideRight.css({ height });

		if (cover.length) {
			cover.css({ top: hh });
		};

		if (isPopup) {
			wrapper.css({ paddingTop: hh });
		};
	};

	getWrapperWidth (): number {
		return Constant.size.editor;
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

});

export default PageMainHistory;