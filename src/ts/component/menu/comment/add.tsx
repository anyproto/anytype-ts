import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Filter, MenuItemVertical } from 'Component';
import { I, U, keyboard, translate } from 'Lib';

const MenuCommentAdd = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, onKeyDown, setActive } = props;
	const { data } = param;
	const { onSelect } = data;
	const [ filter, setFilter ] = useState('');
	const filterRef = useRef(null);
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useEffect(() => {
		rebind();
	}, [ filter ]);

	const getSections = () => {
		const sections: any[] = [
			{
				id: 'text',
				name: translate('commentSlashMenuTitle'),
				children: [
					{ id: 'title', textStyle: I.TextStyle.Header1, blockType: I.BlockType.Text, icon: 'textHeader textHeader1', name: translate('commentBlockTitle'), description: translate('commentBlockTitleDescription') },
					{ id: 'heading', textStyle: I.TextStyle.Header2, blockType: I.BlockType.Text, icon: 'textHeader textHeader2', name: translate('commentBlockHeading'), description: translate('commentBlockHeadingDescription') },
					{ id: 'subheading', textStyle: I.TextStyle.Header3, blockType: I.BlockType.Text, icon: 'textHeader textHeader3', name: translate('commentBlockSubheading'), description: translate('commentBlockSubheadingDescription') },
				],
			},
			{
				id: 'list',
				name: translate('commentSlashMenuLists'),
				children: [
					{ id: 'numbered', textStyle: I.TextStyle.Numbered, blockType: I.BlockType.Text, icon: 'textNumbered', name: translate('commentBlockNumbered'), description: translate('commentBlockNumberedDescription') },
					{ id: 'bulleted', textStyle: I.TextStyle.Bulleted, blockType: I.BlockType.Text, icon: 'textBulleted', name: translate('commentBlockBulleted'), description: translate('commentBlockBulletedDescription') },
					{ id: 'checkbox', textStyle: I.TextStyle.Checkbox, blockType: I.BlockType.Text, icon: 'textCheckbox', name: translate('commentBlockCheckbox'), description: translate('commentBlockCheckboxDescription') },
				],
			},
			{
				id: 'attachments',
				name: translate('commentSlashMenuAttachments'),
				children: [
					{ id: 'image', action: 'image', icon: 'mediaImage', name: translate('commentBlockImage'), description: translate('commentBlockImageDescription') },
					{ id: 'file', action: 'file', icon: 'mediaFile', name: translate('commentBlockFile'), description: translate('commentBlockFileDescription') },
					{ id: 'object', action: 'object', icon: 'existing', name: translate('commentBlockObject'), description: translate('commentBlockObjectDescription') },
				],
			},
			{
				id: 'decorations',
				name: translate('commentSlashMenuDecorations'),
				children: [
					{ id: 'quote', textStyle: I.TextStyle.Quote, blockType: I.BlockType.Text, icon: 'textQuote', name: translate('commentBlockQuote'), description: translate('commentBlockQuoteDescription') },
					{ id: 'divider', textStyle: I.TextStyle.Paragraph, blockType: I.BlockType.Div, icon: 'divLine', name: translate('commentBlockDivider'), description: translate('commentBlockDividerDescription') },
					{ id: 'code', textStyle: I.TextStyle.Code, blockType: I.BlockType.Text, icon: 'code', name: translate('commentBlockCode'), description: translate('commentBlockCodeDescription') },
				],
			},
			{
				id: 'embed',
				name: translate('commentSlashMenuEmbed'),
				children: U.Menu.getBlockEmbed().map(it => ({ ...it, action: 'embed', embedProcessor: it.id })),
			},
		];

		if (filter) {
			const s = filter.toLowerCase();
			return sections
				.map(section => ({
					...section,
					children: section.children.filter((it: any) =>
						it.name.toLowerCase().includes(s) ||
						it.description.toLowerCase().includes(s)
					),
				}))
				.filter(section => section.children.length > 0);
		};

		return sections;
	};

	const getItems = () => {
		const items: any[] = [];
		const sections = getSections();

		for (let i = 0; i < sections.length; i++) {
			const section = sections[i];

			if (i > 0) {
				items.push({ id: `separator-${section.id}`, isSeparator: true });
			};

			items.push({ id: `section-${section.id}`, name: section.name, isSection: true });
			items.push(...section.children);
		};

		return items;
	};

	const onClick = (e: any, item: any) => {
		if (item.isSection || item.isSeparator) {
			return;
		};

		close();

		if (item.action) {
			onSelect?.({ action: item.action, embedProcessor: item.embedProcessor });
		} else {
			onSelect?.({ style: item.textStyle, type: item.blockType });
		};
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onFilterChange = (v: string) => {
		setFilter(v);
	};

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => { n.current = i; },
		getFilterRef: () => filterRef.current,
		onClick,
		onOver,
	}));

	const items = getItems();

	return (
		<div className="commentMenuAdd">
			<Filter
				ref={filterRef}
				placeholder={translate('commonSearch')}
				onChange={onFilterChange}
				focusOnMount={true}
			/>

			<div className="items scrollWrap">
				{items.map((item: any, i: number) => {
					if (item.isSeparator) {
						return <div key={item.id} className="separator"><div className="inner" /></div>;
					};

					if (item.isSection) {
						return (
							<div key={item.id} className="sectionName">
								{item.name}
							</div>
						);
					};

					return (
						<MenuItemVertical
							key={item.id}
							id={item.id}
							icon={item.icon}
							name={item.name}
							onClick={e => onClick(e, item)}
							onMouseEnter={e => onOver(e, item)}
						/>
					);
				})}
			</div>
		</div>
	);
}));

export default MenuCommentAdd;
