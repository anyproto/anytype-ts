import React, { FC, useRef, useEffect, MouseEvent } from 'react';
import raf from 'raf';
import { Button, IconObject, ObjectName, Icon } from 'Component';
import * as I from 'Interface';

const Toast: FC = () => {
	const nodeRef = useRef(null);
	const { toast } = S.Common;
	const { count, action, text, value, object, target, origin, ids, autoArchivedIds, autoRestoredIds, icon, uploadCounts } = toast || {};

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
			textAction = U.String.sprintf(translate('toastWidget'), U.Object.name(object, true));
			break;
		};

		case I.ToastAction.Move: {
			if (!target) {
				break;
			};

			const cnt = U.String.sprintf(translate('commonCountBlocks'), count, U.Common.plural(count, translate('pluralBlock')));

			textAction = U.String.sprintf(translate('toastMovedTo'), cnt);
			textTarget = <Element {...target} />;

			if (origin) {
				textAction = U.String.sprintf(translate('toastMovedFrom'), cnt);
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
			break;
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

			const cnt = U.String.sprintf(translate('commonCountObjects'), ids.length, U.Common.plural(ids.length, translate('pluralObject')));
			textAction = U.String.sprintf(translate('toastMovedToBin'), cnt);

			if (autoArchivedIds?.length) {
				const autoCnt = U.String.sprintf(translate('commonCountObjects'), autoArchivedIds.length, U.Common.plural(autoArchivedIds.length, translate('pluralObject')));
				textAction += '<br>' + U.String.sprintf(translate('toastAutoArchivedToBin'), autoCnt);
			};

			buttons = buttons.concat([
				{ action: 'undoArchive', label: translate('commonUndo'), data: ids }
			]);
			break;
		};

		case I.ToastAction.Restore: {
			if (!ids) {
				break;
			};

			const cnt = U.String.sprintf(translate('commonCountObjects'), ids.length, U.Common.plural(ids.length, translate('pluralObject')));
			textAction = U.String.sprintf(translate('toastMovedFromBin'), cnt);

			if (autoRestoredIds?.length) {
				const autoCnt = U.String.sprintf(translate('commonCountObjects'), autoRestoredIds.length, U.Common.plural(autoRestoredIds.length, translate('pluralObject')));
				textAction += '<br>' + U.String.sprintf(translate('toastAutoRestoredFromBin'), autoCnt);
			};

			buttons = buttons.concat([
				{ action: 'undoRestore', label: translate('commonUndo'), data: ids }
			]);
			break;
		};

		case I.ToastAction.Upload: {
			if (!uploadCounts) {
				break;
			};

			const breakdown = U.File.formatCountsBreakdown(uploadCounts);
			if (breakdown) {
				textAction = U.String.sprintf(translate('toastUploaded'), breakdown);
			};
			break;
		};

		case I.ToastAction.AutoArchive: {
			if (!ids) {
				break;
			};

			const cnt = U.String.sprintf(translate('commonCountObjects'), ids.length, U.Common.plural(ids.length, translate('pluralObject')));
			textAction = U.String.sprintf(translate('toastAutoArchivedToBin'), cnt);

			buttons = buttons.concat([
				{ action: 'openBin', label: translate('commonBin') }
			]);
			break;
		};

		case I.ToastAction.AutoRestore: {
			if (!ids) {
				break;
			};

			const cnt = U.String.sprintf(translate('commonCountObjects'), ids.length, U.Common.plural(ids.length, translate('pluralObject')));
			textAction = U.String.sprintf(translate('toastAutoRestoredFromBin'), cnt);
			break;
		};
	};

	const onCloseHandler = () => Preview.toastHide(true);

	const onClickHandler = (e: MouseEvent, item: any) => {
		switch (item.action) {
			case 'open': {
				U.Object.openConfig(e, S.Common.toast.target);
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

			case 'undoRestore': {
				if (item.data) {
					Action.archive(item.data, analytics.route.toast);
				};
				break;
			};

			case 'manageStorage': {
				Action.openSettings('storageManager', analytics.route.toast);
				S.Common.toastClear();
				break;
			};

			case 'openBin': {
				U.Object.openRoute({ layout: I.ObjectLayout.Archive });
				break;
			};
		};

		onCloseHandler();
	};

	useEffect(() => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		U.Dom.css(node, {
			display: 'block',
			opacity: '0',
			transform: 'scale3d(0.7,0.7,1)',
		});

		const isPopup = keyboard.isPopup();
		const container = U.Dom.getScrollContainer(isPopup);

		if (!container) {
			return;
		};

		const rect = container.getBoundingClientRect();
		const y = rect.top + 32;
		let x = 0;

		if (isPopup) {
			x = rect.left + rect.width / 2 - node.offsetWidth / 2;
		} else {
			const { ww } = U.Dom.getWindowDimensions();
			const sw = sidebar.getDummyWidth();
			x = (ww - sw) / 2 - node.offsetWidth / 2 + sw;
		};

		raf(() => {
			U.Dom.css(node, {
				left: `${x}px`,
				top: `${y}px`,
				opacity: '1',
				transform: 'scale3d(1,1,1)',
			});
		});

		const onEnter = () => Preview.toastPauseHide();
		const onLeave = () => Preview.toastResumeHide();

		U.Dom.addEvents(node, [
			['mouseenter', onEnter],
			['mouseleave', onLeave],
		]);

		return () => {
			U.Dom.removeEvents(node, [
				['mouseenter', onEnter],
				['mouseleave', onLeave],
			]);
		};
	}, [ toast ]);

	return toast ? (
		<div ref={nodeRef} id="toast" className="toast" onClick={onCloseHandler}>
			<div className="inner">

				{icon ? <Icon name={({ check: 'common/tick', notice: 'common/alert' })[icon] || icon} color={icon == 'notice' ? 'red' : ''} /> : ''}

				<div className="message">
					{textObject}
					{textAction ? <span dangerouslySetInnerHTML={{ __html: U.String.sanitize(textAction) }} /> : ''}
					{textOrigin}
					{textActionTo ? <span dangerouslySetInnerHTML={{ __html: U.String.sanitize(textActionTo) }} /> : ''}
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

};

export default Toast;
