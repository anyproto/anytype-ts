import * as React from 'react';
import { observer } from 'mobx-react';
import { Button, IconObject, ObjectName } from 'Component';
import { commonStore } from 'Store';
import { C, Util, DataUtil, ObjectUtil, I, analytics, translate, keyboard } from 'Lib';

const Toast = observer(class Toast extends React.Component<any, any> {

    state = {
        object: null,
        target: null,
        origin: null,
    };

    render () {
        const { toast } = commonStore;
        const { count, action, text, value } = toast;
        const { object, target, origin } = this.state;
        const { rootId } = this.props;

        let buttons = [];
        let textObject = null;
        let textAction = null;
        let textOrigin = null;
        let textActionTo = null;
        let textTarget = null;

		const Element = (item: any) => (
			<div className="chunk">
				<IconObject object={item} size={18} />
				<ObjectName object={item} />
			</div>
		);

        switch (action) {
			default:
				textAction = text;
				break;

            case I.ToastAction.Lock:
                if (!object) {
                    break;
                };

                const textLocked = value ? 'locked' : 'unlocked';

                textObject = <Element {...object} />;
                textAction = `is ${textLocked}`;
                break;

            case I.ToastAction.Move:
                if (!target) {
					break;
				};

				let cnt = `${count} ${Util.cntWord(count, 'block', 'blocks')}`;

				textAction = `${cnt} moved to`;
				textTarget = <Element {...target} />;

				if (origin) {
					textAction = `${cnt} moved from`;
					textActionTo = translate('commonTo');
					textOrigin = <Element {...origin} />;
				};

				buttons = buttons.concat([
					{ action: 'open', label: 'Open' },
					{ action: 'undo', label: 'Undo' }
				]);
                break;

            case I.ToastAction.Link:
                if (!object || !target) {
					break;
				};

				textAction = 'linked to';
				textObject = <Element {...object} />;
				textTarget = <Element {...target} />;

                if (target.id != keyboard.getRootId()) {
                    buttons = buttons.concat([
                        { action: 'open', label: 'Open' }
                    ]);
                };
                break;
        };

        return (
            <div id="toast" className="toast">
                <div className="inner">
                    <div className="message">
                        {textObject}
                        <span dangerouslySetInnerHTML={{ __html: textAction }} />
                        {textOrigin}
						<span dangerouslySetInnerHTML={{ __html: textActionTo }} />
                        {textTarget}
                    </div>

                    {buttons.length ? (
						<div className="buttons">
							{buttons.map((item: any, i: number) => (
								<Button text={item.label} onClick={(e: any) => this.onClick(e, item.action)} key={i} className="toastButton" />
							))}
						</div>
					) : ''}
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
            case I.ToastAction.Lock:
                if (objectRendered || noObject) {
                    return;
                };

                if (!objectId) {
                    this.setState({ object: null });
                    return;
                };

                ids.push(objectId);
                break;

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
            DataUtil.getObjectsByIds(ids, (objects: any[]) => {
				this.setObjects(objects);
            });
        }
    };

    setObjects (objects: any) {
        const { toast } = commonStore;
        const { objectId, targetId, originId } = toast;
        const map = Util.mapToObject(objects, 'id');

        const state: any = {
            target: map[targetId]
        };

        if (objectId && map[objectId]) {
            state.object = map[objectId];
        };

        if (originId && map[originId]) {
            state.origin = map[originId];
        };

        this.setState(state);
    };

    onClick (e: any, action: string) {
       
		switch (action) {
            case 'open':
                this.onOpen(e);
                break;

            case 'undo':
                this.onUndo(e);
                break;
        };

        Util.toastHide(true);
    };

    onUndo (e: any) {
        const { toast } = commonStore;
        const { originId } = toast;

        C.ObjectUndo(originId);
		analytics.event('Undo', { route: 'toast' });
    };

    onOpen (e: any) {
        const { target } = this.state;

        ObjectUtil.openEvent(e, target);
    };

});

export default Toast;