import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { commonStore } from 'Store';
import { C, Util, DataUtil, I } from 'Lib';

const Toast = observer(class Toast extends React.Component<any, any> {

    state = {
        object: null,
        target: null,
        origin: null,
    };

    render () {
        const { toast } = commonStore;
        const { objectsLength, action } = toast;
        const { object, target, origin } = this.state;

        const undo = <div className="toastButton" onClick={() => this.onClick('undo')}>Undo</div>;
        const open = <div className="toastButton" onClick={() => this.onClick('open')}>Open</div>;

		let withButtons = false;
        let buttons = null;
        let textObject = null;
        let textAction = null;
        let textOrigin = null;
        let textActionTo = null;
        let textTarget = null;

		const Element = (item: any) => (
			<div className="name">
				<IconObject object={item} size={18} />
				<ObjectName object={item} />
			</div>
		);

        switch (action) {
            case I.ToastAction.Move:
                if (!target) {
					break;
				};

				withButtons = true;
				textAction = 'moved to';
				textTarget = <Element {...target} />;

				textObject = (
					<div className="name">
						{objectsLength} {Util.cntWord(objectsLength, 'block', 'blocks')}
					</div>
				);

				if (origin) {
					textAction = 'moved from';
					textActionTo = 'to';
					textOrigin = <Element {...origin} />;
				};
                break;

            case I.ToastAction.Link:
                if (!object || !target) {
					break;
				};

				textAction = 'linked to';
				textObject = <Element {...object} />;
				textTarget = <Element {...target} />;
                break;
        };

        if (withButtons) {
            buttons = (
                <div className="buttons">
                    {open}
                    {undo}
                </div>
            );
        };

        return (
            <div id="toast" className="toast">
                <div className="inner">
                    <div className="message">
                        {textObject}
                        {textAction}
                        {textOrigin}
                        {textActionTo}
                        {textTarget}
                    </div>

                    {buttons}
                </div>
            </div>
        );
    };

    componentDidUpdate () {
        this.update();
    };

    update () {
        const { toast } = commonStore;
        const { objectId, targetId, originId, action } = toast;
        const { object, target } = this.state;

        const noObject = !objectId && !object;
        const noTarget = !targetId && !target;
        const objectRendered = object && (objectId === object.id);
        const targetRendered = target && (targetId === target.id);

		let ids = [];

        switch (action) {
            case I.ToastAction.Move:
                if (targetRendered || noTarget) {
                    return;
                };

                if (!targetId) {
                    this.setState({ target: null });
                    return;
                };

                ids.push(targetId);
                ids.push(originId);
                break;

            case I.ToastAction.Link:
                if ((targetRendered && objectRendered) || noTarget || noObject) {
                    return;
                };

                if (!objectId || !targetId) {
                    this.setState({ object: null, target: null });
                    return;
                };

                ids.push(objectId);
                ids.push(targetId);
                break;
        };

        if (ids.length) {
            DataUtil.getObjectsByIds(ids, (message: any) => {
                if (!message.error.code) {
                    this.setRecords(message.records);
                };
            });
        }
    };

    setRecords (records: any) {
        const { toast } = commonStore;
        const { objectId, targetId, originId } = toast;
        const recordsObj = Util.mapToObject(records, 'id');

        const state: any = {
            target: recordsObj[targetId]
        };

        if (objectId && recordsObj[objectId]) {
            state.object = recordsObj[objectId];
        };

        if (originId && recordsObj[originId]) {
            state.origin = recordsObj[originId];
        };

        this.setState(state);
    };

    onClick (action: string) {
       
		switch (action) {
            case 'open':
                this.onOpen();
                break;

            case 'undo':
                this.onUndo();
                break;
        };

        Util.toastHide(true);
    };

    onUndo () {
        const { toast } = commonStore;
        const { originId } = toast;

        C.ObjectUndo(originId);
    };

    onOpen () {
        const { toast } = commonStore;
        const { targetId } = toast;

        DataUtil.objectOpenRoute({ id: targetId });
    };

});

export default Toast;