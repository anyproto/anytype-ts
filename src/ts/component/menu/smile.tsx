import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Filter, IconEmoji } from 'ts/component';
import { I, C, Util, SmileUtil, keyboard, Storage, translate } from 'ts/lib';
import { menuStore } from 'ts/store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};
interface State {
	filter: string;
	page: number;
};

const $ = require('jquery');
const EmojiData = require('json/emoji.json');
const Constant = require('json/constant.json');
const { dialog } = window.require('electron').remote;

const LIMIT_RECENT = 18;
const LIMIT_ROW = 9;
const HEIGHT_SECTION = 40;
const HEIGHT_ITEM = 40;

class MenuSmile extends React.Component<Props, State> {

	state = {
		filter: '',
		page: 0,
	};

	ref: any = null;
	id: string = '';
	skin: number = 1;
	timeoutMenu: number = 0;
	timeoutFilter: number = 0;
	cache: any = null;

	constructor (props: any) {
		super(props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onRandom = this.onRandom.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};
	
	render () {
		const { filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { noHead, noUpload } = data;
		const sections = this.getSections();
		const items = this.getItems();

		if (!this.cache) {
			return null;
		};

		const Item = (item: any) => {
			const str = `:${item.smile}::skin-${item.skin}:`;
			return (
				<div id={'item-' + item.id} className="item" onMouseDown={(e: any) => { this.onMouseDown(item.id, item.smile, item.skin); }}>
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
						<div className="btn" onClick={this.onRemove}>{translate('menuSmileRemove')}</div>
					</div>
				) : ''}
				
				<Filter 
					ref={(ref: any) => { this.ref = ref; }}
					value={filter}
					className={!noHead ? 'withHead' : ''} 
					onChange={(e: any) => { this.onKeyUp(e, false); }} 
				/>
				
				<div className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={({ index }) => index < items.length}
					>
						{({ onRowsRendered, registerChild }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={registerChild}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={({ index }) => {
											const item = items[index];
											return item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
										}}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
					{!sections.length ? (
						<div className="empty">
							<div 
								className="txt" 
								dangerouslySetInnerHTML={{ __html: Util.sprintf(translate('menuSmileEmpty'), filter) }} 
							/>
						</div>
					): ''}
				</div>
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
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
	};
	
	componentDidUpdate () {
		const node = $(ReactDOM.findDOMNode(this));
		
		if (this.id) {
			node.find('#item-' + this.id).addClass('active');
			this.id = '';
		};
	};
	
	componentWillUnmount () {
		window.clearTimeout(this.timeoutMenu);
		window.clearTimeout(this.timeoutFilter);
		keyboard.setFocus(false);
		menuStore.close('smileSkin');
	};
	
	getSections () {
		const { filter } = this.state;
		const reg = new RegExp(filter, 'gi');
		const lastIds = Storage.get('lastSmileIds') || [];

		let sections = Util.objectCopy(EmojiData.categories);
		
		sections = sections.map((s: any) => {
			s.children = s.emojis.map((it: string) => { 
				return { smile: it, skin: this.skin }; 
			});
			return s;
		});
		
		if (filter) {
			sections = sections.filter((s: any) => {
				s.children = (s.children || []).filter((c: any) => { return c.smile.match(reg); });
				return s.children.length > 0;
			});
		};
		
		if (lastIds && lastIds.length) {
			sections.unshift({
				id: 'recent',
				name: 'Recently used',
				children: lastIds,
			});
		};
		
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();

		let items: any[] = [];
		let ret: any[] = [];

		for (let section of sections) {
			items.push({
				id: section.id,
				name: section.name,
				isSection: true,
			});
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
	
	onSubmit (e: any) {
		e.preventDefault();
		
		this.onKeyUp(e, true);
	};
	
	onKeyUp (e: any, force: boolean) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.setState({ 
				page: 0, 
				filter: Util.filterFix(this.ref.getValue()),
			});
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
		
		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			C.UploadFile('', files[0], I.FileType.Image, true, (message: any) => {
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
		close();

		if (onSelect) {
			onSelect(SmileUtil.nativeById(id, this.skin));
		};
	};
	
	onMouseDown (n: number, id: string, skin: number) {
		const win = $(window);
		const item = EmojiData.emojis[id];

		this.id = id;
		window.clearTimeout(this.timeoutMenu);

		if (item && item.skin_variations) {
			this.timeoutMenu = window.setTimeout(() => {
				win.unbind('mouseup.smile');
				
				menuStore.open('smileSkin', {
					type: I.MenuType.Horizontal,
					element: '.menuSmile #item-' + n,
					vertical: I.MenuDirection.Top,
					horizontal: I.MenuDirection.Center,
					data: {
						smileId: id,
						onSelect: (skin: number) => {
							this.onSelect(id, skin);
							this.forceUpdate();
						}
					},
					onClose: () => {
						this.id = '';
					}
				});
			}, 200);
		};
		
		win.unbind('mouseup.smile').on('mouseup.smile', () => {
			if (menuStore.isOpen('smileSkin')) {
				return;
			};
			if (this.id) {
				this.onSelect(id, skin);
			};
			window.clearTimeout(this.timeoutMenu);
			win.unbind('mouseup.smile')
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
	};
	
};

export default MenuSmile;