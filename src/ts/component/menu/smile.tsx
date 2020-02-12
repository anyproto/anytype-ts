import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Emoji } from 'emoji-mart';
import { Input } from 'ts/component';
import { I, Util, keyboard, Storage } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

const $ = require('jquery');
const EmojiData = require('emoji-mart/data/apple.json');
const LIMIT = 12;

interface Props extends I.Menu {};
interface State {
	filter: string;
};

class MenuSmile extends React.Component<Props, State> {

	ref: any = null;
	id: string = '';
	t: number = 0;
	state = {
		filter: ''
	};

	constructor (props: any) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
		this.onRandom = this.onRandom.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};
	
	render () {
		const { filter } = this.state;
		const sections = this.getSections();
		
		const Item = (item: any) => (
			<div id={'item-' + item.id} className="item" onMouseDown={(e: any) => { this.onMouseDown(item.smile); }}>
				<div className="smile">
					<Emoji native={true} emoji={':' + item.smile + ':'} set="apple" size={24} />
				</div>
			</div>
		);
		
		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="list">
					{item.emojis.map((smile: any, i: number) => (
						<Item key={i} id={smile} smile={smile} />
					))}
				</div>
			</div>
		);
		
		return (
			<div>
				<div className="head">
					<div className="btn" onClick={this.onRandom}>Random emoji</div>
					<div className="btn dn">Upload image</div>
					<div className="btn" onClick={this.onRemove}>Remove</div>
				</div>
				
				<form className="filter" onSubmit={this.onSubmit}>
					<Input ref={(ref: any) => { this.ref = ref; }} placeHolder="Type to filter..." value={filter} onKeyUp={this.onSubmit} />
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
	};
	
	componentDidUpdate () {
		const node = $(ReactDOM.findDOMNode(this));
		
		keyboard.setFocus(true);
		
		if (this.id) {
			const el = node.find('#item-' + this.id);
			el.addClass('active');
			this.id = '';
		};
	};
	
	componentWillUnmount () {
		window.clearTimeout(this.t);
		keyboard.setFocus(false);
		commonStore.menuClose('smileSkin');
	};
	
	getSections () {
		const { filter } = this.state;
		const reg = new RegExp(filter, 'gi');
		const lastIds = Storage.get('smileIds') || [];
		
		let sections = Util.objectCopy(EmojiData.categories);
		
		if (filter) {
			sections = sections.filter((s: any) => {
				s.emojis = (s.emojis || []).filter((c: any) => { return c.match(reg); });
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
	
	onSubmit (e: any) {
		e.preventDefault();
		
		let filter = this.ref.getValue().replace(/[\/\\\*]/g, '');
		this.setState({ filter: filter });
	};
	
	onRandom () {
		this.onSelect(Util.randomSmile().replace(/:/g, ''));
	};
	
	onSelect (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		this.setLastIds(id);
		
		commonStore.menuClose(this.props.id);
		onSelect(id);
	};
	
	onMouseDown (id: string) {
		const win = $(window);
		const item = EmojiData.emojis[id];
		
		this.id = id;
		window.clearTimeout(this.t);
		
		if (item && item.skin_variations) {
			this.t = window.setTimeout(() => {
				win.unbind('mouseup.smile');
				
				commonStore.menuOpen('smileSkin', {
					type: I.MenuType.Horizontal,
					element: '.menuSmile #item-' + id,
					offsetX: 0,
					offsetY: 4,
					vertical: I.MenuDirection.Top,
					horizontal: I.MenuDirection.Center,
					data: {
						smileId: id,
						onSelect: (skin: number) => {
							this.onSelect(id + '::skin-tone-' + skin);
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
				this.onSelect(id);
			};
			window.clearTimeout(this.t);
			win.unbind('mouseup.smile')
		});
	};
	
	setLastIds (id: string) {
		if (!id) {
			return;
		};
		
		let ids = Storage.get('smileIds') || [];
		
		if (ids.length && (ids[0] == id)) {
			return;
		};
		
		ids.unshift(id);
		ids = ids.slice(0, LIMIT);
		Storage.set('smileIds', ids);
	};
	
	onRemove () {
		this.onSelect('');
	};
	
};

export default MenuSmile;