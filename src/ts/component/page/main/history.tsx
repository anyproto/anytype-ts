import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { Loader } from 'Component';
import HistoryLeft from './history/left';
import HistoryRight from './history/right';

import * as Diff from 'diff';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const PageMainHistory = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const [isLoading, setLoading] = useState(false);
	const { isPopup } = props;
	const rootId = keyboard.getRootId(isPopup);
	const ns = U.Dom.getEventNamespace(isPopup);
	const cmd = keyboard.cmdKey();
	const selection = S.Common.getRef('selectionProvider');
	const nodeRef = useRef(null);
	const leftRef = useRef(null);
	const rightRef = useRef(null);

	const keydownHandler = useRef<((e: any) => void) | null>(null);

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const rebind = () => {
		unbind();
		keydownHandler.current = e => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, () => onCopy());
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
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		// Remove all diff classes
		for (const i in I.DiffType) {
			if (isNaN(Number(i))) {
				continue;
			};

			const c = `diff${I.DiffType[i]}`;
			U.Dom.selectAll(`.${c}`, node).forEach(el => U.Dom.removeClass(el, c));
		};

		let elements = [];

		diff.forEach(it => {
			elements = elements.concat(getElements(previousId, it));
		});

		const resolved = elements.map(it => ({ ...it, element: U.Dom.select(it.element, node) })).filter(it => it.element);

		if (resolved.length) {
			resolved.forEach(it => {
				U.Dom.addClass(it.element, U.Data.diffClass(it.type));
			});

			scrollToElement(resolved[0].element);
		};
	};

	const scrollToElement = (element: HTMLElement) => {
		if (!element) {
			return;
		};

		const container = leftRef.current?.getNode() as HTMLElement;
		if (!container) {
			return;
		};

		const ch = container.clientHeight;
		const no = element.getBoundingClientRect().top;
		const st = container.scrollTop;
		const y = no - container.getBoundingClientRect().top + st + ch / 2;

		container.scrollTop = Math.max(y, ch) - ch;
	};

	const getElements = (previousId: string, event: any) => {
		const { type, data } = event;
		const oldContextId = [rootId, previousId].join('-');

		let elements = [];
		switch (type) {
			case 'BlockAdd': {
				data.blocks.forEach(it => {
					elements = elements.concat([
						{ type: I.DiffType.None, element: `#block-${U.Common.esc(it.id)}` },
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

						// Find the first block before this one that still exists in newChildrenIds
						let afterId = '';
						for (let i = idx - 1; i >= 0; i--) {
							if (newChildrenIds.includes(oldChildrenIds[i])) {
								afterId = oldChildrenIds[i];
								break;
							};
						};

						if (afterId) {
							elements.push({ type: I.DiffType.Remove, element: `#block-${U.Common.esc(afterId)} > .wrapContent` });
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
					elements.push({ type, element: `#block-${U.Common.esc(data.id)}` });
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
			case 'BlockDataViewGroupOrderUpdate':
			case 'BlockDataViewObjectOrderUpdate': {
				break;
			};

			case 'BlockDataviewViewOrder': {
				elements = elements.concat([
					{ type: I.DiffType.None, element: `#block-${U.Common.esc(data.id)}` },
					{ type: I.DiffType.Change, element: `#block-${U.Common.esc(data.id)} #view-selector` },
					{ type: I.DiffType.Change, element: `#block-${U.Common.esc(data.id)} #views` },
				]);
				break;
			};

			case 'BlockDataviewViewUpdate': {
				elements.push({ type: I.DiffType.None, element: `#block-${U.Common.esc(data.id)}` });

				if (data.fields !== null) {
					elements = elements.concat([
						{ type: I.DiffType.Change, element: `#block-${U.Common.esc(data.id)} #view-selector` },
						{ type: I.DiffType.Change, element: `#view-item-${U.Common.esc(data.id)}-${U.Common.esc(data.viewId)}` },
					]);
				};

				if (data.relations.length) {
					elements.push({ type: I.DiffType.Change, element: `#block-${U.Common.esc(data.id)} #button-dataview-settings` });
				};

				if (data.filters.length) {
					elements.push({ type: I.DiffType.Change, element: `#block-${U.Common.esc(data.id)} #button-dataview-filter` });
				};

				if (data.sorts.length) {
					elements.push({ type: I.DiffType.Change, element: `#block-${U.Common.esc(data.id)} #button-dataview-sort` });
				};
				break;
			};

			case 'BlockDataviewRelationDelete':
			case 'BlockDataviewRelationSet': {
				elements = elements.concat([
					{ type: I.DiffType.None, element: `#block-${U.Common.esc(data.id)}` },
					{ type: I.DiffType.Change, element: `#block-${U.Common.esc(data.id)} #button-dataview-settings` },
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
						{ type: I.DiffType.Change, element: `#block-${U.Common.esc(J.Constant.blockId.title)}` },
						{ type: I.DiffType.Change, element: `.headSimple #editor-${U.Common.esc(J.Constant.blockId.title)}` }
					]);
				};

				if (undefined !== data.details.description) {
					elements.push({ type: I.DiffType.Change, element: `#block-${U.Common.esc(J.Constant.blockId.description)}` });
				};

				if ((undefined !== data.details.iconEmoji) || (undefined !== data.details.iconImage)) {
					elements.push({ type: I.DiffType.Change, element: `#block-icon-${U.Common.esc(data.id)}` });
				};

				if (undefined !== data.details.featuredRelations) {
					elements.push({ type: I.DiffType.Change, element: `#block-${U.Common.esc(J.Constant.blockId.featured)}` });
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
			{ type: I.DiffType.None, element: `#block-${U.Common.esc(id)}` },
			{ type: I.DiffType.Change, element: `#block-${U.Common.esc(id)} > .wrapContent` },
		];
	};

	const resize = () => {
		const node = nodeRef.current;
		const sideLeft = leftRef.current?.getNode() as HTMLElement;
		const sideRight = rightRef.current?.getNode() as HTMLElement;
		const editorWrapper = U.Dom.select('#editorWrapper', node) as HTMLElement;
		const cover = U.Dom.select('.block.blockCover', node) as HTMLElement;
		const container = U.Dom.getPageContainer(isPopup);
		const sc = U.Dom.getScrollContainer(isPopup);
		const header = U.Dom.select('#header', container) as HTMLElement;
		const height = sc?.clientHeight || 0;
		const hh = header?.clientHeight || 0;

		if (sideRight) {
			U.Dom.css(sideRight, { height: `${height}px` });
		};

		if (cover) {
			U.Dom.css(cover, { top: `${hh}px` });
		};

		if (isPopup) {
			const popupEl = U.Dom.select('.pageMainHistory.isPopup');
			if (popupEl) {
				U.Dom.css(popupEl, { height: `${height}px` });
			};
			if (sideLeft) {
				U.Dom.css(sideLeft, { height: `${height}px`, paddingTop: `${hh}px` });
			};
		} else
		if (sideLeft) {
			U.Dom.css(sideLeft, { height: `${height}px` });
		};

		if (editorWrapper) {
			U.Dom.css(editorWrapper, { width: !isSetOrCollection() ? `${getWrapperWidth()}px` : '' });
		};
	};

	const getWrapperWidth = (): number => {
		return getWidth(U.Data.getLayoutWidth(rootId));
	};

	const getWidth = (weight: number) => {
		weight = Number(weight) || 0;

		const sideLeft = leftRef.current?.getNode() as HTMLElement;
		const cw = sideLeft?.clientWidth || 0;

		let width = 0;

		if (isSetOrCollection()) {
			width = cw - 192;
		} else {
			const mw = cw - 96;
			width = Math.min(mw, J.Size.editor + (mw - J.Size.editor) * weight);
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

		U.Dom.eventDispatch(window, 'updateDataviewData');
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

});

export default PageMainHistory;