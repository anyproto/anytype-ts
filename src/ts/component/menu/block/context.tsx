import * as React from 'react';
import { Icon } from 'ts/component';
import { I, C, Mark, DataUtil, focus, keyboard, Storage } from 'ts/lib';
import { blockStore, menuStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

const MenuBlockContext = observer(class MenuBlockContext extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onMark = this.onMark.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { range } = focus.state;
		const { config } = commonStore;
		const { blockId, rootId, marks, isInsideTable } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return null;
		};
		
		const { type, content } = block;
		const { style } = content;
		const styleIcon = DataUtil.styleIcon(type, style);
		const colorMark = Mark.getInRange(marks, I.MarkType.Color, range) || {};
		const bgMark = Mark.getInRange(marks, I.MarkType.BgColor, range) || {};
		const canTurn = block.canTurn() && !isInsideTable;
		const hasMore = !isInsideTable;

		const color = (
			<div className={[ 'inner', 'textColor', 'textColor-' + (colorMark.param || 'default') ].join(' ')} />
		);
		const background = (
			<div className={[ 'inner', 'bgColor', 'bgColor-' + (bgMark.param || 'default') ].join(' ')} />
		);
		
		let markActions = [
			{ type: I.MarkType.Bold, icon: 'bold', name: 'Bold' },
			{ type: I.MarkType.Italic, icon: 'italic', name: 'Italic' },
			{ type: I.MarkType.Strike, icon: 'strike', name: 'Strikethrough' },
			{ type: I.MarkType.Under, icon: 'under', name: 'Underline' },
			{ type: I.MarkType.Link, icon: 'link', name: 'Link' },
			{ type: I.MarkType.Code, icon: 'kbd', name: 'Code' },
		];
		
		// You can't make headers bold, since they are already bold
		if (block.isTextHeader()) {
			markActions = markActions.filter((it: any) => { return ![ I.MarkType.Bold ].includes(it.type); });
		};

		return (
			<div className="flex">
				{canTurn ? (
					<div className="section">
						<Icon id={'button-' + blockId + '-style'} arrow={true} tooltip="Switch style" tooltipY={I.MenuDirection.Top} className={[ styleIcon, 'blockStyle' ].join(' ')} onMouseDown={(e: any) => { this.onMark(e, 'style'); }} />
					</div>
				) : ''}
				
				{block.canHaveMarks() && markActions.length ? (
					<div className="section">
						{markActions.map((action: any, i: number) => {
							let cn = [ action.icon ];
							let isSet = false;

							if (action.type == I.MarkType.Link) {
								const inRange = Mark.getInRange(marks, I.MarkType.Link, range) || Mark.getInRange(marks, I.MarkType.Object, range);
								isSet = inRange && inRange.param;
							} else {
								isSet = Mark.getInRange(marks, action.type, range);
							};
							if (isSet) {
								cn.push('active');
							};
							return <Icon id={`button-${blockId}-${action.type}`} key={i} className={cn.join(' ')} tooltip={action.name} tooltipY={I.MenuDirection.Top}  onMouseDown={(e: any) => { this.onMark(e, action.type); }} />;
						})}
					</div>
				) : ''}
				
				{block.canHaveMarks() ? (
					<div className="section">
						<Icon id={`button-${blockId}-${I.MarkType.Color}`} className="color" inner={color} tooltip="Сolor" tooltipY={I.MenuDirection.Top}  onMouseDown={(e: any) => { this.onMark(e, I.MarkType.Color); }} />
						<Icon id={`button-${blockId}-${I.MarkType.BgColor}`} className="color" inner={background} tooltip="Background" tooltipY={I.MenuDirection.Top}  onMouseDown={(e: any) => { this.onMark(e, I.MarkType.BgColor); }} />
					</div>
				) : ''}
				
				{hasMore ? (
					<div className="section">
						<Icon id={'button-' + blockId + '-comment'} className="comment dn" tooltip="Comment" tooltipY={I.MenuDirection.Top}  onMouseDown={(e: any) => {}} />
						<Icon id={'button-' + blockId + '-more'} className="more" tooltip="More options" tooltipY={I.MenuDirection.Top}  onMouseDown={(e: any) => { this.onMark(e, 'more'); }} />
					</div>
				) : ''}
			</div>
		);
	};

	onMark (e: any, type: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, close, getId, dataset } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId, onChange, range } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};
		
		const { from, to } = range;

		keyboard.disableContext(true);
		focus.set(blockId, range);
		//analytics.event(Util.toUpperCamelCase(`${getId()}-action`), { id: type });

		if (type != 'style') {
			focus.apply();
		};
		
		let marks = data.marks || [];
		let mark: any = null;
		let menuId = '';
		let menuParam: any = {
			element: `#${getId()} #button-${blockId}-${type}`,
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {
				rootId: rootId,
				blockId: blockId,
				blockIds: blockIds,
			} as any,
		};

		let closeContext = false;
		
		switch (type) {
			
			default:
				marks = Mark.toggle(marks, { type: type, param: '', range: { from: from, to: to } });
				menuStore.updateData(this.props.id, { marks });
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
							C.BlockDivListSetStyle(rootId, blockIds, item.itemId, (message: any) => {
								focus.set(message.blockId, { from: 0, to: 0 });
								focus.apply();
							});
						};
						
						if (item.type == I.BlockType.Page) {
							C.BlockListConvertToObjects(rootId, blockIds, '');
						};
						
						close();
					},
				});

				menuId = 'blockStyle';
				break;
				
			case 'more':
				menuId = 'blockMore';
				menuParam.subIds = Constant.menuIds.more;

				menuParam.data = Object.assign(menuParam.data, {
					onSelect: () => {
						focus.clear(true);
						close();
					},
					onMenuSelect: () => {
						focus.clear(true);
						close();
					},
				});
				break;
				
			case I.MarkType.Link:
				mark = Mark.getInRange(marks, type, { from: from, to: to });
				menuParam.rect = param.rect;
				menuParam.offsetY = 0;
				menuParam.data = Object.assign(menuParam.data, {
					filter: mark ? mark.param : '',
					type: mark ? mark.type : null,
					skipIds: [ rootId ],
					onChange: (newType: I.MarkType, param: string) => {
						marks = Mark.toggleLink({ type: newType, param: param, range: { from: from, to: to } }, marks);
						menuStore.updateData(this.props.id, { marks });
						onChange(marks);

						window.setTimeout(() => { focus.apply(); }, 15);
					}
				});

				closeContext = true;
				menuId = 'blockLink';
				break;
				
			case I.MarkType.Color:
				mark = Mark.getInRange(marks, I.MarkType.Color, { from: from, to: to });
				menuParam.data = Object.assign(menuParam.data, {
					value: (mark ? mark.param : ''),
					onChange: (param: string) => {
						if (!mark && !param) {
							return;
						};

						Storage.set('color', param);

						marks = Mark.toggle(marks, { type: I.MarkType.Color, param: param, range: { from: from, to: to } });
						menuStore.updateData(this.props.id, { marks });
						onChange(marks);
					},
				});

				menuId = 'blockColor';
				break;
				
			case I.MarkType.BgColor:
				mark = Mark.getInRange(marks, I.MarkType.BgColor, { from: from, to: to });
				menuParam.data = Object.assign(menuParam.data, {
					value: (mark ? mark.param : ''),
					onChange: (param: string) => {
						if (!mark && !param) {
							return;
						};

						Storage.set('bgColor', param);

						marks = Mark.toggle(marks, { type: I.MarkType.BgColor, param: param, range: { from: from, to: to } });
						menuStore.updateData(this.props.id, { marks });
						onChange(marks);
					},
				});
				menuId = 'blockBackground';
				break;
		};

		if (menuId && !menuStore.isOpen(menuId)) {
			menuStore.closeAll(Constant.menuIds.context, () => {
				if (closeContext) {
					menuStore.close('blockContext');
				}

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

});

export default MenuBlockContext;