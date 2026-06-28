import React, { forwardRef, useRef, useEffect, useState, DragEvent, useImperativeHandle } from 'react';
import { Header, Footer, Block, Deleted } from 'Component';
import { I, M, C, S, U, J } from 'Lib';

const PageMainChat = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const nodeRef = useRef(null);
	const headerRef = useRef(null);
	const idRef = useRef('');
	const blocksRef = useRef(null);
	const chatRef = useRef(null);
	const [ dummy, setDummy ] = useState(0);
	const rootId = keyboard.getRootId(isPopup);
	const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);
	const keydownHandlerRef = useRef<((e: any) => void) | null>(null);
	const scrollToMessageHandlerRef = useRef<((e: any) => void) | null>(null);

	const unbind = () => {
		if (keydownHandlerRef.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandlerRef.current);
			keydownHandlerRef.current = null;
		};
		if (scrollToMessageHandlerRef.current) {
			U.Dom.removeEvent(window, 'scrollToMessage', scrollToMessageHandlerRef.current);
			scrollToMessageHandlerRef.current = null;
		};
	};

	const rebind = () => {
		unbind();
		keydownHandlerRef.current = (e: any) => onKeyDown(e);
		scrollToMessageHandlerRef.current = (e: CustomEvent) => {
			const { id } = e.detail;
			chatRef.current?.getChildNode()?.loadAndScrollToMessage(id);
		};
		U.Dom.addEvents(window, [
			['keydown', keydownHandlerRef.current],
			['scrollToMessage', scrollToMessageHandlerRef.current],
		]);
	};

	const open = () => {
		idRef.current = rootId;

		// A chat object's change-tree IS its full message history, so ObjectOpen would build and
		// validate the entire CRDT tree before anything renders — seconds of blocking for a big chat.
		// The chat <Block> renders messages on its own via ChatSubscribeLastMessages (served from the
		// backend's materialized store, no tree needed), so here we only need the object's details.
		// Load them with a lightweight subscription instead of opening the object. Space-layout objects
		// also route to this page and still need the full open (small tree; lifecycle relies on it).
		const keys = J.Relation.default.concat([ 'chatId', 'analyticsChatId' ]);

		U.Subscription.subscribeIds({ subId: rootId, ids: [ rootId ], keys, noDeps: false }, (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, [ 'analyticsChatId', 'layout' ]);
			if (object.isDeleted) {
				return;
			};

			if (object.layout == I.ObjectLayout.Space) {
				C.ObjectOpen(rootId, '', S.Common.space);
			} else {
				// Chat-layout objects skip ObjectOpen (which is what records the last-opened
				// object), so record here — otherwise switching spaces and back forgets the
				// open chat and reopens the previously opened page (JS-9821).
				U.Space.setLastObject(object, S.Common.space);
			};

			S.Common.setRightSidebarState(isPopup, { rootId });
			headerRef.current?.forceUpdate();
			chatRef.current?.getChildNode()?.forceUpdate();

			Onboarding.startChat(isPopup);
			setDummy(dummy + 1);
			analytics.event('ScreenChat', { chatId: object.analyticsChatId });
		});
	};

	const close = () => {
		// Only send ObjectClose for objects we actually opened (Space layout); chat objects were
		// never opened, only subscribed — pageClose still tears down that subscription via destroyList.
		const object = S.Detail.get(idRef.current, idRef.current, [ 'layout' ]);

		Action.pageClose(isPopup, idRef.current, object.layout == I.ObjectLayout.Space);
		idRef.current = '';
	};

	const isReadonly = () => {
		const root = S.Block.getLeaf(rootId, rootId);
		const object = S.Detail.get(rootId, rootId, []);

		return !U.Space.canMyParticipantWrite() || object.isArchived || root?.isLocked();
	};

	const onDragOver = (e: DragEvent) => {
		chatRef.current?.getChildNode()?.onDragOver(e);
	};
	
	const onDragLeave = (e: DragEvent) => {
		chatRef.current?.getChildNode()?.onDragLeave(e);
	};
	
	const onDrop = (e: DragEvent) => {
		chatRef.current?.getChildNode()?.onDrop(e);
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('chatObject', e, () => {
			if (!S.Menu.isOpen('searchObject')) {
				e.preventDefault();

				chatRef.current?.getChildNode()?.getFormRef()?.onAttachment();
			};
		});
	};

	const resize = () => {
		chatRef.current?.getChildNode()?.resize();
	};

	useEffect(() => {
		open();
		rebind();

		return () => {
			close();
			unbind();
		};
	}, []);

	useEffect(() => {
		if (idRef.current != rootId) {
			close();
			open();
		};
	}, [ rootId ]);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	let content = null;

	if (object.isDeleted) {
		content = <Deleted {...props} />;
	} else {
		content = (
			<>
				<Header
					{...props}
					component="mainChat"
					ref={headerRef}
					rootId={rootId}
				/>

				<div
					ref={nodeRef}
					className="wrapper"
					onDragOver={onDragOver}
					onDragLeave={onDragLeave}
					onDrop={onDrop}
				>
					<div className="editorWrapper isChat">
						<div ref={blocksRef} className="blocks">
							<Block
								{...props}
								ref={chatRef}
								key={J.Constant.blockId.chat}
								rootId={rootId}
								iconSize={20}
								block={new M.Block({ id: J.Constant.blockId.chat, type: I.BlockType.Chat, childrenIds: [], fields: {}, content: {} })}
								className="noPlus"
								isSelectionDisabled={true}
								isContextMenuDisabled={true}
								readonly={isReadonly()}
							/>
						</div>
					</div>
				</div>

				<Footer component="mainObject" {...props} />
			</>
		);
	};

	return content;

});

export default PageMainChat;