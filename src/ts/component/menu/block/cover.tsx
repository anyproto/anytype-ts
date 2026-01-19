import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { AutoSizer, List } from 'react-virtualized';
import { I, C, S, U, J, analytics, translate, keyboard, Action } from 'Lib';
import { Cover, Filter, Icon, Label, EmptySearch, Loader } from 'Component';

enum Tab {
	Gallery	 = 0,
	Unsplash = 1,
	Library	 = 2,
	Upload	 = 3,
};

const LIMIT = 36;
const Tabs = [
	{ id: Tab.Gallery },
	{ id: Tab.Unsplash },
	{ id: Tab.Library },
	{ id: Tab.Upload },
].map(it => ({ ...it, name: translate(`menuBlockCover${Tab[it.id]}`) }));

const MenuBlockCover = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { rootId, onSelect, onUpload, onUploadStart } = data;
	const [ filter, setFilter ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ tab, setTab ] = useState(Tab.Gallery);
	const [ items, setItems ] = useState([]);
	const nodeRef = useRef(null);
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const dropzoneRef = useRef(null);
	const timeout = useRef(0);
	const active = useRef(null);
	const activeIndex = useRef(-1);
	const rows: any[] = [];
	const itemsPerRow = tab == Tab.Gallery ? 4 : 3;

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
		window.setTimeout(() => filterRef.current?.focus(), 15);

		return () => {
			unbind();
		};
	}, [ filter, tab, items ]);

	const unbind = () => {
		$(window).off('paste.menu keydown.menu');
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		win.on('paste.menu', e => onPaste(e));
		win.on('keydown.menu', e => onKeyDown(e));
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
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Image },
					//{ relationKey: 'imageKind', condition: I.FilterCondition.Equal, value: I.ImageKind.Cover },
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
						src: S.Common.imageUrl(item.id, I.ImageSize.Medium),
						artist: item.name,
						coverY: -0.25,
					})));
				});
				break;
			};
		};
	};

	const onUploadHandler = (e: any) => {
		Action.openFileDialog({ extensions: J.Constant.fileExtension.cover }, paths => {
			close();
			onUploadStart?.();

			C.FileUpload(S.Common.space, '', paths[0], I.FileType.Image, {}, false, '', I.ImageKind.Cover, (message: any) => {
				if (message.error.code) {
					return;
				};

				onUpload?.(I.CoverType.Upload, message.objectId);
				analytics.event('SetCover', { type: I.CoverType.Upload });
			});
		});
	};

	const onSelectHandler = (e: any, item: any) => {
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);

		if (!object.coverId) {
			close();
		};

		if (item.type == I.CoverType.Source) {
			onUploadStart?.();

			C.UnsplashDownload(S.Common.space, item.itemId, (message: any) => {
				if (!message.error.code) {
					onUpload(item.type, message.objectId);
				};
			});

			close();
		} else
		if (onSelect) {
			onSelect(item);
		};

		analytics.event('SetCover', { type: item.type, id: item.itemId });
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => setFilter(v), J.Constant.delay.keyboard);
	};

	const getSections = () => {
		let sections: any[] = [];

		switch (tab) {
			case Tab.Gallery: {
				sections = sections.concat([
					{ name: translate('menuBlockCoverGradients'), children: U.Menu.getCoverGradients() },
					{ name: translate('menuBlockCoverSolidColors'), children: U.Menu.getCoverColors() },
				]);
				break;
			};

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
			$(dropzoneRef.current).addClass('isDraggingOver');
		};
	};
	
	const onDragLeave = (e: any) => {
		if (U.File.checkDropFiles(e)) {
			$(dropzoneRef.current).removeClass('isDraggingOver');
		};
	};
	
	const onDrop = (e: any) => {
		if (!U.File.checkDropFiles(e)) {
			return;
		};
		
		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		
		$(dropzoneRef.current).removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);
		setIsLoading(true);
		
		C.FileUpload(S.Common.space, '', file, I.FileType.Image, {}, false, '', I.ImageKind.Cover,(message: any) => {
			setIsLoading(false);
			keyboard.disableCommonDrop(false);
			
			if (!message.error.code) {
				U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
			};
		
			close();
		});
	};

	const onKeyDown = (e: any) => {
		e.stopPropagation();
		keyboard.disableMouse(true);

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

		keyboard.shortcut('tab', e, () => {
			let idx = Tabs.findIndex(it => it.id == tab) + 1;

			if (idx >= Tabs.length) {
				idx = 0;
			};

			setTab(Tabs[idx].id);
		});

		if (active.current) {
			keyboard.shortcut('enter', e, () => {
				e.preventDefault();

				onSelectHandler(e, active.current);
				close();
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

		// Wrap to previous/next row
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

		// If new index is beyond items length, wrap to beginning/end
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
		const node = $(nodeRef.current);

		node.find('.item.hover').removeClass('hover');

		active.current = item;
		if (index !== undefined) {
			activeIndex.current = index;
		};

		if (!item) {
			return;
		};

		const element = node.find(`#item-${$.escapeSelector(item.id)}`);
		element.addClass('hover');

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

	const getRowHeight = (row: any, index) => {
		if (row.isSection) {
			return index ? 40 : 32;
		};

		switch (tab) {
			case Tab.Gallery:
				return 56;
			case Tab.Library:
			case Tab.Unsplash:
				return 96;
			default:
				return 56;
		};
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
		const { data } = param;
		const { rootId } = data;
		const files = U.Common.getDataTransferFiles((e.clipboardData || e.originalEvent.clipboardData).items);

		if (!files.length) {
			return;
		};

		setIsLoading(true);

		U.Common.saveClipboardFiles(files, {}, (data: any) => {
			if (!data.files.length) {
				setIsLoading(false);
				return;
			};

			C.FileUpload(S.Common.space, '', data.files[0].path, I.FileType.Image, {}, false, '', I.ImageKind.Cover, (message: any) => {
				if (!message.error.code) {
					U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
				};

				setIsLoading(false);
				close();
			});
		});
	};

	const Item = ({ item }: { item: any }) => (
		<div
			id={`item-${item.id}`}
			className="item"
			onClick={e => onSelectHandler(e, item)}
			onMouseEnter={e => onMouseEnter(e, item, item.__globalIndex)}
			onMouseLeave={() => onMouseLeave()}
		>
			<Cover preview={true} {...item} id={item.itemId} />
			{item.artist ? <div className="name">{item.artist}</div> : ''}
		</div>
	);

	const rowRenderer = (param: any) => {
		const row = rows[param.index];

		if (row.isSection) {
			return (
				<div key={param.key} style={param.style} className="sectionName">
					{row.name}
				</div>
			);
		}

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

			// Create a row when we reach itemsPerRow or it's the last item
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
				className="outlined"
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
			case Tab.Gallery:
			case Tab.Unsplash:
			case Tab.Library: {
				content = (
					<>
						{rows.length ? (
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
						) : <EmptySearch text={filter ? U.String.sprintf(translate('menuBlockCoverEmptyFilter'), filter) : translate('menuBlockCoverEmpty')} />}
					</>
				);
				break;
			};

			case Tab.Upload: {
				content = (
					<div 
						ref={dropzoneRef}
						className="dropzone" 
						onDragOver={onDragOver} 
						onDragLeave={onDragLeave} 
						onDrop={onDrop}
						onClick={onUploadHandler}
					>
						<Icon className="coverUpload" />
						<Label text={translate('menuBlockCoverChoose')} />
					</div>
				);
				break;
			};
		};
	};

	return (
		<div ref={nodeRef} className="wrap">
			<div className="head">
				{Tabs.map((item: any, i: number) => {
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

			<div className={[ 'body', Tab[tab].toLowerCase() ].join(' ')}>
				{filterElement}
				{content}
			</div>
		</div>
	);

}));

export default MenuBlockCover;