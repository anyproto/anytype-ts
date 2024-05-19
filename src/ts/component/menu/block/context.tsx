import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, Mark, UtilData, focus, keyboard, Storage, translate, UtilObject, analytics } from 'Lib';
import { blockStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const MenuBlockContext = observer(class MenuBlockContext extends React.Component<I.Menu> {
	
	menuContext = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.onMark = this.onMark.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { range } = focus.state;
		const { blockId, rootId, marks, isInsideTable } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return null;
		};
		
		const { type, content } = block;
		const { style } = content;
		const styleIcon = UtilData.styleIcon(type, style);
		const colorMark = Mark.getInRange(marks, I.MarkType.Color, range) || {};
		const bgMark = Mark.getInRange(marks, I.MarkType.BgColor, range) || {};
		const canTurn = block.canTurn() && !isInsideTable;
		const hasMore = !isInsideTable;
		const canHaveMarks = block.canHaveMarks();
		const cmd = keyboard.cmdSymbol();

		const color = (
			<div className={[ 'inner', 'textColor', 'textColor-' + (colorMark.param || 'default') ].join(' ')} />
		);
		const background = (
			<div className={[ 'inner', 'bgColor', 'bgColor-' + (bgMark.param || 'default') ].join(' ')} />
		);
		
		let markActions = [
			{ type: I.MarkType.Bold, icon: 'bold', name: translate('commonBold'), caption: `${cmd} + B` },
			{ type: I.MarkType.Italic, icon: 'italic', name: translate('commonItalic'), caption: `${cmd} + I` },
			{ type: I.MarkType.Strike, icon: 'strike', name: translate('commonStrikethrough'), caption: `${cmd} + Shift + S` },
			{ type: I.MarkType.Underline, icon: 'underline', name: translate('commonUnderline'), caption: `${cmd} + U` },
			{ type: I.MarkType.Link, icon: 'link', name: translate('commonLink'), caption: `${cmd} + K` },
			{ type: I.MarkType.Code, icon: 'kbd', name: translate('commonCode'), caption: `${cmd} + L` },
		];

		// You can't make headers bold, since they are already bold
		if (block.isTextHeader()) {
			markActions = markActions.filter(it => ![ I.MarkType.Bold ].includes(it.type));
		};
		
		return (
			<div className="flex">
				{canTurn ? (
					<div className="section">
						<Icon 
							id={`button-${blockId}-style`} 
							arrow={true} 
							tooltip={translate('menuBlockContextSwitchStyle')} 
							tooltipY={I.MenuDirection.Top} 
							className={[ styleIcon, 'blockStyle' ].join(' ')} 
							onMouseDown={e => this.onMark(e, 'style')} 
						/>
					</div>
				) : ''}
				
				{canHaveMarks ? (
					<React.Fragment>
						{markActions.length ? (
							<div className="section">
								{markActions.map((action: any, i: number) => {
									const cn = [ action.icon ];

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

									return (
										<Icon 
											id={`button-${blockId}-${action.type}`} 
											key={i} 
											className={cn.join(' ')} 
											tooltip={action.name}
											tooltipCaption={action.caption}
											tooltipY={I.MenuDirection.Top}
											onMouseDown={e => this.onMark(e, action.type)} 
										/>
									);
								})}
							</div>
						) : ''}

						<div className="section">
							<Icon 
								id={`button-${blockId}-${I.MarkType.Color}`}
								className="color"
								inner={color}
								tooltip={translate('commonColor')}
								tooltipCaption={`${cmd} + Shift + C`}
								tooltipY={I.MenuDirection.Top}
								onMouseDown={e => this.onMark(e, I.MarkType.Color)} 
							/>

							<Icon
								id={`button-${blockId}-${I.MarkType.BgColor}`}
								className="color"
								inner={background} 
								tooltip={translate('commonBackground')}
								tooltipCaption={`${cmd} + Shift + H`}
								tooltipY={I.MenuDirection.Top}
								onMouseDown={e => this.onMark(e, I.MarkType.BgColor)} 
							/>
						</div>
					</React.Fragment>
				) : ''}
				
				{hasMore ? (
					<div className="section">
						<Icon
							id={`button-${blockId}-comment`}
							className="comment dn"
							tooltip={translate('commonComment')}
							tooltipY={I.MenuDirection.Top}
						/>

						<Icon 
							id={`button-${blockId}-more`}
							className="more"
							tooltip={translate('menuBlockContextMoreOptions')}
							tooltipY={I.MenuDirection.Top}
							onMouseDown={e => this.onMark(e, 'more')}
						/>
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		const { getId } = this.props;
		const obj = $(`#${getId()}`);

		obj.off('click mousedown').on('click mousedown', (e: any) => {
			const target = $(e.target);
			if (!target.hasClass('icon') && !target.hasClass('inner')) {
				e.preventDefault();
				e.stopPropagation();
			};
		});
	};

	componentWillUnmount(): void {
		menuStore.closeAll(Constant.menuIds.context.concat('selectContext'));
	};

	onMark (e: any, type: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, close, getId, getSize } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId, onChange, range } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};
		
		const { from, to } = range;

		keyboard.disableContextClose(true);
		focus.set(blockId, range);

		let marks = data.marks || [];
		let mark: any = null;
		let menuId = '';
		let menuParam: any = {
			element: `#${getId()} #button-${blockId}-${type}`,
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {
				rootId,
				blockId,
				blockIds,
			} as any,
		};

		let closeContext = false;
		let focusApply = true;
		
		switch (type) {
			
			default: {
				marks = Mark.toggle(marks, { type, param: '', range: { from, to } });
				menuStore.updateData(this.props.id, { marks });
				onChange(marks);
				break;
			};
				
			case 'style': {
				menuId = 'blockStyle';

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

				focusApply = false;
				break;
			};
				
			case 'more': {
				menuId = 'selectContext';

				menuParam = Object.assign(menuParam, {
					component: 'select',
					onOpen: context => this.menuContext = context,
				});

				menuParam.data = Object.assign(menuParam.data, {
					options: [
						{ id: 'turnObject', icon: 'object', name: translate('commonTurnIntoObject'), arrow: true },
						{ id: 'move', icon: 'move', name: translate('commonMoveTo'), arrow: true },
						{ id: 'align', name: translate('commonAlign'), icon: [ 'align', UtilData.alignHIcon(block.hAlign) ].join(' '), arrow: true },
						{ id: 'blockRemove', icon: 'remove', name: translate('commonDelete') }
					],
					onOver: (e: any, item: any) => {
						if (!this.menuContext || menuStore.isAnimating(this.menuContext.props.id)) {
							return;
						};

						if (!item.arrow) {
							//menuStore.closeAll(Constant.menuIds.context);
							return;
						};

						this.onMoreOver(item);
					},

					onSelect: (e: any, item: any) => {
						if (item.arrow) {
							return;
						};

						switch (item.id) {
							case 'blockRemove': {
								focus.clear(true);
								C.BlockListDelete(rootId, [ blockId ], () => close());
								break;
							};
						};
					},
				});
				break;
			};
				
			case I.MarkType.Link: {
				menuId = 'blockLink';

				mark = Mark.getInRange(marks, type, { from, to });

				menuParam = Object.assign(menuParam, {
					offsetY: param.offsetY,
					rect: param.recalcRect(),
					width: getSize().width,
					noFlipY: true,
				});

				menuParam.data = Object.assign(menuParam.data, {
					filter: mark ? mark.param : '',
					type: mark ? mark.type : null,
					skipIds: [ rootId ],
					onChange: (newType: I.MarkType, param: string) => {
						marks = Mark.toggleLink({ type: newType, param, range: { from, to } }, marks);
						menuStore.updateData(this.props.id, { marks });
						onChange(marks);

						window.setTimeout(() => focus.apply(), 15);
					}
				});

				closeContext = true;
				focusApply = false;
				break;
			};
			
			case I.MarkType.BgColor:
			case I.MarkType.Color: {
				let storageKey = '';

				switch (type) {
					case I.MarkType.Color: {
						storageKey = 'color';
						menuId = 'blockColor';
						break;
					};

					case I.MarkType.BgColor: {
						storageKey = 'bgColor';
						menuId = 'blockBackground';
						break;
					};
				};

				mark = Mark.getInRange(marks, type, { from, to });
				menuParam.data = Object.assign(menuParam.data, {
					value: (mark ? mark.param : ''),
					onChange: (param: string) => {
						if (param) {
							Storage.set(storageKey, param);
						};

						marks = Mark.toggle(marks, { type, param, range: { from, to } });
						menuStore.updateData(this.props.id, { marks });
						onChange(marks);
					},
				});
				break;
			};
		};

		focusApply ? focus.apply() : focus.clear(false);

		if (menuId && !menuStore.isOpen(menuId)) {
			const menuIds = [].concat(Constant.menuIds.context);
			
			if (closeContext) {
				menuIds.push(this.props.id);
			};

			menuStore.closeAll(menuIds, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};

	onMoreOver (item: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const context = this.menuContext;
		const route = analytics.route.menuContext;

		if (!block) {
			return;
		};

		const cb = () => {
			close();
			focus.clear(true);
		};

		let menuId = '';
		let menuParam: any = {
			element: `#${context.getId()} #item-${item.id}`,
			offsetX: context.getSize().width,
			horizontal: I.MenuDirection.Left,
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				rootId,
				blockId,
				blockIds,
			} as any,
		};

		switch (item.id) {
			case 'move': {
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
					],
					type: I.NavigationType.Move, 
					skipIds: [ rootId ],
					position: I.BlockPosition.Bottom,
					onSelect: () => {
						cb();
					}
				});
				break;
			};

			case 'turnObject': {
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
					],
					onClick: (item: any) => {
						C.BlockListConvertToObjects(rootId, blockIds, item.uniqueKey, (message: any) => {
							analytics.createObject(item.id, item.recommendedLayout, route, message.middleTime);
						});

						cb();
					},
				});
				break;
			};

			case 'align': {
				menuId = 'blockAlign';
				menuParam.data = Object.assign(menuParam.data, {
					value: block.hAlign,
					onSelect: (align: I.BlockHAlign) => {
						C.BlockListSetAlign(rootId, blockIds, align, () => {
							analytics.event('ChangeBlockAlign', { align, count: 1, route });
						});
						cb();
					}
				});
				break;
			};
		};

		if (menuId && !menuStore.isOpen(menuId)) {
			menuStore.closeAll(Constant.menuIds.context, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};
	
});

export default MenuBlockContext;