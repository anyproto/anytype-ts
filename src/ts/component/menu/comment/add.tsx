import React, { forwardRef, useRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Filter, MenuItemVertical } from 'Component';
import { I, translate } from 'Lib';

const MenuCommentAdd = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, setHover } = props;
	const { data } = param;
	const { onSelect } = data;
	const [ filter, setFilter ] = useState('');
	const filterRef = useRef(null);
	const itemIndexRef = useRef(-1);

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
					{ id: 'image', icon: 'mediaImage', name: translate('commentBlockImage'), description: translate('commentBlockImageDescription'), isDisabled: true },
					{ id: 'file', icon: 'mediaFile', name: translate('commentBlockFile'), description: translate('commentBlockFileDescription'), isDisabled: true },
					{ id: 'object', icon: 'existing', name: translate('commentBlockObject'), description: translate('commentBlockObjectDescription'), isDisabled: true },
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

		for (const section of sections) {
			items.push({ id: `section-${section.id}`, name: section.name, isSection: true });
			items.push(...section.children);
		};

		return items;
	};

	const onClick = (e: any, item: any) => {
		if (item.isDisabled || item.isSection) {
			return;
		};

		close();
		onSelect?.({ style: item.textStyle, type: item.blockType });
	};

	useImperativeHandle(ref, () => ({
		getItems,
		onClick,
		getFilterRef: () => filterRef.current,
		getIndex: () => itemIndexRef.current,
		setIndex: (n: number) => { itemIndexRef.current = n; },
	}));

	const onFilterChange = (v: string) => {
		setFilter(v);
	};

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
					if (item.isSection) {
						return (
							<div key={item.id} className="sectionName">
								{item.name}
							</div>
						);
					};

					const cn = [ 'item' ];
					if (item.isDisabled) {
						cn.push('isDisabled');
					};

					return (
						<MenuItemVertical
							key={item.id}
							id={item.id}
							icon={item.icon}
							name={item.name}
							description={item.description}
							withDescription={true}
							className={cn.join(' ')}
							onClick={e => onClick(e, item)}
							onMouseEnter={() => setHover(item)}
						/>
					);
				})}
			</div>
		</div>
	);
}));

export default MenuCommentAdd;
