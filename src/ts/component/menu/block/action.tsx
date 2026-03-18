import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Filter, MenuItemVertical } from 'Component';
import { I, C, S, U, J, keyboard, focus, Action, translate, analytics, Dataview, Renderer } from 'Lib';

const CB_KEYS = { c: 'clipboardCopy', x: 'clipboardCut', v: 'clipboardPaste' };

const MenuBlockAction = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, setActive, onKeyDown, getId, getSize, close } = props;
	const { data, className, classNameWrap } = param;
	const { rootId, blockId, blockIds, blockRemove, range, filter } = data;
	const { focused } = focus.state;
	const n = useRef(-1);
	const filterRef = useRef(null);
	const block = S.Block.getLeaf(rootId, blockId);

	useEffect(() => {
		rebind();

		return () => {
			keyboard.setFocus(false);
			S.Menu.closeAll(J.Menu.action);
			S.Menu.clearTimeout();
		};
	}, []);

	useEffect(() => {
		n.current = 0;
		setActive(null, true);
	}, [ filter ]);
	
	const onFilterFocus = (e: any) => {
		S.Menu.closeAll(J.Menu.action);
		setActive();
	};
	
	const onFilterChange = (v: string) => {
		S.Menu.updateData(props.id, { filter: v });
	};
	
	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDownHandler(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onKeyDownHandler = (e: any) => {
		const cmd = keyboard.cmdKey();

		let ret = false;

		if (!data.filter && blockRemove) {
			keyboard.shortcut('backspace, delete', e, () => {
				blockRemove();
				ret = true;
			});
		};

		for (const key in CB_KEYS) {
			keyboard.shortcut(`${cmd}+${key}`, e, () => {
				e.preventDefault();
				e.stopPropagation();

				onClick(e, { itemId: CB_KEYS[key] });
				ret = true;
			});
		};

		if (focused || (!focused && keyboard.isFocused)) {
			keyboard.shortcut('duplicate', e, () => {
				Action.duplicate(rootId, rootId, blockIds[blockIds.length - 1], blockIds, I.BlockPosition.Bottom, () => { 
					focus.clear(true); 
				});
				filterRef.current?.blur();
				ret = true;
			});
		};

		if (!ret) {
			onKeyDown(e);
		};
	};
	
	const getSections = () => {
		if (!block) {
			return [];
		};
		
		const { hAlign, content, bgColor } = block;
		const { color, style, cardStyle } = content;
		const checkFlag = checkFlagByObject(block.getTargetObjectId());

		let sections: any[] = [];
		let hasText = true;
		let hasLink = true;
		let hasBookmark = true;
		let hasDataview = true;
		let hasFile = true;
		let hasCopyMedia = true;
		let hasAction = true;
		let hasAlign = true;
		let hasTurnText = true;
		let hasTurnDiv = true;
		let hasTurnObject = true;
		let hasTurnList = true;
		let hasTurnFile = true;
		let hasColor = true;
		let hasBg = true;
		let hasCommon = true;
		const hasClipboard = true;
		let hasQuote = false;
		
		for (const id of blockIds) {
			const block = S.Block.getLeaf(rootId, id);
			if (!block) {
				continue;
			};

			hasBookmark = hasBookmark && block.isBookmark() && checkFlag;
			hasDataview = hasBookmark && block.isDataview() && checkFlag;
			hasLink = hasLink && block.isLink() && checkFlag;
			hasFile = hasFile && block.isFile() && checkFlag;
			hasCopyMedia = hasCopyMedia && block.isFileImage() && checkFlag;
			hasAlign = hasAlign && block.canHaveAlign();
			hasColor = hasColor && block.canHaveColor();
			hasBg = hasBg && block.canHaveBackground();
			hasTurnDiv = hasTurnDiv && !block.canTurnText() && block.isDiv();
			hasTurnText = hasTurnText && block.canTurnText() && !block.isDiv();
			hasTurnObject = hasTurnObject && block.canTurnPage();
			hasTurnList = hasTurnList && block.canTurnList();
			hasTurnFile = hasTurnFile && block.isFile();
			hasText = hasText && block.isText();
			hasQuote = hasQuote && block.isTextQuote();

			if (block.isTextTitle() || block.isTextDescription()) {
				hasCommon = false;
				hasText = false;
			};

			if (block.isFeatured()) {
				hasAction = false;
			};
		};

		const actionParam = { rootId, blockId, hasText, hasFile, hasCommon, hasClipboard, hasCopyMedia, hasLink, hasBookmark, hasDataview, hasTurnObject, count: blockIds.length };
		const changeFile = { id: 'changeFile', icon: 'link', name: translate('menuBlockActionsExistingFile'), arrow: true };
		const restrictedAlign = [];

		if (!hasText) {
			restrictedAlign.push(I.BlockHAlign.Justify);
		};
		if (hasQuote) {
			restrictedAlign.push(I.BlockHAlign.Center);
		};

		if (filter) {
			const turnText = { id: 'turnText', icon: '', name: translate('menuBlockActionsSectionsTextStyle'), children: U.Menu.getBlockText() };
			const turnList = { id: 'turnList', icon: '', name: translate('menuBlockActionsSectionsListStyle'), children: U.Menu.getBlockList() };
			const turnPage = { id: 'turnPage', icon: '', name: translate('commonTurnIntoObject'), children: U.Menu.getTurnPage() };
			const turnDiv = { id: 'turnDiv', icon: '', name: translate('menuBlockActionsSectionsDividerStyle'), children: U.Menu.getTurnDiv() };
			const turnFile = { id: 'turnFile', icon: '', name: translate('menuBlockActionsSectionsFileStyle'), children: U.Menu.getTurnFile() };
			const action = { id: 'action', icon: '', name: translate('commonActions'), children: U.Menu.getActions(actionParam) };
			const align = { id: 'align', icon: '', name: translate('commonAlign'), children: U.Menu.getHAlign(restrictedAlign) };
			const bgColor = { id: 'bgColor', icon: '', name: translate('commonBackground'), children: U.Menu.getBgColors() };
			const color = { id: 'color', icon: 'color', name: translate('commonColor'), arrow: true, children: U.Menu.getTextColors() };

			if (hasTurnFile) {
				action.children.push(changeFile);
			};

			if (hasTurnText)	 sections.push(turnText);
			if (hasTurnList)	 sections.push(turnList);
			if (hasTurnDiv)		 sections.push(turnDiv);
			if (hasTurnFile)	 sections.push(turnFile);
			if (hasTurnObject)	 sections.push(turnPage);
			if (hasColor)		 sections.push(color);
			if (hasBg)			 sections.push(bgColor);
			if (hasAlign)		 sections.push(align);
			if (hasAction)		 sections.push(action);

			sections = U.Menu.sectionsFilter(sections, filter);
		} else {
			const turnText = { 
				id: 'turnStyle', name: translate('menuBlockActionsSectionsTextStyle'), arrow: true,
				caption: (I.TextStyle[style] ? translate(U.String.toCamelCase(`blockName-${I.TextStyle[style]}`)) : ''),
			};

			const isCardStyle = hasLink && (cardStyle == I.LinkCardStyle.Card);

			const c1: any[] = [
				hasLink ? { id: 'linkSettings', name: translate('commonView'), caption: translate(`menuBlockLinkSettingsStyle${I.LinkCardStyle[cardStyle]}`), arrow: true } : null,
				hasTurnFile ? { id: 'turnStyle', name: translate('commonView'), caption: I.FileStyle[style], arrow: true, isBlockFile: true } : null,
				(hasTurnText && !isCardStyle) ? turnText : null,
				hasTurnDiv ? { id: 'turnStyle', icon: U.Data.styleIcon(I.BlockType.Div, style), name: translate('menuBlockActionsSectionsDividerStyle'), arrow: true, isBlockDiv: true } : null,
				hasAlign ? { id: 'align', name: translate('commonAlign'), caption: I.BlockHAlign[hAlign], arrow: true } : null,
				hasColor ? { id: 'color', name: translate('commonColor'), arrow: true, isTextColor: true, value: (color || 'default') } : null,
				hasBg ? { id: 'background', name: translate('commonBackground'), arrow: true, isBgColor: true, value: (bgColor || 'default') } : null,
				hasText ? { id: 'clear', name: translate('libMenuClearStyle') } : null,
			].filter(it => it);
			let actionSections: any[] = [];

			if (hasAction) {
				const cmd = keyboard.cmdSymbol();
				const count = blockIds.length;
				const copyName = `${translate('commonDuplicate')} ${U.Common.plural(count, translate('pluralLCBlock'))}`;
				const deleteName = `${translate('commonDelete')} ${U.Common.plural(count, translate('pluralLCBlock'))}`;

				const move = hasCommon ? { id: 'move', icon: 'move', name: translate('commonMoveTo'), arrow: true } : null;
				const clipboardCopy = hasClipboard ? { id: 'clipboardCopy', icon: 'clipboard-copy', name: translate('commonCopy'), caption: `${cmd} + C` } : null;
				const clipboardCut = hasClipboard ? { id: 'clipboardCut', icon: 'clipboard-cut', name: translate('commonCut'), caption: `${cmd} + X` } : null;
				const clipboardPaste = hasClipboard ? { id: 'clipboardPaste', icon: 'clipboard-paste', name: translate('commonPaste'), caption: `${cmd} + V` } : null;
				const copy = hasCommon ? { id: 'copy', icon: 'duplicate', name: copyName, caption: keyboard.getCaption('duplicate') } : null;
				const remove = hasCommon ? { id: 'remove', icon: 'remove', name: deleteName, caption: 'Del' } : null;
				const download = hasFile ? { id: 'download', icon: 'download', name: translate('commonDownload') } : null;
				const copyUrl = hasBookmark ? { id: 'copyUrl', icon: 'pageLink', name: translate('libMenuCopyUrl') } : null;
				const openAsObject = (hasFile || hasBookmark || hasDataview) ? { id: 'openAsObject', icon: 'expand', name: translate('commonOpenObject') } : null;
				const newTab = { id: 'newTab', icon: 'newTab', name: translate('menuObjectOpenInNewTab') };
				const newWindow = { id: 'newWindow', icon: 'newWindow', name: translate('menuObjectOpenInNewWindow') };

				if (hasLink) {
					actionSections = [
						{ children: [ move, clipboardCopy, clipboardCut, clipboardPaste, copy, remove ] },
						{ children: [ newTab, newWindow ] },
					];
				} else
				if (hasFile) {
					actionSections = [
						{ children: [ move, clipboardCopy, clipboardCut, clipboardPaste, copy, remove ] },
						{ children: [ download ] },
						{ children: [ openAsObject, newTab, newWindow ] },
					];
				} else
				if (hasBookmark) {
					actionSections = [
						{ children: [ copyUrl, move, clipboardCopy, clipboardCut, clipboardPaste, copy, remove ] },
						{ children: [ openAsObject, newTab, newWindow ] },
					];
				} else {
					actionSections = [
						{ children: U.Menu.getActions(actionParam) },
					];
				};
			};

			let sectionName = 'commonText';

			if (hasLink) {
				sectionName = 'commonObject';
			} else
			if (hasFile) {
				sectionName = (content.type == I.FileType.Image) ? 'commonImage' : 'commonFile';
			} else
			if (hasBookmark) {
				sectionName = 'commonBookmark';
			};

			sections = [
				{ name: translate(sectionName), className: 'settingsText', children: c1 },
				...actionSections,
			];
		};

		return U.Menu.sectionsMap(sections);
	};

	const checkFlagByObject = (id: string): boolean => {
		let flag = false;
		if (id) {
			const object = S.Detail.get(rootId, id, [ 'isArchived', 'isDeleted' ], true);
			if (!object.isDeleted) {
				flag = true;
			};
		};
		return flag;
	};
	
	const getItems = () => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};
	
	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			onOver(e, item);
		};
	};
	
	const onOver = (e: any, item: any) => {
		if (!block) {
			return;
		};

		const { content, hAlign, bgColor } = block;
		const { color } = content;

		setActive(item, false);

		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.action);
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const menuParam: I.MenuParam = {
			menuKey: item.itemId,
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			className,
			classNameWrap, 
			isSub: true,
			noFlipX: true,
			rebind,
			parentId: props.id,
			data: {
				rootId,
				blockId,
				blockIds,
			},
		};

		let ids: string[] = [];
		let filters = [];
		let menuId = '';

		switch (item.itemId) {
			case 'turnStyle': {
				menuId = 'blockStyle';

				if (item.isBlockDiv || item.isBlockFile) {
					menuParam.offsetY = 0;
					menuParam.vertical = I.MenuDirection.Center;
				};

				ids = selection?.getForClick(blockId, false, false);
				if (!ids.length) {
					break;
				};

				menuParam.data = Object.assign(menuParam.data, {
					onSelect: (item: any) => {
						if (item.type == I.BlockType.Text) {
							const isToggle = [ 
								I.TextStyle.Toggle, 
								I.TextStyle.ToggleHeader1, 
								I.TextStyle.ToggleHeader2, 
								I.TextStyle.ToggleHeader3,
							].includes(item.itemId);

							C.BlockListTurnInto(rootId, ids, item.itemId, () => {
								setFocus(ids[0]);

								if (isToggle) {
									ids.forEach(id => S.Block.toggle(rootId, id, true));
								};
							});
						};

						if (item.type == I.BlockType.Div) {
							C.BlockDivListSetStyle(rootId, ids, item.itemId, () => setFocus(ids[0]));
						};

						if (item.type == I.BlockType.File) {
							C.BlockFileListSetStyle(rootId, ids, item.itemId, () => setFocus(ids[0]));
						};
						
						close();
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
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] }
					],
					onClick: (item: any) => {
						moveToPage(item.id);
						close();
					},
				});
				break;
			};

			case 'changeFile': {
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() },
					],
					onSelect: (item: any) => {
						C.BlockFileSetTargetObjectId(rootId, blockId, item.id);
						close();
					}
				});
				break;
			};

			case 'move': {
				menuId = 'searchObject';

				const skipIds = [ rootId ];
				blockIds.forEach((id: string) => {
					const block = S.Block.getLeaf(rootId, id);
					if (block && block.isLink()) {
						skipIds.push(block.getTargetObjectId());
					};
				});

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Move, 
					position: I.BlockPosition.Bottom,
					skipIds,
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					],
					canAdd: true,
					onSelect: () => close()
				});
				break;
			};

			case 'color':
			case 'background': {
				ids = selection?.getForClick(blockId, true, false);

				let cmd = '';
				let event = '';
				let value = '';

				if (item.itemId == 'color') {
					menuId = 'blockColor';
					cmd = 'BlockTextListSetColor';
					event = 'ChangeBlockColor';
					value = color;
				};
				if (item.itemId == 'background') {
					menuId = 'blockBackground';
					cmd = 'BlockListSetBackgroundColor';
					event = 'ChangeBlockBackground';
					value = bgColor;
				};

				menuParam.data = Object.assign(menuParam.data, {
					value,
					onChange: (color: string) => {
						C[cmd](rootId, ids, color, () => {
							setFocus(ids[0]);
							analytics.event(event, { color: value, count: ids.length });
						});

						close();
					},
				});
				break;
			};

			case 'align': {
				menuId = 'blockAlign';
				menuParam.offsetY = 0;
				menuParam.vertical = I.MenuDirection.Center;

				menuParam.data = Object.assign(menuParam.data, {
					value: hAlign,
					onSelect: (align: I.BlockHAlign) => {
						C.BlockListSetAlign(rootId, blockIds, align, (message: any) => {
							setFocus(blockIds[0]);
							analytics.event('ChangeBlockAlign', { align, count: blockIds.length });
						});

						close();
					}
				});
				break;
			};

			case 'linkSettings': {
				menuId = 'blockLinkSettings';
				menuParam.subIds = [ 'select' ];
				menuParam.offsetY = 0;
				menuParam.vertical = I.MenuDirection.Center;
				break;
			};

			case 'dataviewSource': {
				menuId = 'searchObject';
				menuParam.className = 'single';

				const isCollection = Dataview.isCollection(rootId, blockId);
				const name = translate(isCollection ? 'commonCollection' : 'commonSet');

				const addParam: any = {
					name: U.String.sprintf(translate('menuBlockActionsCreateNew'), name),
				};
				if (isCollection) {
					addParam.onClick = (details: any) => {
						details = Object.assign(details, { createdInContext: rootId });
						C.ObjectCreate(details, [], '', J.Constant.typeKey.collection, S.Common.space, () => onCreate());
					};

					filters = filters.concat([
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection },
					]);
				} else {
					addParam.onClick = (details: any) => {
						C.ObjectCreateSet([], details, '', S.Common.space, () => onCreate());
					};

					filters = filters.concat([
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Set },
						{ relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
					]);
				};

				const onCreate = () => {
					window.setTimeout(() => $(window).trigger(`updateDataviewData`), 50);
				};

				menuParam.data = Object.assign(menuParam.data, {
					rootId,
					blockId: block.id,
					value: [ block.getTargetObjectId() ],
					blockIds: [ block.id ],
					filters,
					canAdd: true,
					addParam,
					onSelect: (item: any) => {
						C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, onCreate);
					}
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.itemId)) {
			S.Menu.closeAll(J.Menu.action, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onClick = (e: any, item: any) => {
		if (item.arrow || !block) {
			return;
		};
		
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection.getForClick(blockId, false, false);
		const idsWithChildren = selection.getForClick(blockId, true, false);
		const targetObjectId = block.getTargetObjectId();

		if (Object.values(CB_KEYS).includes(item.itemId) && range) {
			focus.set(blockId, range);
			focus.apply();
		};

		switch (item.itemId) {
			case 'clipboardCopy': {
				Action.copyBlocks(rootId, idsWithChildren, I.ClipboardMode.Copy);
				break;
			};

			case 'clipboardCut': {
				Action.copyBlocks(rootId, idsWithChildren, I.ClipboardMode.Cut);
				break;
			};

			case 'clipboardPaste': {
				close();
				window.setTimeout(() => {
					focus.set(blockId, range);
					focus.apply();
					window.setTimeout(() => Renderer.send('paste'), 50);
				}, J.Constant.delay.menu);
				return;
			};

			case 'download': {
				Action.downloadFile(targetObjectId, analytics.route.menuAction, block.isFileImage());
				break;
			};

			case 'openAsObject': {
				U.Object.openConfig(null, S.Detail.get(rootId, targetObjectId));

				const event: any = { type: block.type };
				if (block.isFile()) {
					event.params = { fileType: block.content.type };
				};

				analytics.event('OpenAsObject', event);
				break;
			};

			case 'copy': {
				Action.duplicate(rootId, rootId, ids[ids.length - 1], ids, I.BlockPosition.Bottom);
				break;
			};

			case 'copyMedia': {
				U.Common.clipboardCopyImageFromUrl(S.Common.imageUrl(targetObjectId, I.ImageSize.Large));
				break;
			};

			case 'copyUrl': {
				U.Common.copyToast(translate('commonLink'), block.content.url);
				break;
			};

			case 'newTab':
			case 'newWindow': {
				const object = S.Detail.get(rootId, targetObjectId);

				if (item.itemId == 'newTab') {
					U.Object.openTabs([ object ], analytics.route.menuAction);
				} else {
					U.Object.openWindows([ object ], S.Auth.token);
				};
				break;
			};

			case 'remove': {
				Action.remove(rootId, blockId, ids);
				break;
			};
			
			case 'clear': {
				C.BlockTextListClearStyle(rootId, blockIds, () => {
					analytics.event('ClearBlockStyle', { count: blockIds.length });
				});
				break;
			};

			default: {
				// Text colors
				if (item.isTextColor) {
					C.BlockTextListSetColor(rootId, blockIds, item.value);
				} else 
					
				// Background colors
				if (item.isBgColor) {
					C.BlockListSetBackgroundColor(rootId, blockIds, item.value, () => {
						analytics.event('ChangeBlockBackground', { color: item.value, count: blockIds.length });
					});
				} else 
					
				// Align
				if (item.isAlign) {
					C.BlockListSetAlign(rootId, blockIds, item.itemId, () => {
						analytics.event('ChangeBlockAlign', { align: item.itemId, count: blockIds.length });
					});
				} else 
					
				// Blocks
				if (item.isBlock) {
					if (item.type == I.BlockType.Div) {
						C.BlockDivListSetStyle(rootId, blockIds, item.itemId);
					} else 
					if (item.type == I.BlockType.File) {
						C.BlockFileListSetStyle(rootId, blockIds, item.itemId);
					} else {
						C.BlockListTurnInto(rootId, blockIds, item.itemId, () => {
							setFocus(blockIds[0]);
						});
					};
				} else

				// Objects
				if (item.isObject) {
					moveToPage(item.objectTypeId);
				};
				break;
			};
		};

		close();
	};

	const moveToPage = (typeId: string) => {
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if (!ids.length) {
			ids.push(blockId);
		};
		
		U.Data.moveToPage(rootId, ids, typeId, analytics.route.turn);
	};

	const setFocus = (id: string) => {
		if (!id) {
			return;
		};

		const block = S.Block.getLeaf(rootId, id);
		if (!block) {
			return;
		};

		const length = block.getLength();
		focus.set(id, { from: length, to: length });
		focus.apply();
	};

	const colorMark = (value: string, isBg?: boolean) => {
		const prefix = isBg ? 'bgColor' : 'textColor';
		return <div className={`colorMark ${prefix} ${prefix}-${value || 'default'}`} />;
	};

	const sections = getSections();

	const Section = (item: any) => (
		<div className={[ 'section', item.className ? item.className : '' ].join(' ')}>
			{item.name ? <div className="name">{item.name}</div> : ''}
			<div className="items">
				{item.children.map((action: any, i: number) => {
					if (action.isTextColor) {
						action.caption = colorMark(action.value);
					};

					if (action.isBgColor) {
						action.caption = colorMark(action.value, true);
					};

					if (action.isObject) {
						action.object = { ...action, layout: I.ObjectLayout.Type };
					};

					return (
						<MenuItemVertical 
							key={i} 
							{...action} 
							onMouseEnter={e => onMouseEnter(e, action)} 
							onClick={e => onClick(e, action)} 
						/>
					);
				})}
			</div>
		</div>
	);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getFilterRef: () => filterRef.current,
		onClick,
		onOver,
	}));
	
	return (
		<div>
			<Filter 
				ref={filterRef}
				className="outlined round"
				placeholder={translate('menuBlockActionsFilterActions')}
				value={filter}
				onFocus={onFilterFocus} 
				onChange={onFilterChange} 
				focusOnMount={true}
			/>
			
			{!sections.length ? <div className="item empty">{translate('commonFilterEmpty')}</div> : ''}
			{sections.map((item: any, i: number) => (
				<Section key={i} {...item} />
			))}
		</div>
	);
	
}));

export default MenuBlockAction;
