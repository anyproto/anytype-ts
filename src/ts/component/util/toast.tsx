import React, { FC, useRef, useEffect, useState, MouseEvent } from 'react';
import raf from 'raf';
import { Button, IconObject, ObjectName, Icon } from 'Component';
import * as I from 'Interface';

const Toast: FC = () => {
	const nodeRef = useRef(null);
	const { toast } = S.Common;
	const { count, action, text, value, object, target, origin, ids, cleanupIds, icon, uploadCounts } = toast || {};

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

			buttons = buttons.concat([
				{ action: 'undoArchive', label: translate('commonUndo'), data: ids }
			]);

			// Orphans left behind by this archive: same toast, extra line and a way in.
			if (cleanupIds?.length) {
				const cleanupCnt = U.String.sprintf(translate('commonCountObjects'), cleanupIds.length, U.Common.plural(cleanupIds.length, translate('pluralObject')));

				textAction += '<br>' + U.String.sprintf(translate('toastCleanup'), cleanupCnt);
				buttons = buttons.concat([
					{ action: 'reviewCleanup', label: translate('commonReview'), data: cleanupIds }
				]);
			};
			break;
		};

		case I.ToastAction.Restore: {
			if (!ids) {
				break;
			};

			const cnt = U.String.sprintf(translate('commonCountObjects'), ids.length, U.Common.plural(ids.length, translate('pluralObject')));
			textAction = U.String.sprintf(translate('toastMovedFromBin'), cnt);

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

		case I.ToastAction.Cleanup: {
			if (!ids || !ids.length) {
				break;
			};

			const cnt = U.String.sprintf(translate('commonCountObjects'), ids.length, U.Common.plural(ids.length, translate('pluralObject')));
			textAction = U.String.sprintf(translate('toastCleanup'), cnt);

			buttons = buttons.concat([
				{ action: 'reviewCleanup', label: translate('commonReview'), data: ids }
			]);
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

			case 'reviewCleanup': {
				if (item.data) {
					S.Popup.open('cleanup', { data: { objectIds: item.data } });
				};
				break;
			};
		};

		onCloseHandler();
	};

	const [copied, setCopied] = useState(false);

	const getRawText = (): string => {
		if (typeof textAction === 'string') {
			return textAction.replace(/<[^>]*>/g, '').trim();
		}
		if (typeof text === 'string') return text.trim();
		return '';
	};

	const onCopyHandler = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const raw = getRawText();
		if (raw) {
			U.Common.clipboardCopy({ text: raw });
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	useEffect(() => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		setCopied(false);

		U.Dom.css(node, {
			display: 'block',
			opacity: '0',
			transform: 'translateY(16px)',
		});

		raf(() => {
			U.Dom.css(node, {
				opacity: '1',
				transform: 'translateY(0px)',
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

	const rawText = getRawText();

	return toast ? (
		<div ref={nodeRef} id="toast" className="toast" onClick={e => e.stopPropagation()}>
			<div className="inner">
				<div className="toastContent">
					{icon ? (
						<div className="iconWrapper">
							<Icon name={({ check: 'common/tick', notice: 'common/alert' })[icon] || icon} color={icon == 'notice' ? 'red' : ''} />
						</div>
					) : ''}

					<div className="message">
						{textObject}
						{textAction ? <span dangerouslySetInnerHTML={{ __html: U.String.sanitize(textAction) }} /> : ''}
						{textOrigin}
						{textActionTo ? <span dangerouslySetInnerHTML={{ __html: U.String.sanitize(textActionTo) }} /> : ''}
						{textTarget}
					</div>

					<div className="closeBtn" onClick={onCloseHandler} title="Close">
						<Icon name="menu/action/remove" size={14} />
					</div>
				</div>

				<div className="toastFooter">
					{rawText ? (
						<div className="copyAction" onClick={onCopyHandler} title="Copy text to clipboard">
							<Icon name="menu/action/copy" size={13} />
							<span>{copied ? 'Copied!' : 'Copy'}</span>
						</div>
					) : <div />}

					{buttons.length ? (
						<div className="buttons">
							{buttons.map((item: any, i: number) => (
								<Button key={i} size={28} text={item.label} onClick={e => onClickHandler(e, item)} />
							))}
						</div>
					) : ''}
				</div>
			</div>
		</div>
	) : null;

};

export default Toast;
