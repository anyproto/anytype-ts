import React, { forwardRef, useRef, useEffect } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';
import { focus } from 'Lib/focus';

const MenuBlockContext = forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, getId, getContainer, getSize, close } = props;
	const { data, className, classNameWrap } = param;
	const { range } = focus.state;
	const { blockId, rootId, blockIds, marks, isInsideTable, onChange } = data;
	const menuContext = useRef(null);
	const keydownHandler = useRef(null);
	const clickMousedownHandler = useRef(null);

	useEffect(() => {
		rebind();

		return () => {
			unbind();
			S.Menu.closeAll(J.Menu.context.concat('selectContext'));
		};
	}, []);

	const rebind = () => {
		unbind();

		clickMousedownHandler.current = (e: any) => {
			const target = e.target as HTMLElement;
			if (!U.Dom.hasClass(target, 'icon') && !U.Dom.hasClass(target, 'inner')) {
				e.preventDefault();
				e.stopPropagation();
			};
		};
		const obj = getContainer();
		if (obj) {
			U.Dom.addEvents(obj, [
				[ 'click', clickMousedownHandler.current ],
				[ 'mousedown', clickMousedownHandler.current ],
			]);
		};

		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
	};

	const unbind = () => {
		const obj = getContainer();
		if (clickMousedownHandler.current && obj) {
			U.Dom.removeEvents(obj, [
				[ 'click', clickMousedownHandler.current ],
				[ 'mousedown', clickMousedownHandler.current ],
			]);
			clickMousedownHandler.current = null;
		};
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('shift', e, () => props.close());
	};

	const onMark = (e: any, type: any) => {
		e.preventDefault();
		e.stopPropagation();

		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const { from, to } = Mark.trimRange(block.getText(), range);
		const object = S.Detail.get(rootId, rootId);
		const element = getContainer();

		keyboard.disableContextClose(true);
		focus.set(blockId, range);

		let marks = data.marks || [];
		let mark: any = null;
		let menuId = '';
		let menuParam: any = {
			element: `#${getId()} #button-${U.Common.esc(blockId)}-${type}`,
			className: [ className, 'fromContext' ].join(' '),
			classNameWrap,
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
				S.Menu.updateData(props.id, { marks });
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
					onOpen: context => menuContext.current = context,
				});

				const canQuoteInComment = !U.Object.isTemplateType(object?.type);
				const quoteInComment = canQuoteInComment
					? { id: 'quoteInComment', iconParam: { name: 'menu/action/quote' }, name: translate('commonQuoteInComment') }
					: null;

				menuParam.data = Object.assign(menuParam.data, {
					options: [
						quoteInComment,
						{ id: 'turnObject', iconParam: { name: 'menu/action/object' }, name: translate('commonTurnIntoObject'), arrow: true },
						{ id: 'move', iconParam: { name: 'menu/action/move' }, name: translate('commonMoveTo'), arrow: true },
						{ id: 'align', name: translate('commonAlign'), iconParam: { name: U.Data.alignHIcon(block.hAlign) }, arrow: true },
						{ id: 'blockRemove', iconParam: { name: 'menu/action/remove' }, name: translate('commonDelete') }
					].filter(it => it),
					onOver: (e: any, item: any) => {
						if (S.Menu.isAnimating(menuContext.current?.props.id)) {
							return;
						};

						if (!item.arrow) {
							S.Menu.closeAll(J.Menu.selectContext);
							return;
						};

						onMoreOver(item);
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

							case 'quoteInComment': {
								const fullText = block.getText();
								const text = fullText.substring(from, to);
								const length = text.length;
								const sliced: I.Mark[] = (block.content?.marks || [])
									.filter(m => m.range && (m.range.from < to) && (m.range.to > from))
									.map(m => {
										const mappedFrom = Math.max(0, m.range.from - from);
										const mappedTo = Math.min(length, m.range.to - from);
										return { ...m, range: { from: mappedFrom, to: mappedTo } };
									})
									.filter(m => (m.range.to > m.range.from));

								const part: I.CommentContentPart = {
									style: I.TextStyle.Quote,
									type: I.BlockType.Text,
									text,
									marks: sliced,
									editorQuote: { blockId },
								};

								close();
								// Defer dispatch so the menu close stack unwinds before
								// the section reacts — otherwise React state updates from
								// close() and the form mount can collide.
								window.setTimeout(() => {
									window.dispatchEvent(new CustomEvent(`commentQuote.${rootId}`, { detail: part }));
								}, 0);
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

				const rect = (element?.getBoundingClientRect() || {}) as DOMRect;
				rect.y = Number(rect.y) + window.scrollY;

				menuParam = Object.assign(menuParam, {
					offsetY: -rect.height,
					rect,
					width: getSize().width,
					noFlipY: true,
				});

				let filter = '';
				let newType = null;

				if (mark) {
					filter = mark.param;
					newType = mark.type;
				} else {
					filter = block.getText().substring(from, to);
				};

				menuParam.data = Object.assign(menuParam.data, {
					filter,
					type: newType,
					skipIds: [ rootId ],
					onChange: (newType: I.MarkType, param: string) => {
						marks = Mark.toggleLink({ type: newType, param, range: { from, to } }, marks);
						S.Menu.updateData(props.id, { marks });
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
						S.Menu.updateData(props.id, { marks });

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
				menuIds.push(props.id);
			};

			S.Menu.closeAll(menuIds, () => {
				window.setTimeout(() => S.Menu.open(menuId, menuParam), 0);
			});
		};
	};

	const onMoreOver = (item: any) => {
		const block = S.Block.getLeaf(rootId, blockId);
		const context = menuContext.current;
		const route = analytics.route.menuContext;

		if (!block) {
			return;
		};

		const cb = () => {
			close();
			focus.clear(true);
		};

		const menuParam: any = {
			element: `#${context.getId()} #item-${U.Common.esc(item.id)}`,
			className, 
			classNameWrap,
			offsetX: context.getSize().width,
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
					canAdd: true,
					filter: '',
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template }
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

	const block = S.Block.getLeaf(rootId, blockId);
	if (!block) {
		return null;
	};
	
	const { type, content } = block;
	const { style } = content;
	const styleIcon = U.Data.styleIcon(type, style);
	const colorMark: any = Mark.getInRange(marks, I.MarkType.Color, range) || {};
	const bgMark: any = Mark.getInRange(marks, I.MarkType.BgColor, range) || {};
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
		{ type: I.MarkType.Bold, icon: 'menu/mark/bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
		{ type: I.MarkType.Italic, icon: 'menu/mark/italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
		{ type: I.MarkType.Strike, icon: 'menu/mark/strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
		{ type: I.MarkType.Underline, icon: 'menu/mark/underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
		{ type: I.MarkType.Link, icon: 'menu/mark/link', name: translate('commonLink'), caption: keyboard.getCaption('textLink') },
		{ type: I.MarkType.Code, icon: 'menu/mark/code', name: translate('commonInlineCode'), caption: keyboard.getCaption('textCode') },
	];

	// Headers are already bold, so hide the bold button
	if (block.isTextHeader()) {
		markActions = markActions.filter(it => ![ I.MarkType.Bold ].includes(it.type));
	};

	return (
		<div className="flex">
			{canTurn ? (
				<div className="section">
					<Icon
						id={`button-${blockId}-style`}
						name={styleIcon}
						arrow={true}
						tooltipParam={{ text: translate('menuBlockContextSwitchStyle') }}
						className="blockStyle"
						onMouseDown={e => onMark(e, 'style')}
					/>
				</div>
			) : ''}
			
			{canHaveMarks ? (
				<>
					{markActions.length ? (
						<div className="section">
							{markActions.map((action: any, i: number) => {
								let isSet = false;
								if (action.type == I.MarkType.Link) {
									const inRange = Mark.getInRange(marks, I.MarkType.Link, range) || Mark.getInRange(marks, I.MarkType.Object, range);
									isSet = inRange && inRange.param ? true : false;
								} else {
									isSet = !!Mark.getInRange(marks, action.type, range);
								};

								return (
									<Icon
										id={`button-${blockId}-${action.type}`}
										key={i}
										name={action.icon}
										color={isSet ? 'default' : ''}
										className={isSet ? 'active' : ''}
										tooltipParam={{ text: action.name, caption: action.caption }}
										onMouseDown={e => onMark(e, action.type)}
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
							onMouseDown={e => onMark(e, I.MarkType.Color)} 
						/>

						<Icon
							id={`button-${blockId}-${I.MarkType.BgColor}`}
							className="color"
							inner={background} 
							tooltipParam={{ text: translate('commonBackground'), caption: keyboard.getCaption('textBackground') }}
							onMouseDown={e => onMark(e, I.MarkType.BgColor)} 
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
						name="common/more" className="more"
						tooltipParam={{ text: translate('menuBlockContextMoreOptions') }}
						onMouseDown={e => onMark(e, 'more')}
					/>
				</div>
			) : ''}
		</div>
	);

});

export default MenuBlockContext;