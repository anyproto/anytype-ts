import * as React from 'react';
import $ from 'jquery';
import { Header, Footer, Block, Loader, Icon, IconObject, Deleted, ObjectName } from 'Component';
import { blockStore, detailStore } from 'Store';
import { I, M, C, UtilCommon, UtilData, UtilObject, keyboard, Action, focus, UtilDate, UtilSpace } from 'Lib';
import { observer } from 'mobx-react';
const Errors = require('json/error.json');

interface State {
	versions: I.HistoryVersion[];
	loading: boolean;
	isDeleted: boolean;
};

const LIMIT = 100;
const GROUP_OFFSET = 3600;

const PageMainHistory = observer(class PageMainHistory extends React.Component<I.PageComponent, State> {

	node: any = null;
	state = {
		versions: [] as I.HistoryVersion[],
		loading: false,
		isDeleted: false,
	};
	
	version: I.HistoryVersion = null;
	refHeader: any = null;
	scrollLeft = 0;
	scrollRight = 0;
	lastId = '';
	refSideLeft = null;
	refSideRight = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.getWrapperWidth = this.getWrapperWidth.bind(this);
		this.onCopy = this.onCopy.bind(this);
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
		const check = UtilData.checkDetails(rootId);
		const object = detailStore.get(rootId, rootId, [ 'layoutAlign' ]);
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		const cn = [ 'editorWrapper', check.className ];
		const icon: any = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });

		if (root && (root.isObjectHuman() || root.isObjectParticipant())) {
			icon.type = I.BlockType.IconUser;
		};

		const Section = (item: any) => (
			<React.Fragment>
				<div className="section">
					<div className="date">{item.groupId}</div>
				</div>
				
				<div className="items">
					{item.list.map((item: any, i: number) => (
						<Version key={i} {...item} />
					))}
				</div>
			</React.Fragment>
		);

		const Version = (item: any) => {
			const withChildren = item.list && item.list.length;
			const author = UtilSpace.getParticipant(item.authorId);

			return (
				<React.Fragment>
					<div 
						id={'item-' + item.id} 
						className={[ 'item', (withChildren ? 'withChildren' : '') ].join(' ')} 
						onClick={e => this.loadVersion(item.id)}
					>
						{withChildren ? <Icon className="arrow" onClick={e => this.toggleChildren(e, item.id)} /> : ''}
						<div className="date">{UtilDate.date('d F, H:i', item.time)}</div>
						{author ? (
							<div className="author">
								<IconObject object={author} size={16} />
								<ObjectName object={author} />
							</div>
						) : ''}
					</div>

					{withChildren ? (
						<div id={`children-${item.id}`} className="children">
							{item.list.map((child: any, i: number) => <Version key={i} {...child} />)}
						</div>
					) : ''}
				</React.Fragment>
			);
		};
		
		return (
			<div 
				ref={node => this.node = node}
			>
				<Header 
					{...this.props} 
					ref={ref => this.refHeader = ref}
					component="mainHistory" 
					rootId={rootId}
					layout={I.ObjectLayout.History}
				/>

				<div id="body" className="flex">
					<div ref={ref => this.refSideLeft = ref} id="sideLeft" className="wrapper">
						<div id="editorWrapper" className={cn.join(' ')}>
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
											onCopy={this.onCopy}
										/>
									))}
								</div>
							</div>
						</div>
					</div>

					<div ref={ref => this.refSideRight = ref} id="sideRight" className="list">
						<div className="wrap">
							{groups.map((item: any, i: number) => (
								<Section key={i} {...item} />
							))}
						</div>
					</div>
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};
	
	componentDidMount () {
		this.loadList('');
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		const rootId = this.getRootId();
		const sideLeft = $(this.refSideLeft);
		const sideRight = $(this.refSideRight);

		this.resize();
		this.rebind();

		if (this.version) {
			this.show(this.version.id);
		};

		sideLeft.scrollTop(this.scrollLeft);
		sideRight.scrollTop(this.scrollRight);

		sideLeft.off('scroll').on('scroll', () => this.onScrollLeft());
		sideRight.off('scroll').on('scroll', () => this.onScrollRight());

		blockStore.updateNumbers(rootId);

		if (this.refHeader) {
			this.refHeader.refChild.setVersion(this.version);
		};
	};

	componentWillUnmount(): void {
		this.unbind();
		blockStore.clear(this.getRootId());
	};

	unbind () {
		const { isPopup } = this.props;
		const namespace = UtilCommon.getEventNamespace(isPopup);
		const events = [ 'keydown' ];

		$(window).off(events.map(it => `${it}.history${namespace}`).join(' '));
	};

	rebind () {
		const { isPopup } = this.props;
		const win = $(window);
		const namespace = UtilCommon.getEventNamespace(isPopup);

		this.unbind();
		win.on('keydown.history' + namespace, e => this.onKeyDown(e));
	};

	onKeyDown (e: any) {
		const cmd = keyboard.cmdKey();

		keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, () => this.onCopy());
	};

	onCopy () {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const rootId = this.getRootId();
		const { focused } = focus.state;

		let ids = selection.get(I.SelectType.Block, true);
		if (!ids.length) {
			ids = [ focused ];
		};
		ids = ids.concat(blockStore.getLayoutIds(rootId, ids));

		Action.copyBlocks(rootId, ids, false);
	};

	onScrollLeft () {
		const { isPopup } = this.props;
		const sideLeft = $(this.refSideLeft);
		const container = UtilCommon.getScrollContainer(isPopup);
		
		this.scrollLeft = sideLeft.scrollTop();
		container.trigger('scroll');
	};

	onScrollRight () {
		const { isPopup } = this.props;
		const { versions } = this.state;
		const container = UtilCommon.getPageContainer(isPopup);
		const sideRight = $(this.refSideRight);
		const wrap = sideRight.find('.wrap');
		const sections = wrap.find('.section');
		const { wh } = UtilCommon.getWindowDimensions();

		let offset = { top: 0, left: 0 };

		if (isPopup && container.length) {
			offset = container.offset();
		};

		this.scrollRight = sideRight.scrollTop();

		if (this.scrollRight >= wrap.height() - wh) {
			this.loadList(versions[versions.length - 1].id);
		};

		sections.each((i: number, item: any) => {
			item = $(item);

			const top = item.offset().top - offset.top;
			
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
		const version = versions.find(it => it.id == id);

		if (!version) {
			return;
		};

		const month = groups.find(it => it.groupId == this.monthId(version.time));
		if (!month) {
			return;
		};

		const group = month.list.find(it => it.groupId == version.groupId);
		const sideRight = $(this.refSideRight);
		const item = sideRight.find(`#item-${version.id}`);

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

		const sideRight = $(this.refSideRight);
		const item = sideRight.find(`#item-${id}`);
		const children = sideRight.find(`#children-${id}`);
		const isActive = item.hasClass('expanded');

		let height = 0;
		if (isActive) {
			item.removeClass('expanded');
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			window.setTimeout(() => { children.css({ height: 0 }); }, 15);
			window.setTimeout(() => children.hide(), 215);
		} else {
			item.addClass('expanded');
			children.show();
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();

			children.css({ overflow: 'hidden', height: 0 });
			window.setTimeout(() => { children.css({ height: height }); }, 15);
			window.setTimeout(() => { children.css({ overflow: 'visible', height: 'auto' }); }, 215);
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
				UtilObject.openRoute({ id: rootId, layout: object.layout });
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
			if (!UtilCommon.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			this.version = message.version;
			this.forceUpdate();
		});
	};
	
	groupData (versions: I.HistoryVersion[]) {
		const months: any[] = [];
		const groups: any[] = [];

		let groupId = 0;
		for (let i = 0; i < versions.length; ++i) {
			const version = versions[i];
			const prev = versions[i - 1];

			if (prev && ((prev.authorId != version.authorId) || (prev.time - version.time > GROUP_OFFSET) || (prev.time - version.time < 0))) {
				groupId++;
			};

			let group = groups.find(it => it.groupId == groupId);
			if (!group) {
				group = { ...version, groupId: groupId, list: [] };
				groups.push(group);
			} else {
				version.groupId = groupId;
				group.list.push(version);
			};
		};

		for (const group of groups) {
			if ((group.list.length == 1) && (group.time == group.list[0].time)) {
				group.list = [];
			};

			const groupId = this.monthId(group.time);

			let month = months.find(it => it.groupId == groupId);
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
		for (const month of groups) {
			for (const group of month.list) {
				ret.push(group);
				ret = ret.concat(group.list);
			};
		};
		return ret;
	};

	monthId (time: number) {
		return UtilDate.date('F Y', time);
	};

	resize () {
		const { isPopup } = this.props;

		const node = $(this.node);
		const sideLeft = $(this.refSideLeft);
		const sideRight = $(this.refSideRight);
		const editorWrapper = sideLeft.find('#editorWrapper');
		const cover = node.find('.block.blockCover');
		const container = UtilCommon.getPageContainer(isPopup);
		const sc = UtilCommon.getScrollContainer(isPopup);
		const header = container.find('#header');
		const height = sc.height();
		const hh = isPopup ? header.height() : UtilCommon.sizeHeader();
		const cssl: any = { height };

		sideRight.css({ height });

		if (cover.length) {
			cover.css({ top: hh });
		};

		if (isPopup) {
			const page = $('.pageMainHistory.isPopup');

			page.css({ height });
			cssl.paddingTop = hh;
		};

		sideLeft.css(cssl);
		editorWrapper.css({ width: this.getWrapperWidth() });
	};

	getWrapperWidth (): number {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		return this.getWidth(root?.fields?.width);
	};

	getWidth (w: number) {
		w = Number(w) || 0;

		const { isPopup, rootId } = this.props;
		const container = UtilCommon.getPageContainer(isPopup);
		const sideLeft = container.find('#body > #sideLeft');
		const root = blockStore.getLeaf(rootId, rootId);

		let mw = sideLeft.width();
		let width = 0;

		if (root && root.isObjectSet()) {
			width = mw - 192;
		} else {
			const size = mw * 0.6;

			mw -= 96;
			w = (mw - size) * w;
			width = Math.max(size, Math.min(mw, size + w));
		};

		return Math.max(300, width);
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

});

export default PageMainHistory;