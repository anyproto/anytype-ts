import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader } from 'Component';
import { I, S, U, J, keyboard, Action, focus } from 'Lib';
import HistoryLeft from './history/left';
import HistoryRight from './history/right';

const Diff = require('diff');

interface State {
	isLoading: boolean;
};

const PageMainHistory = observer(class PageMainHistory extends React.Component<I.PageComponent, State> {

	node = null;
	refSideLeft = null;
	refSideRight = null;
	state = {
		isLoading: false,
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.getWrapperWidth = this.getWrapperWidth.bind(this);
		this.renderDiff = this.renderDiff.bind(this);
		this.setVersion = this.setVersion.bind(this);
		this.setLoading = this.setLoading.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onClose = this.onClose.bind(this);
	};

	render () {
		const { isLoading } = this.state;
		const rootId = this.getRootId();

		return (
			<div ref={node => this.node = node}>
				{isLoading ? <Loader id="loader" /> : ''}

				<div id="body" className="flex">
					<HistoryLeft 
						ref={ref => this.refSideLeft = ref} 
						{...this.props} 
						rootId={rootId} 
						onCopy={this.onCopy} 
						getWrapperWidth={this.getWrapperWidth}
					/>

					<HistoryRight 
						ref={ref => this.refSideRight = ref} 
						{...this.props} 
						rootId={rootId}
						renderDiff={this.renderDiff}
						setVersion={this.setVersion}
						setLoading={this.setLoading}
					/>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		this.resize();
		this.rebind();
	};

	componentWillUnmount(): void {
		this.unbind();

		S.Block.clear(this.getRootId());
		S.Common.diffSet([]);
	};

	unbind () {
		const { isPopup } = this.props;
		const namespace = U.Common.getEventNamespace(isPopup);
		const events = [ 'keydown' ];

		$(window).off(events.map(it => `${it}.history${namespace}`).join(' '));
	};

	rebind () {
		const { isPopup } = this.props;
		const win = $(window);
		const namespace = U.Common.getEventNamespace(isPopup);

		this.unbind();
		win.on('keydown.history' + namespace, e => this.onKeyDown(e));
	};

	onKeyDown (e: any) {
		const cmd = keyboard.cmdKey();

		keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, () => this.onCopy());
	};

	onClose () {
		const rootId = this.getRootId();

		U.Object.openAuto(S.Detail.get(rootId, rootId, []));
	};

	onCopy () {
		const selection = S.Common.getRef('selectionProvider');
		const rootId = this.getRootId();
		const { focused } = focus.state;

		let ids = selection?.get(I.SelectType.Block, true) || [];
		if (!ids.length) {
			ids = [ focused ];
		};
		ids = ids.concat(S.Block.getLayoutIds(rootId, ids));

		Action.copyBlocks(rootId, ids, false);
	};

	renderDiff (previousId: string, diff: any[]) {
		const node = $(this.node);

		// Remove all diff classes
		for (const i in I.DiffType) {
			if (isNaN(Number(i))) {
				continue;
			};

			const c = `diff${I.DiffType[i]}`;
			node.find(`.${c}`).removeClass(c);
		};

		let elements = [];

		diff.forEach(it => {
			elements = elements.concat(this.getElements(previousId, it));
		});

		elements = elements.map(it => ({ ...it, element: $(it.element) })).filter(it => it.element.length);

		if (elements.length) {
			elements.forEach(it => {
				it.element.addClass(U.Data.diffClass(it.type));
			});

			this.scrollToElement(elements[0].element);
		};
	};

	scrollToElement (element: any) {
		if (!element || !element.length) {
			return;
		};

		const node = $(this.node);
		const container = node.find('#historySideLeft');

		if (!container || !container.length) {
			return;
		};

		const ch = container.height();
		const no = element.offset().top;
		const st = container.scrollTop();
		const y = no - container.offset().top + st + ch / 2;

		container.scrollTop(Math.max(y, ch) - ch);
	};

	getElements (previousId: string, event: any) {
		const { type, data } = event;
		const rootId = this.getRootId();
		const oldContextId = [ rootId, previousId ].join('-');

		let elements = [];
		switch (type) {
			case 'BlockAdd': {
				data.blocks.forEach(it => {
					elements = elements.concat([
						{ type: I.DiffType.None, element: `#block-${it.id}` },
						{ type: I.DiffType.Add, element: `#block-${it.id} > .wrapContent` },
					]);
				});
				break;
			};

			case 'BlockSetChildrenIds': {
				const newChildrenIds = data.childrenIds;
				const nl = newChildrenIds.length;
				const oldChildrenIds = S.Block.getChildrenIds(oldContextId, data.id);
				const ol = oldChildrenIds.length;

				if (nl >= ol) {
					break;
				};

				const removed = oldChildrenIds.filter(item => !newChildrenIds.includes(item));
				if (removed.length) {
					removed.forEach(it => {
						const idx = oldChildrenIds.indexOf(it);
						const afterId = newChildrenIds[idx - 1];

						if (afterId) {
							elements.push({ type: I.DiffType.Remove, element: `#block-${afterId} > .wrapContent` });
						};
					});
				};
				break;
			};

			case 'BlockSetText': {
				const block = S.Block.getLeaf(rootId, data.id);
				const oldBlock = S.Block.getLeaf(oldContextId, data.id);

				if (!block || !oldBlock) {
					break;
				};

				let type = I.DiffType.None;

				if (data.text !== null) {
					const diff = Diff.diffChars(oldBlock.getText(), String(data.text || ''));
					const added = diff.filter(it => it.added).length;

					if (added) {
						const marks = U.Common.objectCopy(block.content.marks || []);

						let from = 0;
						for (const item of diff) {
							if (item.removed) {
								continue;
							};

							const to = from + item.count;
							if (item.added) {
								marks.push({ type: I.MarkType.Change, param: '', range: { from, to } });
							};
							from = to;
						};

						S.Block.updateContent(rootId, data.id, { marks });
					} else {
						type = I.DiffType.Change;
					};
				} else {
					type = I.DiffType.Change;
				};

				if (type == I.DiffType.Change) {
					elements = elements.concat(this.getBlockChangeElements(data.id));
				} else {
					elements.push({ type, element: `#block-${data.id}` });
				};
				break;
			};

			case 'BlockSetTableRow':
			case 'BlockSetRelation':
			case 'BlockSetVerticalAlign':
			case 'BlockSetAlign':
			case 'BlockSetBackgroundColor':
			case 'BlockSetLatex':
			case 'BlockSetFile':
			case 'BlockSetBookmark':
			case 'BlockSetDiv':
			case 'BlockSetLink':
			case 'BlockSetFields': {
				elements = elements.concat(this.getBlockChangeElements(data.id));
				break;
			};

			case 'BlockDataviewIsCollectionSet':
			case 'BlockDataviewTargetObjectIdSet':
			case 'BlockDataviewGroupOrderUpdate':
			case 'BlockDataviewObjectOrderUpdate': {
				break;
			};

			case 'BlockDataviewViewOrder': {
				elements = elements.concat([
					{ type: I.DiffType.None, element: `#block-${data.id}` },
					{ type: I.DiffType.Change, element: `#block-${data.id} #view-selector` },
					{ type: I.DiffType.Change, element: `#block-${data.id} #views` },
				]);
				break;
			};

			case 'BlockDataviewViewUpdate': {
				elements.push({ type: I.DiffType.None, element: `#block-${data.id}` });

				if (data.fields !== null) {
					elements = elements.concat([
						{ type: I.DiffType.Change, element: `#block-${data.id} #view-selector` },
						{ type: I.DiffType.Change, element: `#view-item-${data.id}-${data.viewId}` },
					]);
				};

				if (data.relations.length) {
					elements.push({ type: I.DiffType.Change, element: `#block-${data.id} #button-dataview-settings` });
				};

				if (data.filters.length) {
					elements.push({ type: I.DiffType.Change, element: `#block-${data.id} #button-dataview-filter` });
				};

				if (data.sorts.length) {
					elements.push({ type: I.DiffType.Change, element: `#block-${data.id} #button-dataview-sort` });
				};
				break;
			};

			case 'BlockDataviewRelationDelete':
			case 'BlockDataviewRelationSet': {
				elements = elements.concat([
					{ type: I.DiffType.None, element: `#block-${data.id}` },
					{ type: I.DiffType.Change, element: `#block-${data.id} #button-dataview-settings` },
				]);
				break;
			};

			case 'ObjectRelationsAmend': {
				elements.push({ type: I.DiffType.Change, element: '#button-header-relation' });
				break;
			};

			case 'ObjectDetailsSet': 
			case 'ObjectDetailsAmend': {
				const rootId = this.getRootId();

				if (data.id != rootId) {
					break;
				};

				elements.push({ type: I.DiffType.Change, element: '#button-header-relation' });

				if (undefined !== data.details.name) {
					elements = elements.concat([
						{ type: I.DiffType.Change, element: `#block-${J.Constant.blockId.title}` },
						{ type: I.DiffType.Change, element: `.headSimple #editor-${J.Constant.blockId.title}` }
					]);
				};

				if (undefined !== data.details.description) {
					elements.push({ type: I.DiffType.Change, element: `#block-${J.Constant.blockId.description}` });
				};

				if ((undefined !== data.details.iconEmoji) || (undefined !== data.details.iconImage)) {
					elements.push({ type: I.DiffType.Change, element: `#block-icon-${data.id}` });
				};

				if (undefined !== data.details.featuredRelations) {
					elements.push({ type: I.DiffType.Change, element: `#block-${J.Constant.blockId.featured}` });
				};

				if (type == 'ObjectDetailsAmend') {
					for (const k in data.details) {
						const blocks = S.Block.getBlocks(rootId, it => it.isRelation() && (it.content.key == k));

						blocks.forEach(it => {
							elements = elements.concat(this.getBlockChangeElements(it.id));
						});
					};
				};

				break;
			};
		};

		return elements;
	};

	getBlockChangeElements (id: string) {
		return [
			{ type: I.DiffType.None, element: `#block-${id}` },
			{ type: I.DiffType.Change, element: `#block-${id} > .wrapContent` },
		];
	};

	resize () {
		const { isPopup } = this.props;
		const node = $(this.node);
		const sideLeft = node.find('#historySideLeft');
		const sideRight = node.find('#historySideRight');
		const editorWrapper = node.find('#editorWrapper');
		const cover = node.find('.block.blockCover');
		const container = U.Common.getPageContainer(isPopup);
		const sc = U.Common.getScrollContainer(isPopup);
		const header = container.find('#header');
		const height = sc.height();
		const hh = isPopup ? header.height() : J.Size.header;
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
		editorWrapper.css({ width: !this.isSetOrCollection() ? this.getWrapperWidth() : '' });
	};

	getWrapperWidth (): number {
		return this.getWidth(U.Data.getLayoutWidth(this.props.rootId));
	};

	getWidth (w: number) {
		w = Number(w) || 0;

		const node = $(this.node);
		const sideLeft = node.find('#historySideLeft');
		const min = 300;

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

		return Math.max(min, width);
	};

	getGroupId (time: number) {
		return U.Date.date('M d, Y', time);
	};

	getRootId () {
		return keyboard.getRootId(this.props.isPopup);
	};

	isSetOrCollection (): boolean {
		const rootId = this.getRootId();
		const root = S.Block.getLeaf(rootId, rootId);

		return U.Object.isInSetLayouts(root?.layout);
	};

	setVersion (version: I.HistoryVersion) {
		this.refSideLeft?.forceUpdate();
		this.refSideLeft?.refHeader?.setVersion(version);
		this.refSideLeft?.refHead?.forceUpdate();

		$(window).trigger('updateDataviewData');
	};

	setLoading (v: boolean) {
		this.setState({ isLoading: v });
	};

});

export default PageMainHistory;