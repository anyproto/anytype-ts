import React, { forwardRef, useRef, useEffect, useState, DragEvent } from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Block, Deleted } from 'Component';
import { I, M, C, S, U, J, Action, keyboard, Onboarding } from 'Lib';

const PageMainChat = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const nodeRef = useRef(null);
	const headerRef = useRef(null);
	const idRef = useRef('');
	const blocksRef = useRef(null);
	const chatRef = useRef<any>(null);
	const [ dummy, setDummy ] = useState(0);
	const rootId = keyboard.getRootId(isPopup);
	const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);

	const open = () => {
		idRef.current = rootId;
		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
			if (object.isDeleted) {
				return;
			};

			headerRef.current?.forceUpdate();
			chatRef.current?.ref?.forceUpdate();
			setDummy(dummy + 1);
		});
	};

	const close = () => {
		Action.pageClose(isPopup, idRef.current, true);
		idRef.current = '';
	};

	const isReadonly = () => {
		const root = S.Block.getLeaf(rootId, rootId);
		const object = S.Detail.get(rootId, rootId, []);

		return !U.Space.canMyParticipantWrite() || object.isArchived || root?.isLocked();
	};

	const onDragOver = (e: DragEvent) => {
		chatRef.current?.ref?.onDragOver(e);
	};
	
	const onDragLeave = (e: DragEvent) => {
		chatRef.current?.ref?.onDragLeave(e);
	};
	
	const onDrop = (e: React.DragEvent) => {
		chatRef.current?.ref?.onDrop(e);
	};

	useEffect(() => {
		open();
		Onboarding.startChat(isPopup);

		return () => close();
	}, []);

	useEffect(() => {
		if (idRef.current != rootId) {
			close();
			open();
		};
	}, [ rootId ]);

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

}));

export default PageMainChat;
