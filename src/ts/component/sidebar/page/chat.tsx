import React, { forwardRef, useRef, useEffect, useState, memo } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { IconObject, ObjectName, Filter, Label, Icon } from 'Component';
import { I, U, S, J, keyboard, translate, Mark, sidebar } from 'Lib';

const LIMIT = 20;
const HEIGHT_ITEM = 64;

const SidebarPageChatBase = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { space } = S.Common;
	const [ filter, setFilter ] = useState('');
	const spaceview = U.Space.getSpaceview();

	const getItems = () => {
		let items = U.Menu.getVaultItems().map(it => {
			const list = S.Chat.getList(S.Chat.getSpaceSubId(it.targetSpaceId));

			let text = '';
			if (list.length) {
				const last = list[list.length - 1];
				if (last) {
					const participantId = U.Space.getParticipantId(it.targetSpaceId, last.creator);
					const author = last.dependencies.find(it => it.id == participantId);

					if (author) {
						text = `${author.name}: `;
					};

					if (last.content.text) {
						text += U.Common.sanitize(Mark.toHtml(last.content.text, last.content.marks));
						text = text.replace(/\n\r?/g, ' ');
					} else 
					if (last.attachments.length) {
						const names = last.attachments.map(id => {
							const object = last.dependencies.find(it => it.id == id);
							return object ? U.Object.name(object) : '';
						}).filter(it => it).join(', ');

						text += names;
					};
				};
			};

			it.lastMessage = text;
			it.counters = S.Chat.getSpaceCounters(it.targetSpaceId);
			return it;
		});

		if (filter) {
			const reg = new RegExp(U.Common.regexEscape(filter), 'gi');
			items = items.filter(it => it.name.match(reg) || it.lastMessage.match(reg));
		};

		return items;
	};

	const items = getItems();
	const listRef = useRef<List>(null);
	const filterRef = useRef(null);
	const timeout = useRef(0);
	const cache = new CellMeasurerCache({
		defaultHeight: HEIGHT_ITEM,
		fixedWidth: true,
		keyMapper: index => items[index].id,
	});

	const onClick = (item: any) => {
		if (item.targetSpaceId != S.Common.space) {
			U.Router.switchSpace(item.targetSpaceId, '', true, { replace: true, animate: true }, false);
		} else {
			U.Space.openDashboard();
		};
	};

	const onOver = (item: any) => {
		if (!keyboard.isMouseDisabled) {
			unsetActive();
			setHover(item);
		};
	};

	const onOut = () => {
		if (!keyboard.isMouseDisabled) {
			unsetHover();
			setActive(spaceview);
		};
	};

	const setActive = (item: any) => {
		unsetActive();

		if (item) {
			$('#sidebarPageChat').find(`#item-${item.id}`).addClass('active');
		};
	};

	const unsetActive = () => {
		$('#sidebarPageChat').find('.item.active').removeClass('active');
	};

	const setHover = (item: any) => {
		if (item) {
			$('#sidebarPageChat').find(`#item-${item.id}`).addClass('hover');
		};
	};

	const unsetHover = () => {
		$('#sidebarPageChat').find('.item.hover').removeClass('hover');
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			if (filter != v) {
				setFilter(v);
			};
		}, J.Constant.delay.keyboard);
	};

	const onFilterClear = () => {
		setFilter('');
	};

	const Item = (item: any) => {
		let cnt = null;
		if (item.counters.mentionCounter) {
			cnt = <Icon className="mention" />;
		} else 
		if (item.counters.messageCounter) {
			cnt = item.counters.messageCounter;
		};

		return (
			<div 
				id={`item-${item.id}`}
				className="item"
				style={item.style} 
				onClick={() => onClick(item)}
				onMouseOver={() => onOver(item)}
				onMouseOut={onOut}
			>
				<IconObject object={item} size={48} iconSize={48} canEdit={false} />
				<div className="info">
					<div className="nameWrapper">
						<ObjectName object={item} />
						{cnt ? <div className="cnt">{cnt}</div> : ''}
					</div>
					<Label text={item.lastMessage} />
				</div>
			</div>
		);
	};

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];
		if (!item) {
			return null;
		};

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache}
				columnIndex={0}
				rowIndex={param.index}
			>
				<Item
					{...item}
					index={param.index}
					style={param.style}
				/>
			</CellMeasurer>
		);
	};

	useEffect(() => {
		raf(() => setActive(spaceview));
	}, [ space ]);

	return (
		<>
			<div className="head">
				<div className="name">{translate('commonChats')}</div>
			</div>
			<div className="filterWrapper">
				<Filter 
					ref={filterRef}
					icon="search"
					className="outlined"
					placeholder={translate('commonSearch')}
					onChange={onFilterChange}
					onClear={onFilterClear}
				/>
			</div>
			<div className="body">
				<InfiniteLoader
					rowCount={items.length + 1}
					loadMoreRows={() => {}}
					isRowLoaded={({ index }) => true}
					threshold={LIMIT}
				>
					{({ onRowsRendered }) => (
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<List
									ref={listRef}
									width={width}
									height={height}
									deferredMeasurmentCache={cache}
									rowCount={items.length}
									rowHeight={HEIGHT_ITEM}
									rowRenderer={rowRenderer}
									onRowsRendered={onRowsRendered}
									overscanRowCount={10}
									scrollToAlignment="center"
									onScroll={() => {}}
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>
		</>
	);

}));

const SidebarPageChat = memo(SidebarPageChatBase);

export default SidebarPageChat;