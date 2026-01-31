import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, IconObject, Label } from 'Component';
import { I, C, S, U, Relation, analytics, keyboard, translate } from 'Lib';
import menu from 'json/menu';

const MenuDataviewSource = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, getId, getSize, close, onKeyDown, setActive } = props;
	const { data, className, classNameWrap } = param;
	const { readonly, rootId, objectId } = data;
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onRemove = (e: any, item: any) => {
		if (item) {
			save(getValueIds().filter(it => it != item.id));
		};
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		const value = getValue();

		if ((![ 'type', 'relation' ].includes(item.itemId)) || readonly) {
			return;
		};

		let menuContext = null;

		const menuParam = {
			className,
			classNameWrap,
			element: `#${getId()} #item-${item.itemId}`,
			offsetX: getSize().width,
			offsetY: -56,
			onOpen: context => menuContext = context,
			data: {},
		};

		let menuId = '';

		switch (item.itemId) {
			case 'type': {
				menuId = 'typeSuggest';
				menuParam.data = {
					canAdd: true,
					onClick: (item: any) => {
						save([ item.id ]);

						analytics.event('SetSelectQuery', { type: 'type' });
						close();
						menuContext?.close();
					},
				};
				break;
			};

			case 'relation': {
				menuId = 'relationSuggest';
				menuParam.data = {
					menuIdEdit: 'blockRelationEdit',
					skipCreate: true,
					addCommand: (rootId: string, blockId: string, relation: any) => {
						save([ relation.id ]);

						if (!value.length) {
							analytics.event('SetSelectQuery', { type: 'relation' });
						};

						close();
						menuContext?.close();
					},
				};
				break;
			};
		};

		S.Menu.open(menuId, menuParam);
	};

	const save = (value: string[], callBack?: () => void) => {
		C.ObjectSetSource(objectId, value, () => {
			callBack?.();
		});
	};

	const getValue = () => {
		return [].
			concat(Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Type)).
			concat(Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Relation));
	};

	const getValueIds = () => {
		return getValue().map(it => it.id);
	};

	const getItems = () => {
		const value = getValue();

		let items = [];

		if (!value.length) {
			items = [
				{
					isSection: true,
					text: translate('menuDataviewSourceEmptySourceLabel'),
				},
				{
					id: 'type',
					itemId: 'type',
					name: translate('commonObjectType'),
					customIcon: 'puzzle',
					relationFormat: I.RelationType.Object,
					layout: I.ObjectLayout.Relation,
					value: translate('commonNone'),
				},
				{
					id: 'relation',
					itemId: 'relation',
					name: translate('blockNameRelation'),
					relationFormat: I.RelationType.Relations,
					layout: I.ObjectLayout.Relation,
					value: translate('commonNone'),
				},
			];
		} else {
			value.forEach(it => {
				if (U.Object.isTypeLayout(it.layout)) {
					items.push({
						...it,
						itemId: 'type',
						name: translate('commonObjectType'),
						value: U.Object.name(it),
					});
				} else {
					items.push({ ...it, itemId: it.id, value: translate('commonAll') });
				};
			});
		};
		return items;
	};

	const items = getItems();
	
	const Item = (item: any) => {
		if (item.isSection) {
			return <Label className="item isSection" text={item.text || ''} />;
		};

		const canDelete = ![ 'type', 'relation' ].includes(item.id);

		let icon = null;
		if (item.customIcon) {
			icon = <div className="iconWrapper"><Icon className={item.customIcon} /></div>;
		} else {
			icon = <IconObject size={40} object={item} />;
		};

		return (
			<div 
				id={`item-${item.itemId}`} 
				className="item" 
				onMouseEnter={e => onOver(e, item)}
			>
				{icon}
				<div className="txt" onClick={e => onClick(e, item)}>
					<div className="name">{item.name}</div>
					<div className="value">{item.value}</div>
				</div>
				<div className="buttons">
					{canDelete ? <Icon className="delete" onClick={e => onRemove(e, item)} /> : ''}
				</div>
			</div>
		);
	};

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		setActive();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		onOver,
	}), []);
	
	return (
		<div className="items">
			<div className="scrollWrap">
				{items.map((item: any, i: number) => (
					<Item key={i} {...item} />
				))}

				{!items.length ? (
					<div className="item empty">
						<div className="inner">{translate('menuDataviewSourceSelectOneOrMoreSources')}</div>
					</div>
				) : ''}
			</div>
		</div>
	);

}));

export default MenuDataviewSource;