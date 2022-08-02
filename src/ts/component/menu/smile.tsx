import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Filter, Icon, IconEmoji, EmptySearch } from 'ts/component';
import { I, C, Util, SmileUtil, keyboard, Storage, translate, analytics } from 'ts/lib';
import { menuStore } from 'ts/store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {};
interface State {
	filter: string;
	page: number;
};

const $ = require('jquery');
const EmojiData = require('json/emoji.json');
const Constant = require('json/constant.json');

const LIMIT_RECENT = 18;
const LIMIT_ROW = 9;
const LIMIT_SEARCH = 12;
const HEIGHT_SECTION = 40;
const HEIGHT_ITEM = 40;
const ID_RECENT = 'recent';

class MenuSmile extends React.Component<Props, State> {

	state = {
		filter: '',
		page: 0,
	};

	refFilter: any = null;
	refList: any = null;

	id: string = '';
	skin: number = 1;
	timeoutMenu: number = 0;
	timeoutFilter: number = 0;
	cache: any = null;
	groupCache: any[] = [];

	constructor (props: any) {
		super(props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onRandom = this.onRandom.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { noHead, noUpload, noRemove } = data;
		const sections = this.getSections();
		const items = this.getItems();
		const groups = this.getGroups();

		if (!this.cache) {
			return null;
		};

		const Item = (item: any) => {
			const str = `:${item.smile}::skin-${item.skin}:`;
			return (
				<div 
					id={'item-' + item.id} 
					className="item" 
					onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }}
					onMouseLeave={(e: any) => { this.onMouseLeave(e); }} 
					onMouseDown={(e: any) => { this.onMouseDown(item.id, item.smile, item.skin); }}
				>
					<div className="iconObject c32" data-code={str}>
						<IconEmoji className="c32" size={28} icon={str} />
					</div>
				</div>
			);
		};
		
		const rowRenderer = (param: any) => {
			const item = items[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<div style={param.style}>
						{item.isSection ? (
							<div className="section">
								{item.name ? <div className="name">{item.name}</div> : ''}
							</div>
						) : (
							<div className="row">
								{item.children.map((smile: any, i: number) => {
									return <Item key={i} id={smile.smile} {...smile} />;
								})}
							</div>
						)}
					</div>
				</CellMeasurer>
			);
		};
		
		return (
			<div>
				{!noHead ? (
					<div className="head">
						<div className="btn" onClick={this.onRandom}>{translate('menuSmileRandom')}</div>
						{!noUpload ? <div className="btn" onClick={this.onUpload}>{translate('menuSmileUpload')}</div> : ''}
						{!noRemove ? <div className="btn" onClick={this.onRemove}>{translate('menuSmileRemove')}</div> : ''}
					</div>
				) : ''}
				
				<Filter 
					ref={(ref: any) => { this.refFilter = ref; }}
					value={filter}
					className={!noHead ? 'withHead' : ''} 
					onChange={(e: any) => { this.onKeyUp(e, false); }} 
				/>
				
				<div className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={({ index }) => !!items[index]}
					>
						{({ onRowsRendered, registerChild }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={(ref: any) => { this.refList = ref; }}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={({ index }) => this.getRowHeight(items[index])}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
										onScroll={this.onScroll}
										scrollToAlignment="start"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
					{!sections.length ? (
						<EmptySearch text={Util.sprintf(translate('menuSmileEmpty'), filter)} />
					): ''}
				</div>

				{sections.length ? (
					<div id="foot" className="foot">
						{groups.map((group: any, i: number) => (
							<Icon 
								key={i} 
								id={`item-${group.id}`}
								className={group.id} 
								tooltip={group.name} 
								tooltipY={I.MenuDirection.Bottom} 
								onClick={(e: any) => { this.onGroup(group.id); }} 
							/>
						))}
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this.skin = Number(Storage.get('skin')) || 1; 

		if (!this.cache) {
			const items = this.getItems();
			this.cache = new CellMeasurerCache({
				fixedWidth: true,
				defaultHeight: HEIGHT_SECTION,
				keyMapper: (i: number) => { return (items[i] || {}).id; },
			});
			this.forceUpdate();
		};

		window.setTimeout(() => {
			if (this.refFilter) {
				this.refFilter.focus();
			};
		}, 15);
	};
	
	componentDidUpdate () {
		const node = $(ReactDOM.findDOMNode(this));
		
		if (this.id) {
			node.find(`#item-${this.id}`).addClass('active');
			this.id = '';
		};

		this.groupCache = [];
	};
	
	componentWillUnmount () {
		window.clearTimeout(this.timeoutMenu);
		window.clearTimeout(this.timeoutFilter);
		keyboard.setFocus(false);
		menuStore.close('smileSkin');
	};

	checkRecent (sections: any[]) {
		const lastIds = Storage.get('lastSmileIds') || [];

		if (lastIds && lastIds.length) {
			sections.unshift({ id: ID_RECENT, name: 'Recently used', children: lastIds });
		};

		return sections;
	};

	getGroups () {
		return this.checkRecent(EmojiData.categories.map(it => { return { id: it.id, name: it.name }}));
	};
	
	getSections () {
		const { filter } = this.state;
		const reg = new RegExp(filter, 'gi');

		let sections: any[] = [];

		EmojiData.categories.forEach((it: any) => {
			sections.push({
				id: it.id,
				name: it.name,
				children: it.emojis.map(id => { return { smile: id, skin: this.skin }}),
			});
		});

		if (filter) {
			sections = sections.filter((s: any) => {
				s.children = (s.children || []).filter(c => c.smile.match(reg));
				return s.children.length > 0;
			});
		};
		
		return this.checkRecent(sections);
	};

	getItems () {
		let sections = this.getSections();
		let items: any[] = [];
		let ret: any[] = [];
		let length = sections.reduce((res: number, section: any) => { 
			return (section.id == ID_RECENT) ? res : res + section.children.length; 
		}, 0);

		if (length && (length <= LIMIT_SEARCH)) {
			sections = [
				{ 
					id: 'search', name: 'Search results', isSection: true,
					children: sections.reduce((res: any[], section: any) => {
						return (section.id == ID_RECENT) ? res : res.concat(section.children); 
					}, [])
				}
			];
		};

		for (let section of sections) {
			items.push({ id: section.id, name: section.name, isSection: true });
			items = items.concat(section.children);
		};

		let n = 0;
		let row = { children: [] };
		for (let i = 0; i < items.length; ++i) {
			const item = items[i];
			const next = items[i + 1];

			if (item.isSection) {
				row = { children: [] };
				ret.push(item);
				n = 0;
				continue;
			};

			row.children.push(item);

			n++;
			if ((n == LIMIT_ROW) || (next && next.isSection && (row.children.length > 0) && (row.children.length < LIMIT_ROW))) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < LIMIT_ROW) {
			ret.push(row);
		};

		return ret;
	};
	
	getRowHeight (item: any) {
		return item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		this.onKeyUp(e, true);
	};
	
	onKeyUp (e: any, force: boolean) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.setState({ page: 0, filter: Util.filterFix(this.refFilter.getValue()) });
		}, force ? 0 : 50);
	};
	
	onRandom () {
		const param = SmileUtil.randomParam();
		this.onSelect(param.id, param.skin);
	};

	onUpload () {
		const { param, close } = this.props;
		const { data } = param;
		const { onUpload } = data;
		const options: any = { 
			properties: [ 'openFile' ], 
			filters: [ { name: '', extensions: Constant.extension.cover } ]
		};

		close();
		
		window.Electron.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			C.FileUpload('', files[0], I.FileType.Image, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				if (onUpload) {
					onUpload(message.hash);
				};
			});
		});
	};
	
	onSelect (id: string, skin: number) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		this.skin = Number(skin) || 1;
		Storage.set('skin', this.skin);
		this.setLastIds(id, this.skin);

		if (onSelect) {
			onSelect(SmileUtil.nativeById(id, this.skin));
		};

		analytics.event(id ? 'SetIcon' : 'RemoveIcon');
	};

	onMouseEnter (e: any, item: any) {
		Util.tooltipShow(item.smile, $(e.currentTarget), I.MenuDirection.Center, I.MenuDirection.Top);
	};

	onMouseLeave (e: any) {
		Util.tooltipHide(false);
	};
	
	onMouseDown (n: number, id: string, skin: number) {
		const { close } = this.props;
		const win = $(window);
		const item = EmojiData.emojis[id];

		this.id = id;
		window.clearTimeout(this.timeoutMenu);

		if (item && item.skin_variations) {
			this.timeoutMenu = window.setTimeout(() => {
				win.off('mouseup.smile');
				
				menuStore.open('smileSkin', {
					type: I.MenuType.Horizontal,
					element: '.menuSmile #item-' + n,
					vertical: I.MenuDirection.Top,
					horizontal: I.MenuDirection.Center,
					data: {
						smileId: id,
						onSelect: (skin: number) => {
							this.onSelect(id, skin);
							close();
						}
					},
					onClose: () => {
						this.id = '';
					}
				});
			}, 200);
		};
		
		win.off('mouseup.smile').on('mouseup.smile', () => {
			if (menuStore.isOpen('smileSkin')) {
				return;
			};
			if (this.id) {
				this.onSelect(id, skin);
				close();
			};
			window.clearTimeout(this.timeoutMenu);
			win.off('mouseup.smile')
		});
	};
	
	setLastIds (id: string, skin: number) {
		if (!id) {
			return;
		};
		
		let ids = Storage.get('lastSmileIds') || [];
		
		ids = ids.map((it: any) => {
			it.key = [ it.smile, it.skin ].join(',');
			return it;
		});
		
		ids.unshift({ 
			smile: id, 
			skin: skin, 
			key: [ id, skin ].join(',') 
		});
		
		ids = Util.arrayUniqueObjects(ids, 'key');
		ids = ids.slice(0, LIMIT_RECENT);
		ids = ids.map((it: any) => {
			delete(it.key);
			return it;
		});
		
		Storage.set('lastSmileIds', ids, true);
	};
	
	onRemove () {
		this.onSelect('', 1);
		this.props.close();
	};

	onGroup (id: string) {
		const items = this.getItems();
		const idx = items.findIndex(it => it.id == id);

		this.refList.scrollToRow(Math.max(0, idx));
	};

	getGroupCache () {
		if (this.groupCache.length) {
			return this.groupCache;
		};

		let items = this.getItems();
		let t = 0;
		let last = null;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			if (item.isSection) {
				last = this.groupCache[this.groupCache.length - 1];
				if (last) {
					last.end = t;
				};

				this.groupCache.push({ id: item.id, start: t, end: 0 });
			};

			t += this.getRowHeight(item);
		};

		last = this.groupCache[this.groupCache.length - 1];
		if (last) {
			last.end = t;
		};
		return this.groupCache;
	};

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		const cache = this.getGroupCache();
		for (let item of cache) {
			if ((scrollTop >= item.start) && (scrollTop < item.end)) {
				this.setActiveGroup(item.id);
				break;
			};
		};
	};

	setActiveGroup (id: string) {
		const node = $(ReactDOM.findDOMNode(this));
		const foot = node.find('#foot');

		foot.find('.active').removeClass('active');
		foot.find(`#item-${id}`).addClass('active');
	};
	
};

export default MenuSmile;