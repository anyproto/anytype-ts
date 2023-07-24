import * as React from 'react';
import { I, Action, translate } from 'Lib';
import { Label } from 'Component';
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
            <React.Fragment>
                <Label className="small" text={translate('menuAccountPathText')} />
                <Label className="path" text={accountPath} onClick={this.onClick} />
            </React.Fragment>
        );
    };

    onClick () {
		Action.openDir({}, paths => authStore.accountPathSet(paths[0]));
    };

});

export default MenuAccountPath;