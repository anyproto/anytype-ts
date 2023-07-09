import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, keyboard, UtilMenu, UtilObject } from 'Lib';
import { blockStore } from 'Store';

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
                        onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }}
                        onClick={(e: any) => this.onClick(e, action)}
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
        $(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
        window.setTimeout(() => { this.props.setActive(); }, 15);
    };

    unbind () {
        $(window).off('keydown.menu');
    };

    getItems () {
        const { param } = this.props;
        const { data } = param;
        const { template } = data;
        const { isBlank, isDefault } = template;
        const items: any[] = [
            { id: 'duplicate', name: 'Duplicate' }
        ];

        if (!isBlank) {
            items.unshift({ id: 'edit', name: 'Edit template' });
            items.push({ id: 'delete', name: 'Delete' });
        };

        if (!isDefault) {
            items.unshift({ id: 'default', name: 'Set as default' });
        }

        return items;
    };

    onClick (e: any, item: any) {
        const { param } = this.props;
        const { data } = param;
        const { template } = data;

        switch (item.id) {
            case 'default': {
                console.log('SET TEMPLATE AS DEFAULT FOR THIS ... ???');
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
                console.log('DELETE TEMPLATE');
                break;
            };
        };

        this.props.close();
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