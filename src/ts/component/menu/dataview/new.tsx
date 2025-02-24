import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, U, J, analytics, keyboard, translate, Action } from 'Lib';
import { MenuItemVertical } from 'Component';

const MenuNew = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, setActive, setHover, onKeyDown, getId, getSize, position } = props;
	const { data } = param;
	const { 
		rootId, subId, blockId, typeId, templateId, route, hasSources, getView, onTypeChange, onSetDefault, onSelect, isCollection, withTypeSelect, 
		isAllowedObject,
	} = data;
	const n = useRef(-1);
	const [ template, setTemplate ] = useState(null);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const loadTemplate = () => {
		U.Object.getById(templateId, {}, (object: any) => {
			setTemplate(object ? object : null);
		});
	};

	const getSections = () => {
		const type = S.Record.getTypeById(typeId);
		const templateName = template ? template.name : translate('commonBlank');

		const itemsAdd: any[] = [
			{ id: 'new', icon: 'add', name: translate('commonNew') },
		];
		const itemsSettings: any[] = [
			{ id: 'template', name: translate('commonTemplate'), arrow: true, caption: templateName },
		];

		if (isAllowedObject && isCollection) {
			itemsAdd.push({ id: 'existing', icon: 'existingObject', name: translate('menuDataviewExistingObject'), arrow: true });
		};

		if (withTypeSelect) {
			itemsSettings.unshift({ id: 'type', name: translate('commonDefaultType'), arrow: true, caption: type.name });
		};

		let sections: any[] = [
			{ id: 'add', name: '', children: itemsAdd },
			{ id: 'settings', name: translate('commonSettings'), children: itemsSettings },
		].filter(it => it);

		sections = sections.map((s: any) => {
			s.children = s.children.filter(it => it);
			return s;
		}).filter(s => !!s.children.length);

		return sections;
	};

	const getItems = () => {
		const sections = getSections();

		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};

		return items;
	};

	const onOver = (e: React.MouseEvent, item: any) => {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.dataviewNew);
			return;
		};

		const allowedLayouts = U.Object.getPageLayouts().concat(U.Object.getSetLayouts());

		const menuParam: I.MenuParam = {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			data: {
				rootId,
				blockId,
				hasSources,
				getView,
				typeId,
				templateId,
				route,
			},
		};

		let menuId = '';

		switch (item.id) {
			case 'existing': {
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
						{ relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
					],
					onSelect: (el: any) => {
						Action.addToCollection(rootId, [ el.id ]);
					},
					skipIds: [ ...S.Record.getRecordIds(subId, ''), rootId ],
				});
				break;
			};

			case 'type': {
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: allowedLayouts },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
					],
					skipIds: [ typeId ],
					onClick: type => {
						data.typeId = type.id;
						data.templateId = type.defaultTemplateId;

						loadTemplate();

						if (onTypeChange) {
							onTypeChange(type.id);
						};
					},
				});
				break;
			};

			case 'template': {
				const update = (item) => {
					data.templateId = item.id;
					loadTemplate();
				};

				menuId = 'dataviewTemplateList';
				menuParam.data = Object.assign(menuParam.data, {
					onSetDefault: (item) => {
						update(item);

						if (onSetDefault) {
							onSetDefault(item);
						};
					},
					onSelect: (item) => {
						update(item);

						if (onSelect) {
							onSelect(item);
						};
					},
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.dataviewNew, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onClick = (e: React.MouseEvent, item: any) => {
		if (item.arrow) {
			return;
		};

		switch (item.id) {
			case 'new': {
				if (onSelect) {
					onSelect(template ? template : { id: '' });
				};
				break;
			};
		};
	};

	const onMouseEnter = (e: React.MouseEvent, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
			onOver(e, item);
		};
	};

	const onMouseLeave = (e: React.MouseEvent, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setHover(null, false);
		};
	};

	const resize = () => {
		$(`#${getId()} .content`).css({ height: 'auto' });
		position();
	};

	const sections = getSections();

	const Section = (item: any) => (
		<div id={'section-' + item.id} className="section">
			{item.name ? <div className="name">{item.name}</div> : ''}
			<div className="items">
				{item.children.map((action: any, i: number) => (
					<MenuItemVertical
						key={i}
						{...action}
						icon={action.icon}
						onMouseEnter={e => onMouseEnter(e, action)}
						onMouseLeave={e => onMouseLeave(e, action)}
						onClick={e => onClick(e, action)}
					/>
				))}
			</div>
		</div>
	);

	useEffect(() => {
		rebind();
		loadTemplate();
		window.setTimeout(() => resize(), 5);

		return () => {
			unbind();
			S.Menu.closeAll(J.Menu.dataviewNew);
		};
	}, []);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		loadTemplate,
		getSections,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onOver,
		onClick,
		onMouseEnter,
		onMouseLeave,
		resize,
		Section,
	}), []);

	return (
		<>
			{sections.map((item: any, i: number) => (
				<Section key={i} index={i} {...item} />
			))}
		</>
	);
	
}));

export default MenuNew;