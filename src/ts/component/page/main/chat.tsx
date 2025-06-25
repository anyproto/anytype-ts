import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Deleted } from 'Component';
import { I, M, C, S, U, J, Action } from 'Lib';

const PageMainChat = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup, match } = props;
	const nodeRef = useRef(null);
	const headerRef = useRef(null);
	const idRef = useRef('');
	const blocksRef = useRef(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const rootId = props.rootId ? props.rootId : match?.params?.id;
	const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);
	const type = S.Record.getChatType();

	const open = () => {
		if (idRef.current == rootId) {
			return;
		};

		close();
		setIsLoading(true);

		idRef.current = rootId;

		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			setIsLoading(false);

			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
			if (object.isDeleted) {
				return;
			};

			headerRef.current?.forceUpdate();
			resize();
		});
	};

	const close = () => {
		const id = idRef.current;

		if (!id) {
			return;
		};

		const close = !isPopup || (rootId == id);

		if (close) {
			Action.pageClose(id, true);
		};
	};

	const isReadonly = () => {
		const root = S.Block.getLeaf(rootId, rootId);
		const object = S.Detail.get(rootId, rootId, []);

		return !U.Space.canMyParticipantWrite() || object.isArchived || root?.isLocked();
	};

	const resize = () => {
		if (isLoading) {
			return;
		};

		raf(() => {
			const node = $(nodeRef.current);
			const blocks = $(blocksRef.current);
			const scrollContainer = U.Common.getScrollContainer(isPopup);
			const scrollWrapper = node.find('#scrollWrapper');
			const formWrapper = node.find('#formWrapper').addClass('isFixed');
			const controls = node.find('.editorControls');
			const head = node.find('.headSimple');

			const fh = Number(formWrapper.outerHeight(true)) || 0;
			const ch = Number(controls.outerHeight(true)) || 0;
			const hh = Number(head.outerHeight(true)) || 0;
			const mh = scrollContainer.height() - J.Size.header - fh - ch - hh;

			scrollWrapper.css({ minHeight: mh });

			if (type && type.layoutWidth) {
				const pageContainer = U.Common.getPageContainer(isPopup);
				const mw = pageContainer.width();
				const size = mw * 0.6;
				const w = (mw - 96 - size) * type.layoutWidth;
				const width = Math.max(300, Math.max(size, Math.min(mw - 96, size + w)));

				blocks.css({ maxWidth: width });
			};
		});
	};

	useEffect(() => {
		return () => close();
	}, []);

	useEffect(() => {
		open();
		resize();
	});

	useImperativeHandle(ref, () => ({
		resize,
	}));

	let content = null;
	let inner = null;

	if (isLoading) {
		inner = <Loader id="loader" fitToContainer={true} isPopup={isPopup} />;
	} else {
		inner = (
			<div ref={blocksRef} className="blocks">
				<Block
					{...props}
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
		);
	};

	if (object.isDeleted) {
		content = <Deleted {...props} />;
	} else {
		content = (
			<div ref={nodeRef}>
				<Header 
					{...props} 
					component="mainChat" 
					ref={headerRef} 
					rootId={rootId} 
				/>

				<div id="bodyWrapper" className="wrapper">
					<div className="editorWrapper isChat">
						{inner}
					</div>
				</div>

				<Footer component="mainObject" {...props} />
			</div>
		);
	};

	return content;

}));

export default PageMainChat;