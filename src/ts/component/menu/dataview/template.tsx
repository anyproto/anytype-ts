import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { analytics, C, I, keyboard, UtilObject } from 'Lib';

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
        const { template } = data;
        const { isBlank, isDefault } = template;
       
		 return [
			!isDefault ? ({ id: 'default', name: 'Set as default' }) : null,
			!isBlank ? ({ id: 'edit', name: 'Edit template' }) : null,
			{ id: 'duplicate', name: 'Duplicate' },
			!isBlank ? ({ id: 'delete', name: 'Delete' }) : null,
		].filter(it => it);
    };

    onClick (e: any, item: any) {
        const { param, close } = this.props;
        const { data } = param;
        const { template, onSetDefault } = data;

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
                console.log('DUPLICATE TEMPLATE');
                break;
            };
            case 'delete': {
                C.ObjectSetIsArchived(template.id, true);
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