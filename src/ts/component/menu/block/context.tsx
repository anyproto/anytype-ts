import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, C, Mark, Util, DataUtil, focus, keyboard } from 'ts/lib';
import { blockStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class MenuBlockContext extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
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
		
		let markActions = [
			{ type: I.MarkType.Bold, icon: 'bold', name: 'Bold' },
			{ type: I.MarkType.Italic, icon: 'italic', name: 'Italic' },
			{ type: I.MarkType.Strike, icon: 'strike', name: 'Strikethrough' },
			{ type: I.MarkType.Link, icon: 'link', name: 'Link' },
			{ type: I.MarkType.Code, icon: 'kbd', name: 'Code' },
		];
		
		// You can't make headers bold, since they are already bold
		if (block.isTextHeader()) {
			markActions = markActions.filter((it: any) => { return [ I.MarkType.Bold ].indexOf(it.type) < 0; });
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
			<div className="flex">
				{block.canTurn() ? (
					<div className="section">
						<Icon id={'button-' + blockId + '-style'} arrow={true} tooltip="Switch style" menuId="blockStyle" className={[ icon, 'blockStyle' ].join(' ')} onClick={(e: any) => { this.onMark(e, 'style'); }} />
					</div>
				) : ''}
				
				{block.canHaveMarks() && markActions.length ? (
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
				
				{block.canHaveMarks() ? (
					<div className="section">
						<Icon id={'button-' + blockId + '-color'} menuId="blockColor" className="color" inner={color} tooltip="Сolor" onClick={(e: any) => { this.onMark(e, 'color'); }} />
						<Icon id={'button-' + blockId + '-background'} menuId="blockBackground" className="color" inner={background} tooltip="Background" onClick={(e: any) => { this.onMark(e, 'background'); }} />
					</div>
				) : ''}
				
				<div className="section">
					<Icon id={'button-' + blockId + '-comment'} className="comment dn" tooltip="Comment" onClick={(e: any) => {}} />
					<Icon id={'button-' + blockId + '-more'} menuId="blockMore" className="more" tooltip="More options" onClick={(e: any) => { this.onMark(e, 'more'); }} />
				</div>
			</div>
		);
	};

	onMark (e: any, type: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, close } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId, onChange, dataset, range } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};
		
		const { from, to } = range;
		const { content } = block;
		const node = $(ReactDOM.findDOMNode(this));
		const obj = $('#menuBlockContext');

		focus.set(blockId, range);
		if (type != 'style') {
			focus.apply();
		};
		
		let marks = Util.objectCopy(content.marks);
		let mark: any = null;
		let menuId = '';
		let menuParam = {
			element: '#button-' + blockId + '-' + type,
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			onClose: () => {
				keyboard.disableContext(false);
			},
			data: {
				rootId: rootId,
				blockId: blockId,
				blockIds: blockIds,
				dataset: dataset,
			} as any,
		};
		
		switch (type) {
			
			default:
				marks = Mark.toggle(marks, { type: type, param: '', range: { from: from, to: to } });
				onChange(marks);
				break;
				
			case 'style':
				focus.clear(false);
				menuParam.data = Object.assign(menuParam.data, {
					onSelect: (item: any) => {
						if (item.type == I.BlockType.Text) {
							C.BlockListTurnInto(rootId, blockIds, item.itemId, (message: any) => {
								focus.set(message.blockId, { from: length, to: length });
								focus.apply();
							});
						};
						
						if (item.type == I.BlockType.Div) {
							C.BlockListSetDivStyle(rootId, blockIds, item.itemId, (message: any) => {
								focus.set(message.blockId, { from: 0, to: 0 });
								focus.apply();
							});
						};
						
						if (item.type == I.BlockType.Page) {
							C.BlockListConvertChildrenToPages(rootId, blockIds, '');
						};
						
						close();
					},
				});

				menuId = 'blockStyle';
				break;
				
			case 'more':
				menuId = 'blockMore';
				break;
				
			case I.MarkType.Link:
				const offset = obj.offset();
				mark = Mark.getInRange(marks, type, { from: from, to: to });
				close();

				menuParam = Object.assign(menuParam, {
					type: I.MenuType.Horizontal,
					element: node,
					fixedX: offset.left,
					fixedY: offset.top,
					vertical: I.MenuDirection.Top,
					horizontal: I.MenuDirection.Center,
				});
				menuParam.data = Object.assign(menuParam.data, {
					value: (mark ? mark.param : ''),
					onChange: (param: string) => {
						if (!mark && !param) {
							return;
						};

						marks = Mark.toggle(marks, { type: type, param: param, range: { from: from, to: to } });
						onChange(marks);
						window.setTimeout(() => { focus.apply(); }, 15);
					}
				});

				menuId = 'blockLink';
				break;
				
			case 'color':
				mark = Mark.getInRange(marks, I.MarkType.TextColor, { from: from, to: to });
				menuParam.data = Object.assign(menuParam.data, {
					value: (mark ? mark.param : ''),
					onChange: (param: string) => {
						if (!mark && !param) {
							return;
						};

						marks = Mark.toggle(marks, { type: I.MarkType.TextColor, param: param, range: { from: from, to: to } });
						onChange(marks);
					},
				});

				menuId = 'blockColor';
				break;
				
			case 'background':
				mark = Mark.getInRange(marks, I.MarkType.BgColor, { from: from, to: to });
				menuParam.data = Object.assign(menuParam.data, {
					value: (mark ? mark.param : ''),
					onChange: (param: string) => {
						if (!mark && !param) {
							return;
						};

						marks = Mark.toggle(marks, { type: I.MarkType.BgColor, param: param, range: { from: from, to: to } });
						onChange(marks);
					},
				});
				menuId = 'blockBackground';
				break;
		};

		if (menuId && !menuStore.isOpen(menuId)) {
			keyboard.disableContext(true);
			menuStore.closeAll(Constant.menuIds.context, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};
	
	componentDidMount () {
		const { getId } = this.props;
		const obj = $(`#${getId()}`);

		obj.unbind('click mousedown').on('click mousedown', (e: any) => {
			const target = $(e.target);
			if (!target.hasClass('icon') && !target.hasClass('inner')) {
				e.preventDefault();
				e.stopPropagation();
			};
		});
	};

};

export default MenuBlockContext;