import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IconObject, Filter } from 'ts/component';
import { I, C, DataUtil, Util, focus, keyboard } from 'ts/lib';
import { dbStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};
interface State {
	filter: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class BlockType extends React.Component<Props, State> {

	ref: any = null;
	n: number = -1;
	state = {
		filter: '',
	};

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onOut = this.onOut.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onFilterFocus = this.onFilterFocus.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render (): any {
		const { block } = this.props;
		const items = this.getItems();
		const { filter } = this.state;

		const Item = (item: any) => {
			return (
				<div id={'item-' + item.id} className="item" onClick={(e: any) => { this.onClick(e, item); }} onMouseEnter={(e: any) => { this.onOver(e, item); }} onMouseLeave={this.onOut}>
					<IconObject size={48} iconSize={32} object={{ ...item, layout: I.ObjectLayout.Type }} />
					<div className="info">
						<div className="txt">
							<div className="name">{item.name}</div>
							<div className="descr">{item.description}</div>
						</div>
						<div className="line" />
					</div>
				</div>
			);
		};
		
		return (
			<div tabIndex={0} onFocus={this.onFocus}>
				<div className="placeholder">
					Choose object type (↓↑ to select) or press ENTER to continue with Draft type
				</div>

				<Filter 
					ref={(ref: any) => { this.ref = ref; }} 
					inputClassName={'focusable c' + block.id}
					placeholderFocus="Filter types..." 
					value={filter}
					onFocus={this.onFilterFocus}
					onChange={this.onFilterChange}
				/>

				{items.map((item: any) => (
					<Item key={item.id} {...item} />
				))}
			</div>
		);
	};

	componentWillUnmount() {
		this.unbind();
	};

	bind () {
		this.unbind();
		$(window).on('keydown.blockType', (e: any) => { this.onKeyDown(e); });
	};

	unbind () {
		$(window).unbind('keydown.blockType');
	};

	getItems () {
		const { filter } = this.state;

		let items = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page);

		items.sort(DataUtil.sortByName);

		if (filter) {
			const reg = new RegExp(Util.filterFix(filter), 'gi');

			items = items.filter((it: any) => {
				let ret = false;
				if (it.name && it.name.match(reg)) {
					ret = true;
					it._sortWeight_ = 100;
				} else 
				if (it.description && it.description.match(reg)) {
					ret = true;
					it._sortWeight_ = 10;
				};
				return ret; 
			});

			items.sort((c1: any, c2: any) => {
				if (c1._sortWeight_ > c2._sortWeight_) return -1;
				if (c1._sortWeight_ < c2._sortWeight_) return 1;
				return 0;
			});
		};

		return items;
	};

	onKeyDown (e: any) {
		const { onKeyDown, isPopup } = this.props;
		const items = this.getItems();

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup', e, (pressed: string) => {
			this.n--;

			if (this.n < -1) {
				this.n = -1;
				this.unbind();

				if (onKeyDown) {
					onKeyDown(e, '', [], { from: 0, to: 0 });
				};
			} else
			if (this.n == -1) {
				this.ref.focus();
			} else {
				this.setHover(items[this.n], true);
			};
		});

		keyboard.shortcut('arrowdown', e, (pressed: string) => {
			e.preventDefault();

			this.n++;
			if (this.n > items.length - 1) {
				this.n = 0;
				focus.scroll(isPopup);
			};
			this.setHover(items[this.n], true);
		});

		keyboard.shortcut('enter, space', e, (pressed: string) => {
			e.preventDefault();

			if (items[this.n]) {
				this.onClick(e, items[this.n]);
			};
		});
	};
	
	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			const items = this.getItems();
			
			this.n = items.findIndex((it: any) => { return it.id == item.id; });
			this.setHover(item, false);

			this.bind();
		};
	};

	onOut () {
		if (!keyboard.isMouseDisabled) {
			const node = $(ReactDOM.findDOMNode(this));
			node.find('.item.hover').removeClass('hover');

			this.n = -1;
			this.unbind();
		};
	};

	setHover (item: any, scroll: boolean) {
		if (!item) {
			return;
		};

		const { isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#item-' + item.id);

		node.find('.item.hover').removeClass('hover');
		el.addClass('hover');

		this.ref.blur();

		if (scroll) {
			const container = isPopup ? $('#popupPage #innerWrap') : $(window);
			const st = container.scrollTop();
			const h = container.height();
			const o = Constant.size.lastBlock + Util.sizeHeader();

			let y = 0;
			if (isPopup) {
				y = el.offset().top - container.offset().top + st;
			} else {
				y = el.offset().top;
			};

			if (y >= h - o) {
				container.scrollTop(y - h + o);
			};
		};
	};

	onClick (e: any, item: any) {
		const { rootId } = this.props;
		const param = {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		};

		const create = (templateId: string) => {
			const onTemplate = () => {
				C.BlockCreate(param, rootId, '', I.BlockPosition.Bottom, (message: any) => {
					focus.set(message.blockId, { from: 0, to: 0 });
					focus.apply();
				});
			};

			if (templateId) {
				C.ApplyTemplate(rootId, templateId, onTemplate);
			} else {
				C.BlockObjectTypeSet(rootId, item.id, onTemplate);
			};
		};

		const showMenu = () => {
			popupStore.open('template', {
				data: {
					typeId: item.id,
					onSelect: create,
				},
			});
		};

		DataUtil.checkTemplateCnt([ item.id ], 2, (message: any) => {
			if (message.records.length > 1) {
				showMenu();
			} else {
				create(message.records.length ? message.records[0].id : '');
			};
		});
	};

	onFilterFocus (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.item.hover').removeClass('hover');

		this.bind();
	};

	onFilterChange (e: any) {
		this.setState({ filter: this.ref.getValue() });
	};
	
};

export default BlockType;