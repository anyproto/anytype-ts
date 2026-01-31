import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { Icon, PreviewObject, EmptySearch } from 'Component';
import { I, S, U, J, translate, keyboard } from 'Lib';
import { observer } from 'mobx-react';

const TEMPLATE_WIDTH = 224;

const MenuTemplateList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, setHover, onKeyDown, getId, position } = props;
	const { data, className, classNameWrap } = param;
	const { activeId, typeId, fromBanner, noAdd, onSelect, getView, onSetDefault, route } = data;
	const previewSize = data.previewSize || I.PreviewSize.Small;
	const canWrite = U.Space.canMyParticipantWrite();
	const nodeRef = useRef(null);
	const n = useRef(0);
	const subId = [ getId(), 'data' ].join('-');

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDownHandler(e));
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onKeyDownHandler = (e: any) => {
		let ret = false;

		keyboard.shortcut('arrowup, arrowleft, arrowdown, arrowright', e, (pressed: string) => {
			e.preventDefault();

			const dir = [ 'arrowup', 'arrowleft' ].includes(pressed) ? -1 : 1;

			n.current += dir;

			if (n.current < 0) {
				n.current = items.length - 1;
			};

			if (n.current > items.length - 1) {
				n.current = 0;
			};

			setHover(items[n.current], true);
			ret = true;
		});

		if (!ret) {
			onKeyDown(e);
		};
	};

	const setCurrent = () => {
		n.current = items.findIndex(it => it.id == templateId);
	};

	const load = () => {
		const filters: I.Filter[] = [
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: J.Constant.typeKey.template },
			{ relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		U.Subscription.subscribe({
			subId,
			filters,
			sorts,
			keys: J.Relation.default.concat([ 'targetObjectType' ]),
		}, setCurrent);
	};

	const getTemplateId = () => {
		let ret = '';
		let view = null;

		if (getView) {
			view = getView();
			if (view) {
				ret = view.defaultTemplateId;
			};
		};

		return ret || data.templateId || '';
	};

	const getItems = () => {
		const items = S.Record.getRecords(subId);
		const isAllowed = U.Object.isAllowedTemplate(typeId);

		if (!noAdd && isAllowed) {
			items.push({ id: J.Constant.templateId.new });
		};

		return items;
	};

	const onMore = (e: any, template: any) => {
		const item = U.Common.objectCopy(template);
		const node = $(`#item-${item.id}`);

		e.preventDefault();
		e.stopPropagation();

		if (!item.targetObjectType) {
			item.targetObjectType = typeId;
		};

		if (S.Menu.isOpen('dataviewTemplateContext', item.id)) {
			S.Menu.close('dataviewTemplateContext');
			return;
		};

		S.Menu.closeAll(J.Menu.dataviewTemplate, () => {
			S.Menu.open('dataviewTemplateContext', {
				className, 
				classNameWrap,
				menuKey: item.id,
				element: `#${getId()} #item-more-${item.id}`,
				horizontal: I.MenuDirection.Right,
				subIds: J.Menu.dataviewTemplate,
				onOpen: () => node.addClass('active'),
				onClose: () => node.removeClass('active'),
				rebind,
				parentId: id,
				data: {
					template: item,
					isView: !!getView,
					typeId,
					templateId,
					route,
					onDuplicate: object => U.Object.openConfig(null, object, {}),
					onSetDefault,
				}
			});
		});
	};

	const onClick = (e: any, template: any) => {
		const item = U.Common.objectCopy(template);

		if (!item.targetObjectType) {
			item.targetObjectType = typeId;
		};

		if (item.id != J.Constant.templateId.new) {
			data.templateId = item.id;
		};

		onSelect?.(item);
	};

	const beforePosition = () => {
		if (!fromBanner) {
			return;
		};

		const obj = $(`#${getId()}`);
		const list = obj.find('.items');
		const length = items.length;
		const isPopup = keyboard.isPopup();
		const container = U.Common.getPageContainer(isPopup);
		const ww = container.width();

		let columns = Math.max(1, Math.floor(ww / TEMPLATE_WIDTH));
		if (columns > length) {
			columns = length;
		};

		list.css({ 'grid-template-columns': `repeat(${columns}, 1fr)` });
	};

	const ItemAdd = () => (
		<div className="previewObject small">
			<div className="border" />
			<Icon className="add" />
		</div>
	);

	const Item = (item: any) => {
		const cn = [ 'item' ];
		const onContext = canWrite ? e => onMore(e, item) : null;

		let content = null;
		if (item.id == J.Constant.templateId.new) {
			content = <ItemAdd {...item} />;
		} else {
			content = (
				<PreviewObject
					key={`preview-${item.id}`}
					rootId={item.id}
					size={previewSize}
					onMore={onContext}
					onContextMenu={onContext}
				/>
			);
		};

		if ((item.id == activeId) && activeId) {
			cn.push('active');
		};
		if ((item.id == templateId) && templateId) {
			cn.push('isDefault');
		};

		return (
			<div 
				id={`item-${item.id}`} 
				className={cn.join(' ')}
				onClick={e => onClick(e, item)}
				onMouseEnter={() => setHover(item)}
				onMouseLeave={() => setHover(null)}
			>
				{content}
			</div>
		);
	};

	const templateId = getTemplateId();
	const items = getItems();

	useEffect(() => {
		rebind();
		position();
		load();

		return () => {
			U.Subscription.destroyList([ subId ]);
			unbind();
		};
	}, []);

	useEffect(() => {
		position();
		setCurrent();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		beforePosition,
	}), []);

	return (
		<div ref={nodeRef}>
			{items.length ? (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			) : <EmptySearch className="noItems" text={translate('blockDataviewNoTemplates')} />}
		</div>
	);

}));

export default MenuTemplateList;