import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Label, ObjectName, IconObject } from 'Component';
import { I, UtilObject, keyboard, sidebar } from 'Lib';
import { dbStore, detailStore, popupStore } from 'Store';

interface Props extends I.HeaderComponent {
    text: string;
    layout: I.ObjectLayout;
};

const HeaderMainTemplate = observer(class HeaderMainEmpty extends React.Component<Props, {}> {

    constructor (props: Props) {
        super(props);

        this.onOpen = this.onOpen.bind(this);
    };

    render () {
        const { rootId } = this.props;
        const cmd = keyboard.cmdSymbol();
        const object = detailStore.get(rootId, rootId, [ 'type', 'targetObjectType' ], true);
        const type = dbStore.getType(object.targetObjectType);

        console.log('TYPE: ', type)

        return (
            <React.Fragment>
                <div className="side left">
                    <Icon
                        className="toggle big"
                        tooltip="Toggle sidebar fixed mode"
                        tooltipCaption={`${cmd} + \\, ${cmd} + .`}
                        tooltipY={I.MenuDirection.Bottom}
                        onClick={() => sidebar.toggleExpandCollapse()}
                    />
                    <Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
                </div>

                <div className="side center">
                    <div className="templateBanner">
                        <Label text="You are editing a template of" />
                        <div className="typeName" onClick={() => UtilObject.openAuto(type)}>
                            <IconObject object={type} />
                            <ObjectName object={type} />
                        </div>
                    </div>
                </div>
                <div className="side right" />
            </React.Fragment>
        );
    };

    onOpen () {
        popupStore.closeAll(null, () => {
            UtilObject.openRoute({ layout: this.props.layout });
        });
    };

});

export default HeaderMainTemplate;