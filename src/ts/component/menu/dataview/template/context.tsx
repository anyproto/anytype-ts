import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, C, S, U, J, analytics,keyboard, translate, Action, Preview } from 'Lib';

class MenuTemplateContext extends React.Component<I.Menu> {

	n = -1;

	constructor (props: I.Menu) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const items = this.getItems();

		return (
			<div>
				{items.map((action: any, i: number) => (
					<MenuItemVertical
						key={i}
						{...action}
						onMouseEnter={e => this.onMouseEnter(e, action)}
						onClick={e => this.onClick(e, action)}
					/>
				))}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { template, isView, onSetDefault, templateId } = data;
		const isDefault = template.id == templateId;
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

	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { template, onSetDefault, onArchive, onDuplicate, route } = data;

		switch (item.id) {
			case 'setDefault': {
				if (onSetDefault) {
					onSetDefault(template.id);
				};

				Preview.toastShow({ text: translate('toastSetDefaultTemplate') });
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
				U.Object.openConfig(template, {
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

	onMouseEnter (e: any, item: any) {
		this.onOver(e, item);
	};

	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onOver } = data;

		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		if (onOver) {
			onOver();
		};
	};

};

export default MenuTemplateContext;
