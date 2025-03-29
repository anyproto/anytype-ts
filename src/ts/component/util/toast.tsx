import React, { FC, useRef, useEffect, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import raf from 'raf';
import { Button, IconObject, ObjectName, Icon } from 'Component';
import { I, S, U, Preview, Action, translate, keyboard, analytics, sidebar } from 'Lib';

const Toast: FC = observer(() => {
	const nodeRef = useRef(null);
	const { toast } = S.Common;
	const { count, action, text, value, object, target, origin, ids, icon } = toast || {};

	let buttons = [];
	let textObject = null;
	let textAction = null;
	let textOrigin = null;
	let textActionTo = null;
	let textTarget = null;

	const Element = (item: any) => (
		<div className="chunk">
			<IconObject object={item} size={18} />
			<ObjectName object={item} withPlural={true} />
		</div>
	);

	switch (action) {
		default: {
			textAction = text;
			break;
		};

		case I.ToastAction.Lock: {
			textObject = object ? <Element {...object} /> : translate('commonObject');
			textAction = value ? translate('toastIsLocked') : translate('toastIsUnlocked');
			break;
		};

		case I.ToastAction.Widget: {
			textAction = U.Common.sprintf(translate('toastWidget'), U.Object.name(object, true));
			break;
		};

		case I.ToastAction.Move: {
			if (!target) {
				break;
			};

			const cnt = `${count} ${U.Common.plural(count, translate('pluralBlock'))}`;

			textAction = U.Common.sprintf(translate('toastMovedTo'), cnt);
			textTarget = <Element {...target} />;

			if (origin) {
				textAction = U.Common.sprintf(translate('toastMovedFrom'), cnt);
				textActionTo = translate('commonTo');
				textOrigin = <Element {...origin} />;
			};

			buttons = buttons.concat([
				{ action: 'open', label: translate('commonOpen') },
				{ action: 'undo', label: translate('commonUndo') }
			]);
			break;
		};

		case I.ToastAction.Collection:
		case I.ToastAction.Link: {
			if (!object || !target) {
				break;
			};

			textAction = action == I.ToastAction.Collection ? translate('toastAddedToCollection') : translate('toastLinkedTo');
			textObject = <Element {...object} />;
			textTarget = <Element {...target} />;

			if (target.id != keyboard.getRootId()) {
				buttons = buttons.concat([
					{ action: 'open', label: translate('commonOpen') }
				]);
			};
			break;
		};

		case I.ToastAction.StorageFull: {
			textAction = translate('toastUploadLimitExceeded');

			buttons = buttons.concat([ 
				{ action: 'manageStorage', label: translate('toastManageFiles') }
			]);
		};

		case I.ToastAction.TemplateCreate: {
			if (!object) {
				break;
			};

			textObject = <Element {...object} />;
			textAction = translate('toastTemplateCreate');
			break;
		};

		case I.ToastAction.Archive: {
			if (!ids) {
				break;
			};

			const cnt = `${ids.length} ${U.Common.plural(ids.length, translate('pluralObject'))}`;
			textAction = U.Common.sprintf(translate('toastMovedToBin'), cnt);

			buttons = buttons.concat([
				{ action: 'undoArchive', label: translate('commonUndo'), data: ids }
			]);
			break;
		};
	};

	const onCloseHandler = () => Preview.toastHide(true);

	const onClickHandler = (e: MouseEvent, item: any) => {
		switch (item.action) {
			case 'open': {
				U.Object.openEvent(e, S.Common.toast.target);
				break;
			};

			case 'undo': {
				keyboard.onUndo(S.Common.toast.originId, 'Toast');
				break;
			};

			case 'undoArchive': {
				if (item.data) {
					Action.restore(item.data, analytics.route.toast);
				};
				break;
			};

			case 'manageStorage': {
				U.Object.openAuto({ id: 'storageManager', layout: I.ObjectLayout.Settings });
				S.Common.toastClear();
			};
		};

		onCloseHandler();
	};

	useEffect(() => {
		const node = $(nodeRef.current);
		const { ww } = U.Common.getWindowDimensions();
		const y = 32;
		const sw = sidebar.getDummyWidth();
		const x = (ww - sw) / 2 - node.outerWidth() / 2 + sw;

		node.show().css({ opacity: 0, transform: 'scale3d(0.7,0.7,1)' });

		raf(() => {
			node.css({ left: x, top: y, opacity: 1, transform: 'scale3d(1,1,1)' });
		});
	});

	return toast ? (
		<div ref={nodeRef} id="toast" className="toast" onClick={onCloseHandler}>
			<div className="inner">

				{icon ? <Icon className={icon} /> : ''}

				<div className="message">
					{textObject}
					{textAction ? <span dangerouslySetInnerHTML={{ __html: U.Common.sanitize(textAction) }} /> : ''}
					{textOrigin}
					{textActionTo ? <span dangerouslySetInnerHTML={{ __html: U.Common.sanitize(textActionTo) }} /> : ''}
					{textTarget}
				</div>

				{buttons.length ? (
					<div className="buttons">
						{buttons.map((item: any, i: number) => (
							<Button key={i} text={item.label} onClick={e => onClickHandler(e, item)} />
						))}
					</div>
				) : ''}
			</div>
		</div>
	) : null;

});

export default Toast;
