import {observer} from 'mobx-react';
import * as React from 'react';
import {C, I, S} from "Lib";
import {
	useInfiniteQuery,
} from '@tanstack/react-query';
import Model from 'dist/lib/pkg/lib/pb/model/protos/models_pb';
import {useRef, useCallback, useLayoutEffect, useState, useEffect} from "react";
import {useVirtualizer, type Virtualizer, type VirtualizerOptions} from "@tanstack/react-virtual";
import Message from "Component/block/chat/message";

enum FetchPageType {
	AfterOrderId,
	BeforeOrderId
}

type PageParam = {
	type: FetchPageType,
	orderId: string,
}


function getChatId (rootId: string): string {
	const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);
	return object.chatId || '';
};


const BlockChat = observer((props: { ref } & I.BlockComponent) => {
	const chatId = getChatId(props.rootId);
	const parentRef = useRef(null);
	const [messages, setMessages] = useState<Array<I.ChatMessage>>([]);

	const loadingRef = useRef(false);
	const fetchMessages = useCallback((pageParam: PageParam) => {
		if (chatId == '') {
			return;
		}
		if (loadingRef.current) {
			return;
		}
		loadingRef.current = true;
		if (pageParam.type === FetchPageType.BeforeOrderId) {
			C.ChatGetMessages(chatId, pageParam.orderId, '', 20, false, (message: any) => {
				const newMessages = message.messages as Array<I.ChatMessage>;
				setMessages((messages) => ([...newMessages, ...messages]));
				loadingRef.current = false;
			});
		} else {
			C.ChatGetMessages(chatId, '', pageParam.orderId, 10, false, (message: any) => {
				const newMessages = message.messages as Array<I.ChatMessage>;
				setMessages((messages) => ([...messages, ...newMessages]));
				loadingRef.current = false;
			});
		}
	}, []);

	const rowVirtualizer = useVirtualizer({
		count: messages.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 100,
		getItemKey: useCallback((index) => messages[index].id, [messages]),
		onChange: (...args) => {
			onChange(...args);
		},
	});

	const { onChange, keepBottomDistance } =
		useKeepBottomDistance(rowVirtualizer);

	// auto load more when component mounted
	const autoLoadedDataRef = useRef(false);
	useEffect(() => {
		if (autoLoadedDataRef.current) return;
		autoLoadedDataRef.current = true;
		fetchMessages({type: FetchPageType.AfterOrderId, orderId: ''});
	}, [fetchMessages]);


	const autoScolledToBottomRef = useRef(false);
	// load more when top reached
	const [firstItem] = rowVirtualizer.getVirtualItems();
	useEffect(() => {
		if (!autoScolledToBottomRef.current) return;
		if (firstItem) {
			if (firstItem.index === 0) {
				fetchMessages({type: FetchPageType.BeforeOrderId, orderId: messages[0].orderId})
			}
		}
	}, [fetchMessages, firstItem, autoScolledToBottomRef]);

	// scroll to bottom when initial data loaded
	useLayoutEffect(() => {
		if (messages.length === 0 || autoScolledToBottomRef.current) return;
		rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
		setTimeout(() => {
			autoScolledToBottomRef.current = true;
		}, 100);
	}, [messages.length, rowVirtualizer]);

	// keep bottom distance when data length changed
	const prevDataLenghtRef = useRef(messages.length);
	useLayoutEffect(() => {
		if (messages.length > prevDataLenghtRef.current) {
			keepBottomDistance();
		}
		prevDataLenghtRef.current = messages.length;
	}, [messages.length, keepBottomDistance]);


	return (
		<div
			ref={parentRef}
			className="List"
			style={{
				height: `800px`,
				width: `100%`,
				overflow: 'auto',
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const post = messages[virtualRow.index]

					return (
						<div
							key={virtualRow.key as string}
							className={
								virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'
							}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<Message
								{...props}
								id={post.id}
								rootId={props.rootId}
								message={post}
							/>
						</div>
					)
				})}
			</div>
		</div>
	);
});

export default BlockChat;

function useKeepBottomDistance<
	TScrollElement extends Element | Window,
	TItemElement extends Element
>(virtualizer: Virtualizer<TScrollElement, TItemElement>) {
	const prevBottomDistanceRef = useRef(0);

	const onChange: VirtualizerOptions<TScrollElement, TItemElement>['onChange'] =
		useCallback(
			(instance: Virtualizer<TScrollElement, TItemElement>, sync: boolean) => {
				if (!sync) return;
				prevBottomDistanceRef.current =
					instance.getTotalSize() - (instance.scrollOffset ?? 0);
			},
			[]
		);

	const keepBottomDistance = useCallback(() => {
		const totalSize = virtualizer.getTotalSize();
		virtualizer.scrollToOffset(totalSize - prevBottomDistanceRef.current, {
			align: 'start',
		});
		// NOTE: This line is required to make "position keepping" works in my real project,
		//       But it seems fine here without it.
		//       I don't have time to dig into it, but very curious about the reason,
		//       plz comment if you find out.
		// virtualizer.scrollOffset = totalSize - prevBottomDistanceRef.current;
	}, [virtualizer]);

	return {
		onChange,
		keepBottomDistance,
	};
}
