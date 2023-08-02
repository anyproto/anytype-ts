import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, focus } from 'Lib';
import Constant from 'json/constant.json';
import { commonStore, dbStore } from 'Store';

class MenuTemplate extends React.Component<I.Menu> {

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
        const { template, isView } = data;
        const { isBlank, isDefault } = template;
       
		return [
			!isDefault ? ({ id: 'default', name: translate(isView ? 'menuDataviewTemplateSetDefaultForView' : 'commonTemplateSetDefault') }) : null,
			!isBlank ? ({ id: 'edit', name: translate('menuDataviewTemplateEdit') }) : null,
			{ id: 'duplicate', name: translate('commonDuplicate') },
			!isBlank ? ({ id: 'remove', name: translate('commonDelete') }) : null,
		].filter(it => it);
    };

    onClick (e: any, item: any) {
        const { param, close } = this.props;
        const { data } = param;
        const { template, onSetDefault, onDelete, onDuplicate } = data;

		close();

        switch (item.id) {
            case 'default': {
                if (onSetDefault) {
                    onSetDefault();
                };
                break;
            };

            case 'edit': {
                UtilObject.openPopup(template);
                break;
            };

            case 'duplicate': {
				if (template.id == Constant.templateId.blank) {
					const type = dbStore.getType(template.typeId);
					const details: any = {
						type: Constant.typeId.template,
						targetObjectType: template.typeId,
						layout: type.recommendedLayout,
					};

					C.ObjectCreate(details, [], '', (message) => {
						if (message.error.code) {
							return;
						};

						analytics.event('CreateTemplate', { objectType: template.typeId, route: 'menuDataviewTemplate' });

						if (onDuplicate) {
							onDuplicate(message.details);
						};
					});
					break;
				};

                C.ObjectListDuplicate([ template.id ], (message: any) => {
					if (!message.error.code && message.ids.length) {
						if (onDuplicate) {
							onDuplicate({ ...template, id: message.ids[0] });
						};
						analytics.event('DuplicateObject', { count: 1, route: 'menuDataviewTemplate' });
					};
				});
                break;
            };

            case 'remove': {
                C.ObjectSetIsArchived(template.id, true, (message: any) => {
                    if (!message.error.code) {
                        if (onDelete) {
                            onDelete();
                        };

                        analytics.event('MoveToBin', { count: 1, route: 'menuDataviewTemplate' });
                    };
                });
                break;
            };
        };
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

export default MenuTemplate;
