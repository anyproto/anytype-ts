import * as React from 'react';
import { I, Action } from 'Lib';
import { Button, Label } from 'Component';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

const MenuAccountPath = observer(class MenuAccountPath extends React.Component<I.Menu> {

    constructor (props: I.Menu) {
        super(props);

        this.onClick = this.onClick.bind(this);
    };

    render () {
		const { accountPath } = authStore;

        return (
            <div>
                <Label className="bold" text="Account data location" />
                <Label text={accountPath} onClick={this.onClick} />
                <Button onClick={this.onClick} text={'Customize'} color="blank" className="c28" />
            </div>
        );
    };

    onClick (e: any) {
		Action.openDir({}, paths => authStore.accountPathSet(paths[0]));
    };

});

export default MenuAccountPath;
