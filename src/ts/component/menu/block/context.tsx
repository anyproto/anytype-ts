import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, C, Mark, Util, DataUtil, focus } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class MenuBlockContext extends React.Component<Props, {}> {
	
	timeout: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onMenuClick = this.onMenuClick.bind(this);
		this.onMark = this.onMark.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { range } = focus;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return null;
		};
		
		const { type, content } = block;
		const { marks, style } = content;
		
		let canMark = true;
		let markActions = [
			{ type: I.MarkType.Bold, icon: 'bold', name: 'Bold' },
			{ type: I.MarkType.Italic, icon: 'italic', name: 'Italic' },
			{ type: I.MarkType.Strike, icon: 'strike', name: 'Strikethrough' },
			{ type: I.MarkType.Link, icon: 'link', name: 'Link' },
			{ type: I.MarkType.Code, icon: 'kbd', name: 'Code' },
		];
		
		// You can't mark code, as it's highlighted automatically
		if (block.isCode()) {
			canMark = false;
		};
		
		// You can't make headers bold, since they are already bold
		if (block.isHeader()) {
			markActions = markActions.filter((it: any) => { return [ I.MarkType.Bold, I.MarkType.Code ].indexOf(it.type) < 0; });
		};
		
		// You can't make quote italic, since it's already italic
		if ([ I.TextStyle.Quote ].indexOf(style) >= 0) {
			markActions = markActions.filter((it: any) => { return [ I.MarkType.Italic, I.MarkType.Code ].indexOf(it.type) < 0; });
		};
		
		let icon = DataUtil.styleIcon(type, style);
		let colorMark = Mark.getInRange(marks, I.MarkType.TextColor, range) || {};
		let bgMark = Mark.getInRange(marks, I.MarkType.BgColor, range) || {};

		let color = (
			<div className={[ 'inner', 'textColor textColor-' + (colorMark.param || 'black') ].join(' ')} />
		);
		
		let background = (
			<div className={[ 'inner', 'bgColor bgColor-' + (bgMark.param || 'default') ].join(' ')} />
		);
		
		return (
			<div className="flex" onClick={this.onMenuClick}>
				<div className="section">
					<Icon id={'button-' + blockId + '-switch'} arrow={true} tooltip="Switch style" className={[ icon, 'blockStyle', (commonStore.menuIsOpen('blockStyle') ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onMark(e, 'style'); }} />
				</div>
				
				{canMark && markActions.length ? (
					<div className="section">
						{markActions.map((action: any, i: number) => {
							let cn = [ action.icon ];
							if (Mark.getInRange(marks, action.type, range)) {
								cn.push('active');
							};
							return <Icon key={i} className={cn.join(' ')} tooltip={action.name} onClick={(e: any) => { this.onMark(e, action.type); }} />;
						})}
					</div>
				) : ''}
				
				{canMark ? (
					<div className="section">
						<Icon id={'button-' + blockId + '-color'} className={[ 'color', (commonStore.menuIsOpen('blockColor') ? 'active' : '') ].join(' ')} inner={color} tooltip="Сolor" onClick={(e: any) => { this.onMark(e, I.MarkType.TextColor); }} />
						<Icon id={'button-' + blockId + '-background'} className={[ 'color', (commonStore.menuIsOpen('blockBackground') ? 'active' : '') ].join(' ')} inner={background} tooltip="Background" onClick={(e: any) => { this.onMark(e, I.MarkType.BgColor); }} />
					</div>
				) : ''}
				
				<div className="section">
					<Icon id={'button-' + blockId + '-comment'} className="comment dn" tooltip="Comment" onClick={(e: any) => {}} />
					<Icon id={'button-' + blockId + '-more'} className={[ 'more', (commonStore.menuIsOpen('blockMore') ? 'active' : '') ].join(' ')} tooltip="More options" onClick={(e: any) => { this.onMark(e, 'more'); }} />
				</div>
			</div>
		);
	};
	
	onMark (e: any, type: any) {
		const { param } = this.props;
		const { data } = param;
		const { range } = focus;
		const { blockId, blockIds, rootId, onChange, dataset } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};
		
		const st = $(window).scrollTop();
		const { from, to } = range;
		const { content } = block;
		const node = $(ReactDOM.findDOMNode(this));
		const obj = $('#menuBlockContext');
		
		focus.apply();
		
		let { marks } = content;
		let mark: any = null;
		let isOpen = false;
		
		if ((type == 'style') && commonStore.menuIsOpen('blockStyle')) {
			isOpen = true;
		};
		
		if ((type == 'more') && commonStore.menuIsOpen('blockMore')) {
			isOpen = true;
		};
		
		if ((type == I.MarkType.TextColor) && commonStore.menuIsOpen('blockColor')) {
			isOpen = true;
		};
		
		commonStore.menuClose('blockStyle');
		commonStore.menuClose('blockMore');
		commonStore.menuClose('blockLink');
		commonStore.menuClose('blockColor');
		commonStore.menuClose('blockBackground');
		commonStore.menuClose('select');
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			
			switch (type) {
				
				default:
					marks = Mark.toggle(marks, { type: type, param: '', range: { from: from, to: to } });
					onChange(marks);
					break;
					
				case 'style':
					if (isOpen) {
						break;
					};
					
					focus.clear(false);
					commonStore.menuOpen('blockStyle', { 
						element: '#button-' + blockId + '-switch',
						type: I.MenuType.Vertical,
						offsetX: 0,
						offsetY: 15,
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Center,
						data: {
							rootId: rootId,
							blockId: blockId,
							dataset: dataset,
							onSelect: (item: any) => {
								if (item.type == I.BlockType.Text) {
									C.BlockListSetTextStyle(rootId, blockIds, item.key, (message: any) => {
										focus.set(message.blockId, { from: length, to: length });
										focus.apply();
									});
								};
								
								if (item.type == I.BlockType.Div) {
									C.BlockListSetDivStyle(rootId, blockIds, item.key, (message: any) => {
										focus.set(message.blockId, { from: 0, to: 0 });
										focus.apply();
									});
								};
								
								if (item.type == I.BlockType.Page) {
									C.BlockListConvertChildrenToPages(rootId, blockIds);
								};
								
								commonStore.menuClose(this.props.id);
							},
						}
					});
					break;
					
				case 'more':
					if (isOpen) {
						break;
					};
					
					commonStore.menuOpen('blockMore', { 
						element: '#button-' + blockId + '-more',
						type: I.MenuType.Vertical,
						offsetX: 0,
						offsetY: 15,
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Center,
						data: {
							rootId: rootId,
							blockId: blockId,
							onSelect: (item: any) => {
								commonStore.menuClose(this.props.id);
							},
						}
					});
					break;
					
				case I.MarkType.Link:
					const offset = obj.offset();

					mark = Mark.getInRange(marks, type, { from: from, to: to });

					commonStore.menuClose(this.props.id, () => {
						commonStore.menuOpen('blockLink', {
							type: I.MenuType.Horizontal,
							element: node,
							offsetX: 0,
							offsetY: 0,
							forceX: offset.left,
							forceY: offset.top,
							vertical: I.MenuDirection.Top,
							horizontal: I.MenuDirection.Center,
							data: {
								value: (mark ? mark.param : ''),
								onChange: (value: string) => {
									marks = Mark.toggle(marks, { type: type, param: value, range: { from: from, to: to } });
									onChange(marks);
									window.setTimeout(() => { focus.apply(); }, 15);
								}
							}
						});
					});
					break;
					
				case I.MarkType.TextColor:
					if (isOpen) {
						break;
					};
					
					mark = Mark.getInRange(marks, I.MarkType.TextColor, { from: from, to: to }) || {};
					
					commonStore.menuOpen('blockColor', { 
						element: '#button-' + blockId + '-color',
						type: I.MenuType.Vertical,
						offsetX: 0,
						offsetY: 15,
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Center,
						data: {
							rootId: rootId,
							blockId: blockId,
							blockIds: blockIds,
							value: String(mark.param || ''),
							onChange: (param: string) => {
								marks = Mark.toggle(marks, { type: I.MarkType.TextColor, param: param, range: { from: from, to: to } });
								onChange(marks);
								commonStore.menuClose(this.props.id);
							}
						},
					});
					break;
					
				case I.MarkType.BgColor:
					if (isOpen) {
						break;
					};
					
					mark = Mark.getInRange(marks, I.MarkType.BgColor, { from: from, to: to }) || {};
					
					commonStore.menuOpen('blockBackground', { 
						element: '#button-' + blockId + '-background',
						type: I.MenuType.Vertical,
						offsetX: 0,
						offsetY: 15,
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Center,
						data: {
							rootId: rootId,
							blockId: blockId,
							blockIds: blockIds,
							value: String(mark.param || ''),
							onChange: (param: string) => {
								marks = Mark.toggle(marks, { type: I.MarkType.BgColor, param: param, range: { from: from, to: to } });
								onChange(marks);
								commonStore.menuClose(this.props.id);
							},
						},
					});
					break;
			};
		}, Constant.delay.menu);
	};
	
	onMenuClick () {
		focus.apply();
	};
	
};

export default MenuBlockContext;