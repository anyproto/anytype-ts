import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader } from 'Component';
import { I, S, U, J, keyboard, Action, focus } from 'Lib';
import HistoryLeft from './history/left';
import HistoryRight from './history/right';

const Diff = require('diff');

const PageMainHistory = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const [isLoading, setLoading] = useState(false);
	const { isPopup } = props;
	const rootId = keyboard.getRootId(isPopup);
	const ns = U.Common.getEventNamespace(isPopup);
	const cmd = keyboard.cmdKey();
	const selection = S.Common.getRef('selectionProvider');
	const nodeRef = useRef(null);
	const leftRef = useRef(null);
	const rightRef = useRef(null);

	const unbind = () => {
		const events = ['keydown'];

		$(window).off(events.map(it => `${it}.history${ns}`).join(' '));
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		win.on(`keydown.history${ns}`, e => onKeyDown(e));
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, () => onCopy());
	};

	const onClose = () => {
		U.Object.openAuto(S.Detail.get(rootId, rootId, []));
	};

	const onCopy = () => {
		const { focused } = focus.state;

		let ids = selection?.get(I.SelectType.Block, true) || [];
		if (!ids.length) {
			ids = [focused];
		};
		ids = ids.concat(S.Block.getLayoutIds(rootId, ids));

		Action.copyBlocks(rootId, ids, I.ClipboardMode.Copy);
	};

	const renderDiff = (previousId: string, diff: any[]) => {
		const node = $(nodeRef.current);

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
			elements = elements.concat(getElements(previousId, it));
		});

		elements = elements.map(it => ({ ...it, element: $(it.element) })).filter(it => it.element.length);

		if (elements.length) {
			elements.forEach(it => {
				it.element.addClass(U.Data.diffClass(it.type));
			});

			scrollToElement(elements[0].element);
		};
	};

	const scrollToElement = (element: any) => {
		if (!element || !element.length) {
			return;
		};

		const container = $(leftRef.current?.getNode());

		if (!container || !container.length) {
			return;
		};

		const ch = container.height();
		const no = element.offset().top;
		const st = container.scrollTop();
		const y = no - container.offset().top + st + ch / 2;

		container.scrollTop(Math.max(y, ch) - ch);
	};

	const getElements = (previousId: string, event: any) => {
		const { type, data } = event;
		const oldContextId = [rootId, previousId].join('-');

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
					elements = elements.concat(getBlockChangeElements(data.id));
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
				elements = elements.concat(getBlockChangeElements(data.id));
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
							elements = elements.concat(getBlockChangeElements(it.id));
						});
					};
				};

				break;
			};
		};

		return elements;
	};

	const getBlockChangeElements = (id: string) => {
		return [
			{ type: I.DiffType.None, element: `#block-${id}` },
			{ type: I.DiffType.Change, element: `#block-${id} > .wrapContent` },
		];
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const sideLeft = $(leftRef.current?.getNode());
		const sideRight = $(rightRef.current?.getNode());
		const editorWrapper = node.find('#editorWrapper');
		const cover = node.find('.block.blockCover');
		const container = U.Common.getPageContainer(isPopup);
		const sc = U.Common.getScrollContainer(isPopup);
		const header = container.find('#header');
		const height = sc.height();
		const hh = header.height();
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
		editorWrapper.css({ width: !isSetOrCollection() ? getWrapperWidth() : '' });
	};

	const getWrapperWidth = (): number => {
		return getWidth(U.Data.getLayoutWidth(rootId));
	};

	const getWidth = (weight: number) => {
		weight = Number(weight) || 0;

		const sideLeft = $(leftRef.current?.getNode());

		const cw = sideLeft.width();
		let width = 0;

		if (isSetOrCollection()) {
			width = cw - 192;
		} else {
			width = Math.min(cw - 96, (1 + weight) * J.Size.editor);
		};

		return Math.max(300, width);
	};

	const isSetOrCollection = (): boolean => {
		const root = S.Block.getLeaf(rootId, rootId);

		return U.Object.isInSetLayouts(root?.layout);
	};

	const setVersion = (version: I.HistoryVersion) => {
		if (leftRef.current) {
			leftRef.current.forceUpdate();
			leftRef.current.getHeaderRef()?.setVersion(version);
			leftRef.current.getHeadRef()?.forceUpdate();
		};

		$(window).trigger('updateDataviewData');
	};

	useEffect(() => {
		resize();
		rebind();

		return () => {
			unbind();

			S.Block.clear(rootId);
			S.Common.diffSet([]);
		};
	}, []);

	useEffect(() => {
		resize();
		rebind();
	});

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<div ref={nodeRef}>
			{isLoading ? <Loader id="loader" fitToContainer={true} isPopup={isPopup} /> : ''}

			<div id="body" className="flex">
				<HistoryLeft
					ref={leftRef}
					{...props}
					rootId={rootId}
					onCopy={onCopy}
					getWrapperWidth={getWrapperWidth}
				/>

				<HistoryRight
					ref={rightRef}
					{...props}
					rootId={rootId}
					renderDiff={renderDiff}
					setVersion={setVersion}
					setLoading={setLoading}
				/>
			</div>
		</div>
	);

}));

export default PageMainHistory;