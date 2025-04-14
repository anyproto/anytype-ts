import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, S, U, J, Mark, focus, keyboard, Storage, translate, analytics } from 'Lib';

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
		const block = S.Block.getLeaf(rootId, blockId);

		if (!block) {
			return null;
		};
		
		const { type, content } = block;
		const { style } = content;
		const styleIcon = U.Data.styleIcon(type, style);
		const colorMark = Mark.getInRange(marks, I.MarkType.Color, range) || {};
		const bgMark = Mark.getInRange(marks, I.MarkType.BgColor, range) || {};
		const canTurn = block.canTurn() && !isInsideTable;
		const hasMore = !isInsideTable;
		const canHaveMarks = block.canHaveMarks();

		const color = (
			<div className={[ 'inner', 'textColor', `textColor-${(colorMark.param || 'default')}` ].join(' ')} />
		);
		const background = (
			<div className={[ 'inner', 'bgColor', `bgColor-${(bgMark.param || 'default')}` ].join(' ')} />
		);
		
		let markActions = [
			{ type: I.MarkType.Bold, icon: 'bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
			{ type: I.MarkType.Italic, icon: 'italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
			{ type: I.MarkType.Strike, icon: 'strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
			{ type: I.MarkType.Underline, icon: 'underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
			{ type: I.MarkType.Link, icon: 'link', name: translate('commonLink'), caption: keyboard.getCaption('textLink') },
			{ type: I.MarkType.Code, icon: 'kbd', name: translate('commonCode'), caption: keyboard.getCaption('textCode') },
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
							tooltipParam={{ text: translate('menuBlockContextSwitchStyle') }} 
							className={[ styleIcon, 'blockStyle' ].join(' ')} 
							onMouseDown={e => this.onMark(e, 'style')} 
						/>
					</div>
				) : ''}
				
				{canHaveMarks ? (
					<>
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
											tooltipParam={{ text: action.name, caption: action.caption }}
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
								tooltipParam={{ text: translate('commonColor'), caption: keyboard.getCaption('textColor') }}
								onMouseDown={e => this.onMark(e, I.MarkType.Color)} 
							/>

							<Icon
								id={`button-${blockId}-${I.MarkType.BgColor}`}
								className="color"
								inner={background} 
								tooltipParam={{ text: translate('commonBackground'), caption: keyboard.getCaption('textBackground') }}
								onMouseDown={e => this.onMark(e, I.MarkType.BgColor)} 
							/>
						</div>
					</>
				) : ''}
				
				{hasMore ? (
					<div className="section">
						<Icon
							id={`button-${blockId}-comment`}
							className="comment dn"
							tooltipParam={{ text: translate('commonComment') }}
						/>

						<Icon 
							id={`button-${blockId}-more`}
							className="more"
							tooltipParam={{ text: translate('menuBlockContextMoreOptions') }}
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
		S.Menu.closeAll(J.Menu.context.concat('selectContext'));
	};

	onMark (e: any, type: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, close, getId, getSize } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId, onChange, range } = data;
		const block = S.Block.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};
		
		const { from, to } = range;
		const object = S.Detail.get(rootId, rootId);

		keyboard.disableContextClose(true);
		focus.set(blockId, range);

		let marks = data.marks || [];
		let mark: any = null;
		let menuId = '';
		let menuParam: any = {
			element: `#${getId()} #button-${blockId}-${type}`,
			className: 'fromContext',
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
				S.Menu.updateData(this.props.id, { marks });
				onChange(marks);

				analytics.event('ChangeTextStyle', { type, count: 1, objectType: object?.type });
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
							C.BlockListConvertToObjects(rootId, blockIds, '', '', U.Data.getLinkBlockParam('', I.ObjectLayout.Page, false));
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
					subIds: J.Menu.selectContext,
					onOpen: context => this.menuContext = context,
				});

				menuParam.data = Object.assign(menuParam.data, {
					options: [
						{ id: 'turnObject', icon: 'object', name: translate('commonTurnIntoObject'), arrow: true },
						{ id: 'move', icon: 'move', name: translate('commonMoveTo'), arrow: true },
						{ id: 'align', name: translate('commonAlign'), icon: [ 'align', U.Data.alignHIcon(block.hAlign) ].join(' '), arrow: true },
						{ id: 'blockRemove', icon: 'remove', name: translate('commonDelete') }
					],
					onOver: (e: any, item: any) => {
						if (!this.menuContext || S.Menu.isAnimating(this.menuContext.props.id)) {
							return;
						};

						if (!item.arrow) {
							S.Menu.closeAll(J.Menu.selectContext);
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
						S.Menu.updateData(this.props.id, { marks });
						onChange(marks);

						analytics.event('ChangeTextStyle', { type: newType, count: 1, objectType: object?.type });
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
						S.Menu.updateData(this.props.id, { marks });

						analytics.event('ChangeTextStyle', { type, count: 1, objectType: object?.type });
						onChange(marks);
					},
				});
				break;
			};
		};

		focusApply ? focus.apply() : focus.clear(false);

		if (menuId && !S.Menu.isOpen(menuId)) {
			const menuIds = [].concat(J.Menu.context);
			
			if (closeContext) {
				menuIds.push(this.props.id);
			};

			S.Menu.closeAll(menuIds, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	onMoreOver (item: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = S.Block.getLeaf(rootId, blockId);
		const context = this.menuContext;
		const route = analytics.route.menuContext;

		if (!block) {
			return;
		};

		const cb = () => {
			close();
			focus.clear(true);
		};

		const menuParam: any = {
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

		let menuId = '';

		switch (item.id) {
			case 'move': {
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
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
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					],
					onClick: (item: any) => {
						C.BlockListConvertToObjects(rootId, blockIds, item.uniqueKey, item.defaultTemplateId, U.Data.getLinkBlockParam('', item.recommendedLayout, false), (message: any) => {
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

		if (menuId && !S.Menu.isOpen(menuId)) {
			S.Menu.closeAll(J.Menu.selectContext, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};
	
});

export default MenuBlockContext;