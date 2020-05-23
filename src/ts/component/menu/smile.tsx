import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Emoji } from 'emoji-mart';
import { Input, Smile } from 'ts/component';
import { I, C, Util, SmileUtil, keyboard, Storage } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {};
interface State {
	filter: string;
	page: number;
};

const $ = require('jquery');
const EmojiData = require('emoji-mart/data/apple.json');
const Constant = require('json/constant.json');
const { dialog } = window.require('electron').remote;

const LIMIT = 18;
const HEIGHT = 32;
const PAGE = 90;

class MenuSmile extends React.Component<Props, State> {

	ref: any = null;
	id: string = '';
	skin: number = 1;
	timeoutMenu: number = 0;
	timeoutFilter: number = 0;
	state = {
		filter: '',
		page: 0,
	};

	constructor (props: any) {
		super(props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onRandom = this.onRandom.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};
	
	render () {
		const { filter, page } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { noHead } = data;
		const sections = this.getSections();
		
		let id = 1;
		
		const Item = (item: any) => {
			return (
				<div id={'item-' + item.id} className="item" onMouseDown={(e: any) => { this.onMouseDown(item.id, item.smile, item.skin); }}>
					<div className="smile">
						<Smile icon={SmileUtil.nativeById(item.smile, item.skin)} size={32} />
					</div>
				</div>
			);
		};
		
		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="list">
					{item.emojis.map((smile: any, i: number) => {
						id++;
						
						if (id >= (page + 1) * PAGE * 1.1) {
							return null;
						};
						
						return <Item key={i} id={id} {...smile} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				{!noHead ? (
					<div className="head">
						<div className="btn" onClick={this.onRandom}>Random emoji</div>
						<div className="btn" onClick={this.onUpload}>Upload image</div>
						<div className="btn" onClick={this.onRemove}>Remove</div>
					</div>
				) : ''}
				
				<form className={[ 'filter', (!noHead ? 'withHead' : '') ].join(' ')} onSubmit={this.onSubmit}>
					<Input ref={(ref: any) => { this.ref = ref; }} placeHolder="Type to filter..." value={filter} onKeyUp={(e: any) => { this.onKeyUp(e, false); }} />
				</form>
				
				<div className="items">
					{sections.map((item: any, i: number) => (
						<Section key={i} {...item} />
					))}
					{!sections.length ? (
						<div className="empty">
							<div className="txt">
								<b>There is no emoji named "{filter}"</b>
								Try to find a new one or upload your image
							</div>
						</div>
					): ''}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		keyboard.setFocus(true);
		this.bind();
		this.ref.focus();
		this.skin = Number(Storage.get('skin')) || 1; 
	};
	
	componentDidUpdate () {
		const node = $(ReactDOM.findDOMNode(this));
		
		keyboard.setFocus(true);
		this.bind();
		
		if (this.id) {
			const el = node.find('#item-' + this.id);
			el.addClass('active');
			this.id = '';
		};
	};
	
	componentWillUnmount () {
		window.clearTimeout(this.timeoutMenu);
		window.clearTimeout(this.timeoutFilter);
		keyboard.setFocus(false);
		commonStore.menuClose('smileSkin');
		this.unbind();
	};
	
	bind () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.items').unbind('scroll.menu').on('scroll.menu', (e: any) => { this.onScroll(e); });
	};
	
	unbind () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.items').unbind('scroll.menu');
	};
	
	onScroll (e: any) {
		const { page } = this.state;
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.items');
		const top = items.scrollTop();
		
		if (top >= page * 12 * HEIGHT + 2 * HEIGHT) {
			this.setState({ page: page + 1 });
		};
	};
	
	getSections () {
		const { filter } = this.state;
		const reg = new RegExp(filter, 'gi');
		const lastIds = Storage.get('lastSmileIds') || [];
		
		let sections = Util.objectCopy(EmojiData.categories);
		
		sections = sections.map((s: any) => {
			s.emojis = s.emojis.map((it: string) => { 
				return { smile: it, skin: this.skin }; 
			});
			return s;
		});
		
		if (filter) {
			sections = sections.filter((s: any) => {
				s.emojis = (s.emojis || []).filter((c: any) => { return c.smile.match(reg); });
				return s.emojis.length > 0;
			});
		};
		
		if (lastIds && lastIds.length) {
			sections.unshift({
				name: 'Recently used',
				emojis: lastIds,
			});
		};
		
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		
		this.onKeyUp(e, true);
	};
	
	onKeyUp (e: any, force: boolean) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.setState({ filter: Util.filterFix(this.ref.getValue()) });
		}, force ? 0 : 50);
	};
	
	onRandom () {
		const param = SmileUtil.randomParam();
		this.onSelect(param.id, param.skin);
	};

	onUpload () {
		const { param } = this.props;
		const { data } = param;
		const { onUpload } = data;
		const options: any = { 
			properties: [ 'openFile' ], 
			filters: [ { name: '', extensions: Constant.extension.image } ]
		};
		
		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};
			
			C.UploadFile('', files[0], I.FileType.Image, true, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				onUpload(message.hash);
				commonStore.menuClose(this.props.id);
			});
		});
	};
	
	onSelect (id: string, skin: number) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		this.skin = Number(skin) || 1;
		Storage.set('skin', this.skin);
		this.setLastIds(id, this.skin);
		
		commonStore.menuClose(this.props.id);

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
				
				commonStore.menuOpen('smileSkin', {
					type: I.MenuType.Horizontal,
					element: '.menuSmile #item-' + n,
					offsetX: 0,
					offsetY: 4,
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
			if (commonStore.menuIsOpen('smileSkin')) {
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
		ids = ids.slice(0, LIMIT);
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