import * as React from 'react';
import { Title, Label, Button } from 'Component';
import { I, translate, Util } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

interface Props extends I.Popup {
    prevPage: string;
    onPage: (id: string) => void;
};

const PopupSettingsSpaceRemove = observer(class PopupSettingsSpaceRemove extends React.Component<Props> {

    render () {
        const space = {
            name: 'Anytype Space',
        };

        return (
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={Util.sprintf(translate('popupSettingsSpaceRemove'), space.name)} />
                <Label text={translate('popupSettingsSpaceRemoveText')} />
                <Button color="red" className="c36" text={translate('popupSettingsSpaceRemoveButton')} />
            </div>
        );
    };

});

export default PopupSettingsSpaceRemove;