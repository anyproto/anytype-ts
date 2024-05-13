import * as React from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import { observer } from 'mobx-react';
import { Header, Footer, Block, Loader, Icon, IconObject, Deleted, ObjectName } from 'Component';
import { blockStore, detailStore, commonStore } from 'Store';
import { I, M, C, UtilCommon, UtilData, UtilObject, keyboard, Action, focus, UtilDate, UtilSpace, translate, analytics } from 'Lib';
import HeadSimple from 'Component/page/elements/head/simple';
import Constant from 'json/constant.json';

interface State {
	versions: I.HistoryVersion[];
	version: I.HistoryVersion;
	isLoading: boolean;
	isDeleted: boolean;
};

const LIMIT_RECORDS = 300;
const LIMIT_AUTHORS = 3;

const PageMainHistory = observer(class PageMainHistory extends React.Component<I.PageComponent, State> {

	node: any = null;
	state = {
		versions: [] as I.HistoryVersion[],
		version: null,
		isLoading: false,
		isDeleted: false,
	};
	
	refHeader: any = null;
	scrollLeft = 0;
	scrollRight = 0;
	lastId = '';
	refSideLeft = null;
	refSideRight = null;
	refHead = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.getWrapperWidth = this.getWrapperWidth.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onCurrent = this.onCurrent.bind(this);
		this.onRestore = this.onRestore.bind(this);
		this.onClose = this.onClose.bind(this);
	};

	render () {
		const { version, isDeleted } = this.state;
		const rootId = this.getRootId();
		const groups = this.groupData();
		const root = blockStore.getLeaf(rootId, rootId);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (!version || !root) {
			return <Loader id="loader" />;
		};

		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const check = UtilData.checkDetails(rootId);
		const object = detailStore.get(rootId, rootId, [ 'layoutAlign' ]);
		const icon = new M.Block({ id: `${rootId}-icon`, type: I.BlockType.IconPage, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		const cover = new M.Block({ id: `${rootId}-cover`, type: I.BlockType.Cover, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		const cn = [ 'editorWrapper', check.className ];
		const isSet = root?.isObjectSet();
		const isCollection = root?.isObjectCollection();
		const isHuman = root?.isObjectHuman();
		const isParticipant = root?.isObjectParticipant();
		const year = UtilDate.date('Y', UtilDate.now());

		let head = null;
		let children = blockStore.getChildren(rootId, rootId);

		if (isSet || isCollection) {
			const placeholder = isCollection ? translate('defaultNameCollection') : translate('defaultNameSet');

			head = (
				<HeadSimple 
					{...this.props} 
					ref={ref => this.refHead = ref} 
					placeholder={placeholder} rootId={rootId} 
				/>
			);

			children = children.filter(it => it.isDataview());
			check.withIcon = false;
		} else
		if (isHuman || isParticipant) {
			icon.type = I.BlockType.IconUser;
		};

		const Section = (item: any) => {
			const y = UtilDate.date('Y', item.time);
			const format = y == year ? 'M d' : 'M d, Y';
			const day = UtilDate.dayString(item.time);
			const date = day ? day : UtilDate.date(format, item.time);
			const authors = UtilCommon.arrayUnique(item.list.map(it => it.authorId)).slice(0, LIMIT_AUTHORS);

			return (
				<div id={`section-${item.hash}`} className="section">
					<div className="head" onClick={e => this.toggleChildren(e, item.hash)}>
						<div className="date">{date}</div>
						<div className="authors">
							{authors.map((id: string, i: number) => (
								<IconObject 
									key={id} 
									object={UtilSpace.getParticipant(id)} 
									size={18} 
									style={{ zIndex: (LIMIT_AUTHORS - i) }} 
								/>
							))}
						</div>
						<Icon className="arrow" />
					</div>
					<div className="items">
						{item.list.map((item: any, i: number) => (
							<Item key={item.id} {...item} />
						))}
					</div>
				</div>
			);
		};

		const Child = (item: any) => (
			<div 
				id={`item-${item.id}`} 
				className="child" 
				onClick={e => this.loadVersion(item.id)}
			>
				<div className="bullet" />
				<div className="date">{UtilDate.date('g:i A', item.time)}</div>
			</div>
		);

		const Item = (item: any) => {
			const withChildren = item.list && item.list.length;
			const author = UtilSpace.getParticipant(item.authorId);

			return (
				<div 
					id={`item-${item.id}`} 
					className="item" 
				>
					<div className="info" onClick={e => this.loadVersion(item.id)}>
						<div className="date">{UtilDate.date('g:i A', item.time)}</div>

						{author ? (
							<div className="author">
								<IconObject object={author} size={16} />
								<ObjectName object={author} />
							</div>
						) : ''}
					</div>

					{withChildren ? (
						<div id={`children-${item.id}`} className="children">
							{item.list.map((child: any, i: number) => <Child key={child.id} {...child} />)}
						</div>
					) : ''}
				</div>
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
									<div className="editorControls" />

									{head}
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
						<div className="head">
							<div className="name">{translate('commonVersionHistory')}</div>
							<Icon className="close" onClick={this.onClose} />
						</div>

						<div className="section" onClick={this.onCurrent}>
							<div className="head">
								<div className="name">{translate('headerHistoryCurrent')}</div>
							</div>
						</div>

						{groups.map((item: any, i: number) => (
							<Section key={i} {...item} />
						))}
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
		const { version } = this.state;
		const rootId = this.getRootId();
		const sideLeft = $(this.refSideLeft);
		const sideRight = $(this.refSideRight);

		this.resize();
		this.rebind();
		this.show();

		sideLeft.scrollTop(this.scrollLeft);
		sideRight.scrollTop(this.scrollRight);
		sideLeft.off('scroll').on('scroll', () => this.onScrollLeft());
		sideRight.off('scroll').on('scroll', () => this.onScrollRight());

		blockStore.updateNumbers(rootId);

		if (this.refHeader && version) {
			this.refHeader.refChild.setVersion(version);
		};
	};

	componentWillUnmount(): void {
		this.unbind();
		blockStore.clear(this.getRootId());
		commonStore.diffSet([]);
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

	onClose () {
		const rootId = this.getRootId();

		UtilObject.openAuto(detailStore.get(rootId, rootId, []));
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
		this.scrollLeft = $(this.refSideLeft).scrollTop();
		UtilCommon.getScrollContainer(this.props.isPopup).trigger('scroll');
	};

	onScrollRight () {
		this.scrollRight = $(this.refSideRight).scrollTop();
	};

	onCurrent () {
		const { versions } = this.state;

		if (versions.length) {
			this.loadVersion(versions[0].id);
		};
	};

	onRestore (e: any) {
		e.persist();

		const { version } = this.state;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, []);

		if (!version) {
			return;
		};

		C.HistorySetVersion(rootId, version.id, () => {
			UtilObject.openEvent(e, object);
			analytics.event('RestoreFromHistory');
		});
	};

	show () {
		const { version } = this.state;
		if (!version) {
			return;
		};

		const sideRight = $(this.refSideRight);
		const groupId = this.getGroupId(version.time);
		const hash = sha1(groupId);
		const item = sideRight.find(`#item-${version.id}`);
		const section = sideRight.find(`#section-${hash}`);

		section.addClass('isExpanded');
		section.find('.items').show();

		sideRight.find('.active').removeClass('active');
		item.addClass('active');
	};

	toggleChildren (e: any, id: string) {
		e.stopPropagation();

		const sideRight = $(this.refSideRight);
		const section = sideRight.find(`#section-${id}`);
		const items = section.find('.items');
		const isActive = section.hasClass('isExpanded');

		let height = 0;
		if (isActive) {
			section.removeClass('isExpanded');

			items.css({ overflow: 'visible', height: 'auto' });
			height = items.height();
			items.css({ overflow: 'hidden', height: height });

			window.setTimeout(() => items.css({ height: 0 }), 15);
			window.setTimeout(() => items.hide(), 215);
		} else {
			section.addClass('isExpanded');

			items.show();
			items.css({ overflow: 'visible', height: 'auto' });
			height = items.height();

			items.css({ overflow: 'hidden', height: 0 });
			window.setTimeout(() => items.css({ height: height }), 15);
			window.setTimeout(() => items.css({ overflow: 'visible', height: 'auto' }), 215);
		};
	};
	
	loadList (lastId: string) { 
		const { versions, version, isLoading } = this.state;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		
		if (isLoading || (this.lastId && (lastId == this.lastId))) {
			return;
		};

		this.setState({ isLoading: true });
		this.lastId = lastId;

		C.HistoryGetVersions(rootId, lastId, LIMIT_RECORDS, (message: any) => {
			this.setState({ isLoading: false });

			if (message.error.code) {
				UtilObject.openRoute({ id: rootId, layout: object.layout });
				return;
			};

			const list = message.versions || [];
			this.setState({ versions: versions.concat(list) });

			if (!version && list.length) {
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

			this.setState({ version: message.version }, () => {
				this.loadDiff(id);
			});
		});
	};

	loadDiff (id: string) {
		const { versions } = this.state;

		if (!versions.length) {
			return;
		};

		const idx = versions.findIndex(it => it.id == id);

		if (idx >= (versions.length - 1)) {
			return;
		};

		const prev = versions[idx + 1];

		C.HistoryDiffVersions(this.getRootId(), commonStore.space, id, prev.id, (message: any) => {
			this.renderDiff(message.events);
			commonStore.diffSet(message.events);
		});
	};
	
	groupData () {
		const groups: any[] = [];
		const groupByAuthor = [];
		const versions = this.state.versions || [];

		let id = '';

		for (let i = 0; i < versions.length; i++) {
			const version = versions[i] as any;
			const prev = versions[i - 1];
			const cid = this.getGroupId(version.time);

			let add = true;

			if (prev) {
				const pid = this.getGroupId(prev.time);

				if ((cid == pid) && (version.authorId == prev.authorId)) {
					const item = groupByAuthor.find(it => it.id == id);
					if (item) {
						item.list = (item.list || []).concat(version);
						add = false;
					};
				};
			};

			if (add) {
				groupByAuthor.push({ ...version, list: [] });
				id = version.id;
			};
		};

		for (const version of groupByAuthor) {
			const id = this.getGroupId(version.time);
			const group = groups.find(it => it.id == id);

			if (group) {
				group.list.push(version);
			} else {
				groups.push({ id, list: [ version ], time: version.time, hash: sha1(id) });
			};
		};
		return groups;
	};

	renderDiff (diff: any[]) {
		const node = $(this.node);

		node.find('.diffAdd').removeClass('diffAdd');
		node.find('.diffChange').removeClass('diffChange');

		let elements = [];

		diff.forEach(it => {
			elements = elements.concat(this.getElements(it));
		});

		elements.forEach(it => {
			$(it.element).addClass(UtilData.diffClass(it.operation));
		});
	};

	getElements (event: any) {
		const { type, data } = event;

		let elements = [];
		switch (type) {
			case 'BlockAdd': {
				data.blocks.forEach(it => {
					elements.push({ 
						operation: I.DiffType.Add, 
						element: `#block-${it.id}`,
					});
				});
				break;
			};

			case 'BlockDataviewObjectOrderUpdate':
			case 'BlockDataviewGroupOrderUpdate':
			case 'BlockDataviewIsCollectionSet':
			case 'BlockDataviewTargetObjectIdSet':
			case 'BlockDataviewViewOrder':
			case 'BlockSetTableRow':
			case 'BlockSetRelation':
			case 'BlockSetVerticalAlign':
			case 'BlockSetAlign':
			case 'BlockSetBackgroundColor':
			case 'BlockSetLatex':
			case 'BlockSetFile':
			case 'BlockSetBookmark':
			case 'BlockSetDiv':
			case 'BlockSetText':
			case 'BlockSetLink':
			case 'BlockSetFields': {
				elements.push({ 
					operation: I.DiffType.Change, 
					element: `#block-${data.id}`,
				});
				break;
			};

			case 'BlockDataviewViewUpdate': {
				if (data.fields !== null) {
					elements = elements.concat([
						{ 
							operation: I.DiffType.Change, 
							element: `#block-${data.id} #view-selector`,
						},
						{ 
							operation: I.DiffType.Change, 
							element: `#view-item-${data.id}-${data.viewId}`,
						},
					]);
				};

				if (data.relations.length) {
					elements.push({ 
						operation: I.DiffType.Change, 
						element: `#block-${data.id} #button-dataview-settings`,
					});
				};

				if (data.filters.length) {
					elements.push({ 
						operation: I.DiffType.Change, 
						element: `#block-${data.id} #button-dataview-filter`,
					});
				};

				if (data.sorts.length) {
					elements.push({ 
						operation: I.DiffType.Change, 
						element: `#block-${data.id} #button-dataview-sort`,
					});
				};
				break;
			};

			case 'BlockDataviewRelationDelete':
			case 'BlockDataviewRelationSet': {
				elements.push({ 
					operation: I.DiffType.Change, 
					element: `#block-${data.id} #button-dataview-settings`,
				});
				break;
			};

			case 'ObjectDetailsSet': 
			case 'ObjectDetailsAmend':
			case 'ObjectDetailsUnset': {
				const rootId = this.getRootId();

				if (data.id != rootId) {
					break;
				};

				elements.push({ 
					operation: I.DiffType.Change, 
					element: '#button-header-relation',
				});

				if (undefined !== data.details.name) {
					elements.push({ 
						operation: I.DiffType.Change, 
						element: `#block-${Constant.blockId.title}`,
					});
				};

				if (undefined !== data.details.description) {
					elements.push({ 
						operation: I.DiffType.Change, 
						element: `#block-${Constant.blockId.description}`,
					});
				};

				if ((undefined !== data.details.iconEmoji) || (undefined !== data.details.iconImage)) {
					elements.push({ 
						operation: I.DiffType.Change, 
						element: `#block-icon-${data.id}`,
					});
				};

				if (undefined !== data.details.featuredRelations) {
					elements.push({ 
						operation: I.DiffType.Change, 
						element: `#block-${Constant.blockId.featured}`,
					});
				};

				break;
			};
		};

		return elements;
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
			$('.pageMainHistory.isPopup').css({ height });
			cssl.paddingTop = hh;
		};

		sideLeft.css(cssl);
		
		if (!this.isSetOrCollection()) {
			editorWrapper.css({ width: this.getWrapperWidth() });
		};
	};

	getWrapperWidth (): number {
		const rootId = this.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);

		return this.getWidth(root?.fields?.width);
	};

	getWidth (w: number) {
		w = Number(w) || 0;

		const { isPopup } = this.props;
		const container = UtilCommon.getPageContainer(isPopup);
		const sideLeft = container.find('#body > #sideLeft');

		let mw = sideLeft.width();
		let width = 0;

		if (this.isSetOrCollection()) {
			width = mw - 192;
		} else {
			const size = mw * 0.6;

			mw -= 96;
			w = (mw - size) * w;
			width = Math.max(size, Math.min(mw, size + w));
		};

		return Math.max(300, width);
	};

	getGroupId (time: number) {
		return UtilDate.date('M d, Y', time);
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	isSetOrCollection (): boolean {
		const rootId = this.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);

		return root?.isObjectSet() || root?.isObjectCollection();
	};

});

export default PageMainHistory;