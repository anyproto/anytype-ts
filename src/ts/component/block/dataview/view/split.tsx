import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import raf from 'raf';
import { EditorPage, Icon, Loader } from 'Component';
import SidebarPageObjectRelation from 'Component/sidebar/page/object/relation';
import ViewList from './list';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const PADDING = 46;
const MIN_HEIGHT = 480;

/**
 * Split renders a master-detail layout: the record list on the left, the selected
 * object's page on the right.
 *
 * The container sizes itself to the viewport (the technique ViewGraph uses) so each
 * panel owns its own scroll. This matters because U.Dom.getScrollContainer resolves to a
 * single global element per namespace — letting the detail panel scroll the page itself
 * would fight the host collection for the same container.
 *
 * Panel width and the selected record are UI state only, persisted locally via
 * Lib/storage; the middleware view schema has no fields for them.
 */
const ViewSplit = forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

	const { rootId, block, className, isPopup, isInline, getView, getRecord, getRecords, loadData } = props;
	const nodeRef = useRef(null);
	const masterRef = useRef(null);
	const frame = useRef(0);
	const startX = useRef(0);
	const startWidth = useRef(0);
	const openedRef = useRef('');
	const openTimeout = useRef(0);
	const view = getView();
	const records = getRecords();
	const storageKey = Storage.getSplitViewKey(rootId, block.id, view.id);
	const [ selectedId, setSelectedId ] = useState(() => String(Storage.getSplitView(storageKey).selectedId || ''));
	const [ width, setWidth ] = useState(() => Number(Storage.getSplitView(storageKey).width) || J.Size.dataview.split.master.default);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ isPropertiesOpen, setIsPropertiesOpen ] = useState(() => !!Storage.getSplitView(storageKey).isPropertiesOpen);
	// className from the dataview root is already viewSplit — don't repeat it in the list.
	const cn = [ 'viewContent', 'viewSplit' ].concat((className && (className != 'viewSplit')) ? [ className ] : []);
	// Id of the properties wrapper, handed to the panel as getId so its DOM lookups stay
	// inside this pane. Scoped by block and namespace, since the same block can be mounted
	// in the page and in a popup at once.
	const propertiesId = U.String.toCamelCase(`splitProperties-${block.id}${isPopup ? '-popup' : ''}`);

	// A collection can contain itself — a page whose inline collection lists every page, or a
	// collection added to its own records. The host is selectable: the detail panel renders it
	// from the store data the host page already has open, and the dataview nested inside the
	// panel is masked out (the isInsideSplit gate in Block). What neither side may do is open or
	// close that object a second time — see open() below and EditorPage's own lifecycle guard.
	const isHostRecord = (id: string): boolean => id == rootId;

	// A record can vanish from the view while selected — filtered out, deleted, or the
	// stored id predating a change of filters. Fall back to the first record instead of
	// asking the middleware to open something that is no longer listed.
	const activeId = records.includes(selectedId) ? selectedId : String(records[0] || '');

	// Read the record from the dataview's own subscription rather than from the object's, which
	// only holds details once the panel has opened it. The row is already rendered from this
	// data, so layout is available before (and without) any open — which is what the chat
	// branch below depends on.
	const object = activeId ? getRecord(activeId) : null;
	const hasObject = !!object && !object._empty_;

	// Chat objects cannot render in the panel. They route to page/main/chat.tsx, never to
	// EditorPage, and their content is a synthetic BlockType.Chat block that page constructs
	// client-side — it exists in no store, so an embedded editor has nothing to draw. Beyond
	// that, BlockChat drives U.Dom.getScrollContainer, which resolves to the single global
	// page scroller and would fight the host collection for it. Show a placeholder and, more
	// importantly, never call ObjectOpen: for a chat the change-tree IS the message history,
	// which is why page/main/chat.tsx dropped that call in 8446cde734 (seconds of blocking).
	const isChatRecord = (id: string): boolean => U.Object.isChatLayout(getRecord(id).layout);

	const checkWidth = (v: number): number => {
		const { min, max } = J.Size.dataview.split.master;
		return Math.min(max, Math.max(min, Math.floor(v)));
	};

	const close = () => {
		if (openedRef.current) {
			// open() never records the host, so this only ever closes objects the panel itself
			// opened. Kept as a belt-and-braces guard against closing the host out from under
			// the page rendering it.
			if (!isHostRecord(openedRef.current)) {
				Action.pageClose(isPopup, openedRef.current, false);
			};
			openedRef.current = '';
		};
	};

	const open = (id: string) => {
		if (!id || (openedRef.current == id)) {
			return;
		};

		close();

		// The host page already has this object open; opening it again would hand its
		// subscription a second owner, and the matching close would tear it down under the
		// page still rendering it. Its blocks are already in the store, so the panel just renders.
		if (isHostRecord(id)) {
			return;
		};

		// The panel renders a placeholder for chats, so there is nothing to open — and opening
		// one would build its entire message CRDT tree just to throw the result away.
		if (isChatRecord(id)) {
			return;
		};

		setIsLoading(true);

		C.ObjectOpen(id, '', S.Common.space, (message: any) => {
			setIsLoading(false);

			if (!U.Common.checkErrorOnOpen(id, message.error.code)) {
				return;
			};

			openedRef.current = id;
		});
	};

	// Arrow-key navigation can move selection faster than objects open, so debounce the
	// open and drop any pending one on unmount.
	const openDebounced = (id: string) => {
		window.clearTimeout(openTimeout.current);
		openTimeout.current = window.setTimeout(() => open(id), 100);
	};

	const onSelect = (id: string) => {
		if (!id || (id == selectedId)) {
			return;
		};

		setSelectedId(id);
		Storage.setSplitView(storageKey, { selectedId: id });
	};

	// Claims a row click for the detail panel. Returning true tells ListRow to skip its
	// default U.Object.openConfig navigation — this is what makes clicking anywhere on the
	// row, including the empty space right of the title, select rather than navigate.
	const onRecordClick = (e: any, id: string): boolean => {
		onSelect(id);
		return true;
	};

	const onExpand = (e: any) => {
		if (!hasObject) {
			return;
		};

		if (keyboard.withCommand(e)) {
			U.Object.openEvent(e, object);
		} else {
			U.Object.openRoute(object);
		};
	};

	const onPropertiesToggle = (e: any) => {
		e.stopPropagation();

		const v = !isPropertiesOpen;

		setIsPropertiesOpen(v);
		Storage.setSplitView(storageKey, { isPropertiesOpen: v });
	};

	const onKeyDown = (e: any) => {
		// Never steal keys from the editor in the detail panel.
		if (keyboard.isFocused || !records.length) {
			return;
		};

		const idx = records.indexOf(activeId);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			e.preventDefault();

			const dir = pressed == 'arrowup' ? -1 : 1;
			const next = records[Math.min(records.length - 1, Math.max(0, idx + dir))];

			onSelect(next);
		});

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			onExpand(e);
		});
	};

	const mouseMoveHandler = useRef<(e: any) => void>(null);
	const mouseUpHandler = useRef<(e: any) => void>(null);

	const onResizeStart = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const master = masterRef.current;
		if (!master) {
			return;
		};

		startX.current = e.pageX;
		startWidth.current = master.offsetWidth;

		keyboard.disableSelection(true);
		keyboard.setResize(true);
		U.Dom.addClass(document.body, 'colResize');

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
		};

		mouseMoveHandler.current = (e: any) => onResizeMove(e);
		mouseUpHandler.current = (e: any) => onResizeEnd(e);

		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandler.current],
			['mouseup', mouseUpHandler.current],
		]);
	};

	const onResizeMove = (e: any) => {
		if (frame.current) {
			raf.cancel(frame.current);
		};

		frame.current = raf(() => {
			const master = masterRef.current;
			if (!master) {
				return;
			};

			// Applied straight to the node during the drag; committing to state on every
			// mousemove would re-render the embedded editor on each frame.
			U.Dom.css(master, { width: `${checkWidth(startWidth.current + e.pageX - startX.current)}px` });
		});
	};

	const onResizeEnd = (e: any) => {
		raf.cancel(frame.current);

		const w = checkWidth(startWidth.current + e.pageX - startX.current);

		setWidth(w);
		Storage.setSplitView(storageKey, { width: w });

		keyboard.disableSelection(false);
		keyboard.setResize(false);
		U.Dom.removeClass(document.body, 'colResize');

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
			mouseMoveHandler.current = null;
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
			mouseUpHandler.current = null;
		};
	};

	// Sizes the container to the viewport so each panel scrolls internally.
	const resize = () => {
		const node = nodeRef.current;
		if (!node || isInline) {
			return;
		};

		U.Dom.css(node, { width: '0px', height: '0px', marginLeft: '0px' });

		const container = U.Dom.getPageContainer(isPopup);
		const cw = container?.clientWidth ?? 0;
		const ch = container?.clientHeight ?? 0;
		const mw = cw - PADDING * 2;
		const margin = (cw - mw) / 2;
		const { top } = node.getBoundingClientRect();

		U.Dom.css(node, {
			width: `${cw}px`,
			height: `${Math.max(MIN_HEIGHT, ch - top - 2)}px`,
			marginLeft: `${-margin - 2}px`,
		});
	};

	useEffect(() => {
		U.Dom.addEvent(window, 'keydown', onKeyDown);

		return () => {
			U.Dom.removeEvent(window, 'keydown', onKeyDown);
		};
	});

	// Deliberately not on every render: resize() writes layout, and every mounted EditorPage
	// answers the global window resize that a re-render can trigger. Width is the only prop it
	// reads that changes after mount; drag-time sizing is applied straight to the node instead.
	useEffect(() => resize(), [ width ]);

	useEffect(() => {
		if (activeId) {
			openDebounced(activeId);
		};
	}, [ activeId ]);

	useEffect(() => {
		return () => {
			window.clearTimeout(openTimeout.current);
			raf.cancel(frame.current);
			close();
		};
	}, []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	let detail = null;
	if (!activeId) {
		detail = (
			<div className="splitDetailEmpty">
				<div className="label">{translate('blockDataviewSplitEmptyDetail')}</div>
			</div>
		);
	} else {
		// Chats render a placeholder, so there is no object in the store to read properties from.
		// The toggle survives loading — hiding it would make it flicker on every selection —
		// but the section itself waits, since it reads the object's own subscription.
		const withProperties = !isChatRecord(activeId);
		const isOpen = withProperties && isPropertiesOpen && !isLoading;
		const cni = [ 'splitDetailPropertiesToggle' ].concat(isPropertiesOpen ? [ 'active' ] : []);

		let properties = null;
		if (isOpen) {
			properties = (
				/*
				 * The right sidebar's own properties page, rendered in place. Only its content is
				 * reusable: the sidebar chrome around it is driven by S.Common.getRightSidebarState,
				 * a singleton keyed only by isPopup, so opening the real panel here would retarget
				 * the host page's sidebar at the panel's object. This component takes rootId as a
				 * prop, so it needs none of that. What it does need is the .sidebarPage classes —
				 * all of its styling is scoped under them, which is why the outer wrapper is a
				 * shared parent of that stylesheet — and getId, so its section toggles resolve
				 * against this instance instead of #sidebarRight.
				 */
				<div className="splitDetailProperties">
					<div id={propertiesId} className="sidebarPage pageObjectRelation">
						<SidebarPageObjectRelation
							key={`splitProperties-${activeId}`}
							rootId={activeId}
							isPopup={isPopup}
							page="object/relation"
							sidebarDirection={I.SidebarDirection.Right}
							getId={() => propertiesId}
						/>
					</div>
				</div>
			);
		};

		let body = null;
		if (isChatRecord(activeId)) {
			// The expand control above stays available, so the chat is one click from opening
			// as a full page — which is the only place its messages can render.
			body = (
				<div className="splitDetailUnsupported">
					<div className="label">{translate('blockDataviewSplitChatDetail')}</div>
				</div>
			);
		} else
		if (isLoading) {
			body = <Loader />;
		} else {
			body = (
				/*
				 * Only the PageComponent contract is passed — spreading the dataview props would
				 * leak view-level props into the editor. Deliberately no S.Common.refSet('editor' + ns)
				 * either: that ref is keyed only by isPopup and belongs to the host page's editor.
				 */
				<EditorPage
					key={`splitDetail-${activeId}`}
					rootId={activeId}
					isPopup={isPopup}
					isInsideSplit={true}
					isSecondaryView={isHostRecord(activeId)}
					afterHead={properties}
				/>
			);
		};

		detail = (
			<>
				{/*
				 * No name header: the embedded editor already renders the object's title, and a
				 * second copy of it read as a stray "Untitled" row. The controls instead float
				 * over the top-right of the pane, level with that title, and stay put while the
				 * pane scrolls.
				 */}
				<div className="splitDetailControls">
					{withProperties ? (
						<Icon
							className={cni.join(' ')}
							name="header/relation"
							withBackground={true}
							onClick={onPropertiesToggle}
							tooltipParam={{ text: translate('commonRelations'), typeY: I.MenuDirection.Bottom }}
						/>
					) : ''}

					<Icon
						className="splitDetailExpand"
						name="common/expand"
						withBackground={true}
						onClick={onExpand}
						tooltipParam={{ text: translate('commonOpenObject'), typeY: I.MenuDirection.Bottom }}
					/>
				</div>

				<div className="splitDetailBody">
					{body}
				</div>
			</>
		);
	};

	return (
		<div ref={nodeRef} className="wrap">
			<div className={cn.join(' ')}>
				<div ref={masterRef} className="splitMaster" style={{ width }}>
					<ViewList
						{...props}
						isInline={true}
						className="viewList splitMasterList"
						onRecordClick={onRecordClick}
					/>
				</div>

				<div className="resize-h" onMouseDown={onResizeStart}>
					<div className="resize-handle" />
				</div>

				<div className="splitDetail">
					{detail}
				</div>
			</div>
		</div>
	);

});

export default ViewSplit;
