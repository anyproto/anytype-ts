import * as React from 'react';
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

interface State {
	filter: string;
	isLoading: boolean;
};

const LIMIT = 36;
const Tabs = [
	{ id: Tab.Gallery },
	{ id: Tab.Unsplash },
	{ id: Tab.Library },
	{ id: Tab.Upload },
].map(it => ({ ...it, name: translate(`menuBlockCover${Tab[it.id]}`) }));

const MenuBlockCover = observer(class MenuBlockCover extends React.Component<I.Menu, State> {

	node: any = null;
	state = {
		filter: '',
		isLoading: false,
	};
	items: any[] = [];
	filter = '';
	refFilter: any = null;
	refList: any = null;
	timeout = 0;
	tab: Tab = Tab.Gallery;
	activeIndex = -1;
	active: any = null;

	constructor (props: I.Menu) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.rebind = this.rebind.bind(this);
		this.unbind = this.unbind.bind(this);
	};

	render () {
		const { filter, isLoading } = this.state;
		const sections = this.getSections();

		// Pre-calculate indices for all items and organize into rows
		const itemsPerRow = this.getItemsPerRow();
		const rows: any[] = [];
		let globalIndex = 0;

		sections.forEach((section: any) => {
			// Add section header row if it has a name
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
				if (rowItems.length === itemsPerRow || i === children.length - 1) {
					rows.push({ isSection: false, children: rowItems });
					rowItems = [];
				};
			};
		});

		const Item = (item: any) => (
			<div
				id={`item-${item.id}`}
				className="item"
				onClick={e => this.onSelect(e, item)}
				onMouseEnter={e => this.onMouseEnter(e, item, item.__globalIndex)}
				onMouseLeave={() => this.onMouseLeave()}
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
						<Item key={i} {...item} />
					))}
				</div>
			);
		};

		let content = null;
		let filterElement = null;

		if ([ Tab.Unsplash, Tab.Library ].includes(this.tab)) {
			filterElement = (
				<Filter 
					ref={ref => this.refFilter = ref}
					className="outlined"
					value={filter}
					onChange={this.onFilterChange} 
				/>
			);
		};

		switch (this.tab) {
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
											ref={ref => this.refList = ref}
											width={width}
											height={height}
											rowCount={rows.length}
											rowHeight={({ index }) => this.getRowHeight(rows[index], index)}
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
						className="dropzone" 
						onDragOver={this.onDragOver} 
						onDragLeave={this.onDragLeave} 
						onDrop={this.onDrop}
						onClick={this.onUpload}
					>
						<Icon className="coverUpload" />
						<Label text={translate('menuBlockCoverChoose')} />
					</div>
				);
				break;
			};
		};

		if (isLoading) {
			content = <Loader />;
		};

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div className="head">
					{Tabs.map((item: any, i: number) => (
						<div 
							key={item.id} 
							className={[ 'btn', (item.id == this.tab ? 'active' : '') ].join(' ')}
							onClick={() => this.setTab(item.id)}
						>
							{item.name}
						</div>
					))}
				</div>

				<div className={[ 'body', Tab[this.tab].toLowerCase() ].join(' ')}>
					{filterElement}
					{content}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.load();
		this.rebind();

		keyboard.disablePaste(true);
	};

	componentDidUpdate () {
		const { filter } = this.state;
		
		if (this.filter != filter) {
			this.filter = filter;
			this.load();
		};
	};

	componentWillUnmount () {
		this.unbind();

		keyboard.disablePaste(false);
	};

	unbind () {
		$(window).off('paste.menuBlockCover keydown.menuBlockCover');
	};

	rebind () {
		this.unbind();
		$(window).on('paste.menuBlockCover', e => this.onPaste(e));
		$(window).on('keydown.menuBlockCover', e => this.onKeyDown(e));
	};

	load () {
		const { filter } = this.state;

		this.items = [];

		if (![ Tab.Unsplash, Tab.Library ].includes(this.tab)) {
			this.setState({ isLoading: false });
			return;
		};

		switch (this.tab) {
			case Tab.Unsplash: {
				this.setState({ isLoading: true });

				C.UnsplashSearch(filter, LIMIT, (message: any) => {
					if (message.error.code) {
						this.setState({ isLoading: false });
						return;
					};

					message.pictures.forEach((item: any) => {
						this.items.push({
							id: item.id,
							type: I.CoverType.Source,
							src: item.url,
							artist: item.artist,
						});
					});

					this.setState({ isLoading: false });
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

				this.setState({ isLoading: true });

				U.Subscription.search({
					filters,
					sorts,
					fullText: filter,
					limit: 1000,
				}, (message: any) => {
					this.setState({ isLoading: false });

					if (message.error.code) {
						return;
					};

					message.records.forEach((item: any) => {
						this.items.push({
							id: item.id,
							type: I.CoverType.Upload,
							src: S.Common.imageUrl(item.id, I.ImageSize.Medium),
							artist: item.name,
							coverY: -0.25,
						});
					});

					this.forceUpdate();
				});
				break;
			};
		};
	};

	setTab (tab: Tab) {
		this.tab = tab;
		this.forceUpdate();
		this.load();
	};

	onUpload (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onUpload, onUploadStart } = data;

		Action.openFileDialog({ extensions: J.Constant.fileExtension.cover }, paths => {
			close();

			if (onUploadStart) {
				onUploadStart();
			};

			C.FileUpload(S.Common.space, '', paths[0], I.FileType.Image, {}, false, '', I.ImageKind.Cover, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (onUpload) {
					onUpload(I.CoverType.Upload, message.objectId);
				};

				analytics.event('SetCover', { type: I.CoverType.Upload });
			});
		});
	};

	onSelect (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, onSelect, onUpload, onUploadStart } = data;
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);

		if (!object.coverId) {
			close();
		};

		if (item.type == I.CoverType.Source) {
			if (onUploadStart) {
				onUploadStart();
			};

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

	onFilterChange (v: string) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.setState({ filter: v }), J.Constant.delay.keyboard);
	};

	getSections () {
		let sections: any[] = [];

		switch (this.tab) {
			case Tab.Gallery: {
				sections = sections.concat([
					{ name: translate('menuBlockCoverGradients'), children: U.Menu.getCoverGradients() },
					{ name: translate('menuBlockCoverSolidColors'), children: U.Menu.getCoverColors() },
				]);
				break;
			};

			case Tab.Library:
			case Tab.Unsplash: {
				if (this.items.length) {
					sections.push({ children: this.items });
				};
				break;
			};
		};
		
		return U.Menu.sectionsMap(sections);
	};

	onDragOver (e: any) {
		if (!U.File.checkDropFiles(e)) {
			return;
		};
		
		const node = $(this.node);
		const zone = node.find('.dropzone');

		zone.addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!U.File.checkDropFiles(e)) {
			return;
		};
		
		const node = $(this.node);
		const zone = node.find('.dropzone');

		zone.removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!U.File.checkDropFiles(e)) {
			return;
		};
		
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		const node = $(this.node);
		const zone = node.find('.dropzone');
		
		zone.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);
		this.setState({ isLoading: true });
		
		C.FileUpload(S.Common.space, '', file, I.FileType.Image, {}, false, '', I.ImageKind.Cover,(message: any) => {
			this.setState({ isLoading: false });
			keyboard.disableCommonDrop(false);
			
			if (!message.error.code) {
				U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
			};
		
			close();
		});
	};

	onKeyDown (e: any) {
		const { close } = this.props;
		const checkFilter = () => this.refFilter && this.refFilter.isFocused();

		e.stopPropagation();
		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			e.preventDefault();

			this.refFilter?.blur();
			this.onArrowVertical(pressed == 'arrowup' ? -1 : 1);
		});

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			if (checkFilter()) {
				return;
			};

			e.preventDefault();
			this.refFilter?.blur();
			this.onArrowHorizontal(pressed == 'arrowleft' ? -1 : 1);
		});

		keyboard.shortcut('tab', e, () => {
			let idx = Tabs.findIndex(it => it.id == this.tab) + 1;

			if (idx >= Tabs.length) {
				idx = 0;
			};

			this.setTab(Tabs[idx].id);
			/*
			{tabs.map((item: any, i: number) => (
						<div 
							key={item.id} 
							className={[ 'btn', (item.id == this.tab ? 'active' : '') ].join(' ')}
							onClick={() => this.setTab(item.id)}
						>
							{item.name}
						</div>
					))}
					*/

		});

		if (this.active) {
			keyboard.shortcut('enter', e, () => {
				e.preventDefault();

				this.onSelect(e, this.active);
				close();
			});
		};
	};

	onArrowVertical (dir: number) {
		const items = this.getItemsFlat();
		const itemsPerRow = this.getItemsPerRow();

		if (items.length === 0) {
			return;
		};

		if (this.activeIndex === -1) {
			this.activeIndex = 0;
			this.setActive(items[0], 0);
			return;
		};

		const currentRow = Math.floor(this.activeIndex / itemsPerRow);
		const currentCol = this.activeIndex % itemsPerRow;
		let newRow = currentRow + dir;
		const totalRows = Math.ceil(items.length / itemsPerRow);

		// Wrap around
		if (newRow < 0) {
			newRow = totalRows - 1;
		} else if (newRow >= totalRows) {
			newRow = 0;
		};

		let newIndex = newRow * itemsPerRow + currentCol;

		// If new index is beyond items length, go to last item in that column
		if (newIndex >= items.length) {
			newIndex = items.length - 1;
		};

		this.activeIndex = newIndex;
		this.setActive(items[newIndex], newIndex);
	};

	onArrowHorizontal (dir: number) {
		const items = this.getItemsFlat();
		const itemsPerRow = this.getItemsPerRow();

		if (items.length === 0) {
			return;
		};

		if (this.activeIndex === -1) {
			this.activeIndex = 0;
			this.setActive(items[0], 0);
			return;
		};

		const currentRow = Math.floor(this.activeIndex / itemsPerRow);
		const currentCol = this.activeIndex % itemsPerRow;
		let newCol = currentCol + dir;
		let newRow = currentRow;

		// Wrap to previous/next row
		if (newCol < 0) {
			newRow -= 1;
			if (newRow < 0) {
				newRow = Math.ceil(items.length / itemsPerRow) - 1;
			};
			newCol = itemsPerRow - 1;
		} else if (newCol >= itemsPerRow) {
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

		this.activeIndex = newIndex;
		this.setActive(items[newIndex], newIndex);
	};

	setActive (item?: any, index?: number) {
		const node = $(this.node);

		node.find('.item.hover').removeClass('hover');

		this.active = item;
		if (index !== undefined) {
			this.activeIndex = index;
		};

		if (!item) {
			return;
		};

		const element = node.find(`#item-${$.escapeSelector(item.id)}`);
		element.addClass('hover');

		// Scroll to row containing the active item
		if (this.refList && index !== undefined) {
			const itemsPerRow = this.getItemsPerRow();
			const itemRow = Math.floor(index / itemsPerRow);

			// Calculate actual row in virtualized list (accounting for section headers)
			const sections = this.getSections();
			
			let virtualRow = itemRow;
			let itemCount = 0;

			for (const section of sections) {
				if (section.name) {
					virtualRow++; // Account for section header row
				}

				const sectionItemCount = (section.children || []).length;
				if (itemCount + sectionItemCount > index) {
					break;
				};

				itemCount += sectionItemCount;
			};

			this.refList.scrollToRow(Math.max(0, virtualRow));
		};
	};

	onMouseEnter (e: any, item: any, index: number) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, index);
		};
	};

	onMouseLeave () {
		if (!keyboard.isMouseDisabled) {
			this.setActive(null, -1);
		};
	};

	getItemsPerRow () {
		// Gallery has 4 items per row
		// Unsplash and Library have 3 items per row
		return [ Tab.Gallery ].includes(this.tab) ? 4 : 3;
	};

	getRowHeight (row: any, index) {
		if (row.isSection) {
			return index ? 40 : 32;
		};

		switch (this.tab) {
			case Tab.Gallery:
				return 56;
			case Tab.Library:
			case Tab.Unsplash:
				return 96;
			default:
				return 56;
		};
	};

	getItemsFlat () {
		const sections = this.getSections();
		const items: any[] = [];

		sections.forEach((section: any) => {
			if (section.children) {
				items.push(...section.children);
			};
		});

		return items;
	};

	onPaste (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const files = U.Common.getDataTransferFiles((e.clipboardData || e.originalEvent.clipboardData).items);

		if (!files.length) {
			return;
		};

		this.setState({ isLoading: true });

		U.Common.saveClipboardFiles(files, {}, (data: any) => {
			if (!data.files.length) {
				this.setState({ isLoading: false });
				return;
			};

			C.FileUpload(S.Common.space, '', data.files[0].path, I.FileType.Image, {}, false, '', I.ImageKind.Cover, (message: any) => {
				if (!message.error.code) {
					U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
				};

				this.setState({ isLoading: false });
				close();
			});
		});
	};

});

export default MenuBlockCover;