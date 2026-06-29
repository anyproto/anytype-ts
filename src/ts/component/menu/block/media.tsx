import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { Cover, Filter, Icon, Label, EmptySearch, Loader, Input, IconObject, ObjectName } from 'Component';
import * as I from 'Interface';

enum Tab {
	Upload	 = 0,
	Library	 = 1,
	Unsplash = 2,
};

const LIMIT = 36;

const MenuBlockMedia = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { rootId, blockId, type } = data;

	const fileType: I.FileType = type ?? I.FileType.Image;
	const isImage = fileType == I.FileType.Image;
	const isPreview = isImage;
	const hasUnsplash = isImage;

	const tabs = (() => {
		const list: { id: Tab }[] = [ { id: Tab.Upload }, { id: Tab.Library } ];
		if (hasUnsplash) {
			list.push({ id: Tab.Unsplash });
		};
		return list.map(it => ({ ...it, name: translate(`menuBlockMedia${Tab[it.id]}`) }));
	})();

	const [ filter, setFilter ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ tab, setTab ] = useState(tabs[0].id);
	const [ items, setItems ] = useState([]);
	const nodeRef = useRef(null);
	const filterRef = useRef(null);
	const urlRef = useRef(null);
	const listRef = useRef(null);
	const dropzoneRef = useRef(null);
	const timeout = useRef(0);
	const active = useRef(null);
	const activeIndex = useRef(-1);
	const rows: any[] = [];
	const isListLibrary = (tab == Tab.Library) && !isPreview;
	const itemsPerRow = isListLibrary ? 1 : 3;

	const layoutByType: Record<I.FileType, I.ObjectLayout> = {
		[I.FileType.None]: I.ObjectLayout.File,
		[I.FileType.File]: I.ObjectLayout.File,
		[I.FileType.Image]: I.ObjectLayout.Image,
		[I.FileType.Video]: I.ObjectLayout.Video,
		[I.FileType.Audio]: I.ObjectLayout.Audio,
		[I.FileType.Pdf]: I.ObjectLayout.Pdf,
	};

	const acceptByType: Record<I.FileType, string[]> = {
		[I.FileType.None]: [],
		[I.FileType.File]: [],
		[I.FileType.Image]: J.Constant.fileExtension.image,
		[I.FileType.Video]: J.Constant.fileExtension.video,
		[I.FileType.Audio]: J.Constant.fileExtension.audio,
		[I.FileType.Pdf]: J.Constant.fileExtension.pdf,
	};

	useEffect(() => {
		load();
		rebind();
		keyboard.disablePaste(true);

		return () => {
			unbind();
			keyboard.disablePaste(false);
			window.clearTimeout(timeout.current);
		};
	}, []);

	useEffect(() => {
		load();
	}, [ filter, tab ]);

	useEffect(() => {
		rebind();

		if ([ Tab.Library, Tab.Unsplash ].includes(tab)) {
			window.setTimeout(() => filterRef.current?.focus(), 15);
		};

		return () => {
			unbind();
		};
	}, [ filter, tab, items ]);

	const pasteHandler = useRef<((e: any) => void) | null>(null);
	const keydownHandler = useRef<((e: any) => void) | null>(null);

	const unbind = () => {
		if (pasteHandler.current) {
			U.Dom.removeEvent(window, 'paste', pasteHandler.current);
		};
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
		};
	};

	const rebind = () => {
		unbind();
		pasteHandler.current = e => onPaste(e);
		keydownHandler.current = e => onKeyDown(e);
		U.Dom.addEvents(window, [
			[ 'paste', pasteHandler.current ],
			[ 'keydown', keydownHandler.current ],
		]);
	};

	const load = () => {
		if (![ Tab.Unsplash, Tab.Library ].includes(tab)) {
			setIsLoading(false);
			return;
		};

		switch (tab) {
			case Tab.Unsplash: {
				setIsLoading(true);

				C.UnsplashSearch(filter, LIMIT, (message: any) => {
					setIsLoading(false);

					if (message.error.code) {
						setItems([]);
						return;
					};

					setItems(message.pictures.map((item: any) => ({
						id: item.id,
						itemId: item.id,
						type: I.CoverType.Source,
						src: item.url,
						artist: item.artist,
					})));
				});
				break;
			};

			case Tab.Library: {
				const filters: I.Filter[] = [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: layoutByType[fileType] },
				];
				const sorts = [
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
					{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
				];

				setIsLoading(true);

				U.Subscription.search({
					filters,
					sorts,
					fullText: filter,
					limit: 1000,
				}, (message: any) => {
					setIsLoading(false);

					if (message.error.code) {
						setItems([]);
						return;
					};

					setItems(message.records.map((item: any) => ({
						id: item.id,
						itemId: item.id,
						type: I.CoverType.Upload,
						src: isImage ? S.Common.imageUrl(item.id, I.ImageSize.Medium) : '',
						artist: item.name,
						object: item,
						coverY: -0.25,
					})));
				});
				break;
			};
		};
	};

	const onUploadHandler = () => {
		Action.openFileDialog({ extensions: acceptByType[fileType] }, paths => {
			if (!paths.length) {
				return;
			};

			close();
			Action.upload(fileType, rootId, blockId, '', paths[0]);
		});
	};

	const onSelectHandler = (e: any, item: any) => {
		if (tab == Tab.Unsplash) {
			C.UnsplashDownload(S.Common.space, item.itemId, '', '', (message: any) => {
				if (!message.error.code && message.objectId) {
					C.BlockFileSetTargetObjectId(rootId, blockId, message.objectId);
				};
			});
		} else
		if (tab == Tab.Library) {
			C.BlockFileSetTargetObjectId(rootId, blockId, item.itemId);
		};

		analytics.event('UploadMedia', { type: fileType });
		close();
	};

	const onUrlSubmit = () => {
		const url = String(urlRef.current?.getValue() || '').trim();
		if (!url) {
			return;
		};

		close();
		Action.upload(fileType, rootId, blockId, url, '');
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => setFilter(v), J.Constant.delay.keyboard);
	};

	const getSections = () => {
		const sections: any[] = [];

		switch (tab) {
			case Tab.Library:
			case Tab.Unsplash: {
				if (items.length) {
					sections.push({ children: items });
				};
				break;
			};
		};

		return U.Menu.sectionsMap(sections);
	};

	const onDragOver = (e: any) => {
		if (U.File.checkDropFiles(e)) {
			U.Dom.addClass(dropzoneRef.current, 'isDraggingOver');
		};
	};

	const onDragLeave = (e: any) => {
		if (U.File.checkDropFiles(e)) {
			U.Dom.removeClass(dropzoneRef.current, 'isDraggingOver');
		};
	};

	const onDrop = (e: any) => {
		if (!U.File.checkDropFiles(e)) {
			return;
		};

		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);

		U.Dom.removeClass(dropzoneRef.current, 'isDraggingOver');
		keyboard.disableCommonDrop(true);
		close();

		Action.upload(fileType, rootId, blockId, '', file);
		keyboard.disableCommonDrop(false);
	};

	const onKeyDown = (e: any) => {
		e.stopPropagation();
		keyboard.disableMouse(true);

		if ([ Tab.Library, Tab.Unsplash ].includes(tab)) {
			keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
				e.preventDefault();

				filterRef.current?.blur();
				onArrowVertical(pressed == 'arrowup' ? -1 : 1);
			});

			keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
				if (filterRef.current?.isFocused()) {
					return;
				};

				e.preventDefault();
				filterRef.current?.blur();
				onArrowHorizontal(pressed == 'arrowleft' ? -1 : 1);
			});
		};

		keyboard.shortcut('tab', e, () => {
			let idx = tabs.findIndex(it => it.id == tab) + 1;

			if (idx >= tabs.length) {
				idx = 0;
			};

			setTab(tabs[idx].id);
		});

		if (active.current && [ Tab.Library, Tab.Unsplash ].includes(tab)) {
			keyboard.shortcut('enter', e, () => {
				e.preventDefault();

				onSelectHandler(e, active.current);
			});
		};
	};

	const onArrowVertical = (dir: number) => {
		const items = getItemsFlat();

		if (items.length === 0) {
			return;
		};

		if (activeIndex.current < 0) {
			activeIndex.current = 0;
			setActive(items[0], 0, true);
			return;
		};

		const currentRow = Math.floor(activeIndex.current / itemsPerRow);
		const currentCol = activeIndex.current % itemsPerRow;
		const totalRows = Math.ceil(items.length / itemsPerRow);

		let newRow = currentRow + dir;

		if (newRow < 0) {
			newRow = totalRows - 1;
		} else
		if (newRow >= totalRows) {
			newRow = 0;
		};

		let newIndex = newRow * itemsPerRow + currentCol;

		if (newIndex >= items.length) {
			newIndex = items.length - 1;
		};

		activeIndex.current = newIndex;
		setActive(items[newIndex], newIndex, true);
	};

	const onArrowHorizontal = (dir: number) => {
		const items = getItemsFlat();

		if (items.length === 0) {
			return;
		};

		if (activeIndex.current < 0) {
			activeIndex.current = 0;
			setActive(items[0], 0, true);
			return;
		};

		const currentRow = Math.floor(activeIndex.current / itemsPerRow);
		const currentCol = activeIndex.current % itemsPerRow;

		let newCol = currentCol + dir;
		let newRow = currentRow;

		if (newCol < 0) {
			newRow -= 1;
			if (newRow < 0) {
				newRow = Math.ceil(items.length / itemsPerRow) - 1;
			};
			newCol = itemsPerRow - 1;
		} else
		if (newCol >= itemsPerRow) {
			newRow += 1;
			if (newRow >= Math.ceil(items.length / itemsPerRow)) {
				newRow = 0;
			};
			newCol = 0;
		};

		let newIndex = newRow * itemsPerRow + newCol;

		if (newIndex >= items.length) {
			if (dir > 0) {
				newIndex = 0;
			} else {
				newIndex = items.length - 1;
			};
		};

		activeIndex.current = newIndex;
		setActive(items[newIndex], newIndex, true);
	};

	const setActive = (item: any, index: number, scroll: boolean) => {
		const node = nodeRef.current;

		U.Dom.selectAll('.item.hover', node).forEach(el => U.Dom.removeClass(el, 'hover'));

		active.current = item;
		if (index !== undefined) {
			activeIndex.current = index;
		};

		if (!item) {
			return;
		};

		const element = U.Dom.select(`#item-${U.Common.esc(item.id)}`, node);
		U.Dom.addClass(element, 'hover');

		if (!scroll || !listRef.current || (index === undefined)) {
			return;
		};

		const itemRow = Math.floor(index / itemsPerRow);
		const sections = getSections();

		let virtualRow = itemRow;
		let itemCount = 0;

		for (const section of sections) {
			if (section.name) {
				virtualRow++;
			};

			const sectionItemCount = (section.children || []).length;
			if (itemCount + sectionItemCount > index) {
				break;
			};

			itemCount += sectionItemCount;
		};

		listRef.current.scrollToRow(Math.max(0, virtualRow));
	};

	const onMouseEnter = (e: any, item: any, index: number) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, index, false);
		};
	};

	const onMouseLeave = () => {
		if (!keyboard.isMouseDisabled) {
			setActive(null, -1, false);
		};
	};

	const getRowHeight = (row: any, index: number) => {
		if (row.isSection) {
			return index ? 40 : 32;
		};

		if (isListLibrary) {
			return 40;
		};

		return 96;
	};

	const getItemsFlat = () => {
		const sections = getSections();
		const flatItems: any[] = [];
		let globalIndex = 0;

		sections.forEach((section: any) => {
			const children = section.children || [];

			for (let i = 0; i < children.length; i++) {
				flatItems.push({ ...children[i], __globalIndex: globalIndex });
				globalIndex++;
			};
		});

		return flatItems;
	};

	const onPaste = (e: any) => {
		const files = U.Common.getDataTransferFiles(e.clipboardData.items);

		if (!files.length) {
			return;
		};

		U.Common.saveClipboardFiles(files, {}, (clip: any) => {
			if (!clip.files.length) {
				return;
			};

			close();
			Action.upload(fileType, rootId, blockId, '', clip.files[0].path);
		});
	};

	const TileItem = ({ item }: { item: any }) => (
		<div
			id={`item-${item.id}`}
			className="item"
			onClick={e => onSelectHandler(e, item)}
			onMouseEnter={e => onMouseEnter(e, item, item.__globalIndex)}
			onMouseLeave={() => onMouseLeave()}
		>
			{item.src ? (
				<Cover {...item} id={item.itemId} />
			) : (
				<div className="cover empty">
					{item.object ? <IconObject object={item.object} size={32} /> : ''}
				</div>
			)}
			{item.artist ? <div className="name">{item.artist}</div> : ''}
		</div>
	);

	const ListItem = ({ item }: { item: any }) => (
		<div
			id={`item-${item.id}`}
			className="item objectItem"
			onClick={e => onSelectHandler(e, item)}
			onMouseEnter={e => onMouseEnter(e, item, item.__globalIndex)}
			onMouseLeave={() => onMouseLeave()}
		>
			<IconObject object={item.object} size={20} />
			<ObjectName object={item.object} />
		</div>
	);

	const Item = ({ item }: { item: any }) => (
		isListLibrary ? <ListItem item={item} /> : <TileItem item={item} />
	);

	const rowRenderer = (param: any) => {
		const row = rows[param.index];

		if (row.isSection) {
			return (
				<div key={param.key} style={param.style} className="sectionName">
					{row.name}
				</div>
			);
		};

		return (
			<div key={param.key} style={param.style} className="itemsRow">
				{row.children.map((item: any, i: number) => (
					<Item key={i} item={item} />
				))}
			</div>
		);
	};

	const sections = getSections();

	let content = null;
	let filterElement = null;
	let globalIndex = 0;

	sections.forEach((section: any) => {
		if (section.name) {
			rows.push({ isSection: true, name: section.name });
		};

		const children = section.children || [];

		let rowItems: any[] = [];

		for (let i = 0; i < children.length; i++) {
			const itemWithIndex = { ...children[i], __globalIndex: globalIndex };

			globalIndex++;
			rowItems.push(itemWithIndex);

			if ((rowItems.length == itemsPerRow) || (i == children.length - 1)) {
				rows.push({ isSection: false, children: rowItems });
				rowItems = [];
			};
		};
	});

	if ([ Tab.Unsplash, Tab.Library ].includes(tab)) {
		filterElement = (
			<Filter
				ref={filterRef}
				value={filter}
				onChange={onFilterChange}
				focusOnMount={true}
			/>
		);
	};

	if (isLoading) {
		content = <Loader />;
	} else {
		switch (tab) {
			case Tab.Unsplash:
			case Tab.Library: {
				const flatItems = getItemsFlat();
				const empty = filter ? U.String.sprintf(translate('menuBlockMediaEmptyFilter'), filter) : translate('menuBlockMediaEmpty');

				if (!flatItems.length) {
					content = <EmptySearch text={empty} />;
					break;
				};

				content = isListLibrary ? (
					<div className="sections">
						<div className="scrollArea list">
							{flatItems.map((item: any) => (
								<Item key={item.id} item={item} />
							))}
						</div>
					</div>
				) : (
					<div className="sections">
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<List
									ref={listRef}
									width={width}
									height={height}
									rowCount={rows.length}
									rowHeight={({ index }) => getRowHeight(rows[index], index)}
									rowRenderer={rowRenderer}
									overscanRowCount={5}
									scrollToAlignment="center"
								/>
							)}
						</AutoSizer>
					</div>
				);
				break;
			};

			case Tab.Upload: {
				content = (
					<>
						<div
							ref={dropzoneRef}
							className="dropzone"
							onDragOver={onDragOver}
							onDragLeave={onDragLeave}
							onDrop={onDrop}
							onClick={onUploadHandler}
						>
							<Icon name="common/upload" size={28} />
							<Label text={translate(`menuBlockMediaChoose${I.FileType[fileType]}`)} />
						</div>

						<div className="urlSection">
							<Label text={translate('menuBlockMediaOrAddViaUrl')} />
							<form className="urlField" onSubmit={e => { e.preventDefault(); onUrlSubmit(); }}>
								<Icon name="common/link" />
								<Input
									ref={urlRef}
									onKeyDown={(e: any) => e.stopPropagation()}
									placeholder={translate(`menuBlockMediaUrlPlaceholder${I.FileType[fileType]}`)}
								/>
							</form>
						</div>
					</>
				);
				break;
			};
		};
	};

	return (
		<div ref={nodeRef} className="wrap">
			{tabs.length > 1 ? (
				<div className="head">
					{tabs.map((item: any) => {
						const cn = [ 'btn' ];

						if (item.id == tab) {
							cn.push('active');
						};

						return (
							<div
								key={item.id}
								className={cn.join(' ')}
								onClick={() => setTab(item.id)}
							>
								{item.name}
							</div>
						);
					})}
				</div>
			) : ''}

			<div className={[ 'body', Tab[tab].toLowerCase(), (isListLibrary ? 'list' : '') ].join(' ')}>
				{filterElement}
				{content}
			</div>
		</div>
	);

});

export default MenuBlockMedia;
