import * as React from 'react';
import { Title, Label, Button } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

const PopupSettingsSpaceRemove = observer(class PopupSettingsSpaceRemove extends React.Component<I.PopupSettings> {

    render () {
        const space = {
            name: translate('popupSettingsSpaceAnytypeSpace'),
        };

        return (
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={UtilCommon.sprintf(translate('popupSettingsSpaceRemove'), space.name)} />
                <Label text={translate('popupSettingsSpaceRemoveText')} />
                <Button color="red" className="c36" text={translate('popupSettingsSpaceRemoveButton')} />
            </div>
        );
    };

});

export default PopupSettingsSpaceRemove;
