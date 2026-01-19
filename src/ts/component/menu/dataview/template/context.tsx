import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I, C, U, analytics,keyboard, translate, Action, Preview } from 'Lib';

const MenuDataviewTemplateContext = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, onKeyDown, setActive } = props;
	const { data } = param;
	const { template, isView, templateId, noToast, route, onDuplicate, onArchive, onSetDefault } = data;
	const isDefault = template.id == templateId;
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getItems = () => {
		const setDefaultName = isView ? translate('menuDataviewTemplateSetDefaultForView') : translate('commonSetDefault');
		const unsetDefaultName = isView ? translate('menuDataviewTemplateUnsetDefaultForView') : translate('commonUnsetDefault');

		return [
			!isDefault && onSetDefault ? ({ id: 'setDefault', name: setDefaultName }) : null,
			isDefault && onSetDefault ? ({ id: 'unsetDefault', name: unsetDefaultName }) : null,
			{ id: 'edit', name: translate('menuDataviewTemplateEdit') },
			{ id: 'duplicate', name: translate('commonDuplicate') },
			{ id: 'remove', name: translate('commonDelete'), color: 'red' },
		].filter(it => it);
	};

	const onClick = (e: any, item: any) => {
		switch (item.id) {
			case 'setDefault': {
				if (onSetDefault) {
					onSetDefault(template.id);
				};

				if (!noToast) {
					Preview.toastShow({ text: translate('toastSetDefaultTemplate') });
				};
				analytics.event('ChangeDefaultTemplate', { route });
				break;
			};

			case 'unsetDefault': {
				if (onSetDefault) {
					onSetDefault('');
				};

				analytics.event('ChangeDefaultTemplate', { route });
				break;
			};

			case 'edit': {
				U.Object.openConfig(null, template, {
					onClose: () => $(window).trigger(`updatePreviewObject.${template.id}`)
				});

				analytics.event('EditTemplate', { route });
				break;
			};

			case 'duplicate': {
				C.ObjectListDuplicate([ template.id ], (message: any) => {
					if (!message.error.code && message.ids.length) {
						if (onDuplicate) {
							onDuplicate({ ...template, id: message.ids[0] });
						};

						analytics.event('DuplicateObject', { count: 1, route, objectType: template.type });
					};
				});
				break;
			};

			case 'remove': {
				Action.archive([ template.id ], route, onArchive);
				break;
			};
		};

		close();
	};

	const onMouseEnter = (e: any, item: any) => {
		onOver(e, item);
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};

		data.onOver?.();
	};

	const items = getItems();

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, []);

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
		<div>
			{items.map((action: any, i: number) => (
				<MenuItemVertical
					key={i}
					{...action}
					onMouseEnter={e => onMouseEnter(e, action)}
					onClick={e => onClick(e, action)}
				/>
			))}
		</div>
	);

}));

export default MenuDataviewTemplateContext;