import React, { forwardRef, useRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, C, J, translate, sidebar, keyboard, analytics, Storage, Action, Preview } from 'Lib';

const WidgetSpace = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const { parent } = props;
	const space = U.Space.getSpaceview();
	const plusRef = useRef(null);
	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const requestCnt = participants.filter(it => it.isJoining || it.isRemoving).length;
	const isSpaceOwner = U.Space.isMyOwner();
	const canWrite = U.Space.canMyParticipantWrite();
	const cn = [ 'body' ];
	const cmd = keyboard.cmdSymbol();
	const alt = keyboard.altSymbol();
	const buttons = [
		space.chatId && U.Object.isAllowedChat() ? { id: 'chat', name: translate('commonMainChat') } : null,
		space.isShared ? { id: 'member', name: translate('commonMembers') } : null,
		{ id: 'all', name: translate('commonAllContent') },
	].filter(it => it);

	if (isSpaceOwner && requestCnt) {
		cn.push('withCnt');
	};

	const openSettings = (page: string) => {
		S.Popup.open('settings', { data: { page, isSpace: true }, className: 'isSpace' });
	};

	const onSettings = (e: MouseEvent) => {
		e.stopPropagation();
		openSettings('spaceIndex');
	};

	const onImport = (e: MouseEvent) => {
		e.stopPropagation();
		openSettings('importIndex');
	};

	const onSearch = (e: MouseEvent) => {
		e.stopPropagation();
		keyboard.onSearchPopup(analytics.route.widget);
	};

	const onCreate = (e: MouseEvent) => {
		e.stopPropagation();
		keyboard.pageCreate({}, analytics.route.navigation, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
	};

	const onMore = (e: MouseEvent, context: any, item: any) => {
		e.stopPropagation();

		const { props } = context;
		const { className, classNameWrap } = props.param;
		const type = S.Record.getTypeById(item.id);
		const isPinned = Storage.getPinnedTypes().includes(item.id);
		const canPin = type.isInstalled;
		const canDefault = type.isInstalled && !U.Object.isInSetLayouts(item.recommendedLayout) && (type.id != S.Common.type);
		const canDelete = type.isInstalled && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);
		const route = '';

		let options: any[] = [
			canPin ? { id: 'pin', name: (isPinned ? translate('commonUnpin') : translate('commonPin')) } : null,
			canDefault ? { id: 'default', name: translate('commonSetDefault') } : null,
			{ id: 'open', name: translate('commonOpenType') },
		];

		if (canDelete) {
			options = options.concat([
				{ isDiv: true },
				{ id: 'remove', name: translate('commonDelete'), color: 'red' },
			]);
		};

		S.Menu.open('select', {
			element: `#${props.getId()} #item-${item.id} .icon.more`,
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
			className,
			classNameWrap,
			data: {
				options,
				onSelect: (event: any, element: any) => {
					switch (element.id) {

						case 'open': {
							U.Object.openAuto(item);
							break;
						};

						case 'pin': {
							isPinned ? Storage.removePinnedType(item.id) : Storage.addPinnedType(item.id);
							analytics.event(isPinned ? 'UnpinObjectType' : 'PinObjectType', { objectType: item.uniqueKey, route });
							context.forceUpdate();
							break;
						};

						case 'default': {
							S.Common.typeSet(item.uniqueKey);
							analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route });
							context.forceUpdate();
							break;
						};

						case 'remove': {
							if (S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ])) {
								Action.uninstall(item, true, route);
							};
							break;
						};
					};
				}
			}
		});
	};

	const getClipboardData = async () => {
		let ret = [];
		try { ret = await navigator.clipboard.read(); } catch (e) { /**/ };
		return ret;
	};

	const onPaste = async () => {
		const type = S.Record.getTypeById(S.Common.type);
		const data = await getClipboardData();

		data.forEach(async item => {
			let text = '';
			let html = '';

			if (item.types.includes('text/plain')) {
				const textBlob = await item.getType('text/plain');

				if (textBlob) {
					text = await textBlob.text();
				};
			};

			if (item.types.includes('text/html')) {
				const htmlBlob = await item.getType('text/html');

				if (htmlBlob) {
					html = await htmlBlob.text();
				};
			};

			if (!text && !html) {
				return;
			};

			const url = U.Common.matchUrl(text);
			const cb = (object: any, time: number) => {
				U.Object.openAuto(object);
				analytics.createObject(object.type, object.layout, analytics.route.navigation, time);
			};

			if (url) {
				C.ObjectCreateBookmark({ source: url }, S.Common.space, (message: any) => {
					cb(message.details, message.middleTime);
				});
			} else {
				C.ObjectCreate({}, [], type?.defaultTemplateId, type?.uniqueKey, S.Common.space, (message: any) => {
					if (message.error.code) {
						return;
					};

					const object = message.details;
					C.BlockPaste (object.id, '', { from: 0, to: 0 }, [], false, { html, text }, '', () => cb(object, message.middleTime));
				});
			};
		});
	};

	const onArrow = (e: MouseEvent) => {
		e.stopPropagation();

		const buttons = [
			{ id: 'import', icon: 'import', name: translate('commonImport'), onClick: onImport },
		].map((it: any) => {
			it.isButton = true;
			return it;
		});

		const check = async () => {
			const items = await getClipboardData();

			if (items.length) {
				buttons.unshift({ id: 'clipboard', icon: 'clipboard', name: translate('widgetItemClipboard'), onClick: onPaste });
			};

			S.Menu.open('typeSuggest', {
				element: `#widget-${parent.id}-arrow`,
				offsetY: 2,
				className: 'fixed',
				classNameWrap: 'fromSidebar',
				data: {
					noStore: true,
					onMore,
					buttons,
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts().concat(U.Object.getSetLayouts()) },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
					],
					onClick: (item: any) => {
						let flags: I.ObjectFlag[] = [];
						if (!U.Object.isInSetLayouts(item.recommendedLayout)) {
							flags = flags.concat([ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
						};

						C.ObjectCreate({}, flags, item.defaultTemplateId, item.uniqueKey, S.Common.space, (message: any) => {
							if (message.error.code || !message.details) {
								return;
							};

							const object = message.details;

							U.Object.openAuto(object);

							analytics.event('SelectObjectType', { objectType: object.type });
							analytics.createObject(object.type, object.layout, analytics.route.navigation, message.middleTime);
						});
					},
				},
			});
		};

		check();
	};

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'member': {
				S.Popup.open('settings', { data: { page: 'spaceShare', isSpace: true }, className: 'isSpace' });
				break;
			};

			case 'all': {
				sidebar.objectContainerSwitch('object');
				break;
			};

			case 'chat': {
				U.Object.openAuto({ id: S.Block.workspace, layout: I.ObjectLayout.Chat });
				break;
			};
		};
	};

	const onPlusHover = (e: MouseEvent) => {
		const t = Preview.tooltipCaption(translate('commonCreateNewObject'), `${cmd} + N / ${cmd} + ${alt} + N`);

		Preview.tooltipShow({ text: t, element: $(plusRef.current) });
	};

	return (
		<div 
			className={cn.join(' ')}
			onClick={onSettings}
		>
			<div className="sides">
				<div className="side left">
					<IconObject 
						id="widget-space-icon" 
						object={{ ...space, layout: I.ObjectLayout.SpaceView }} 
						size={18}
						iconSize={18}
						menuParam={{ className: 'fixed' }}
					/>
					<div className="txt">
						<ObjectName object={space} />
					</div>
				</div>
				<div className="side right">
					<Icon className="search withBackground" onClick={onSearch} tooltip={translate('commonSearch')} tooltipCaption={keyboard.getCaption('search')} />

					{canWrite ? (
						<div className="plusWrapper" onMouseEnter={onPlusHover} onMouseLeave={() => Preview.tooltipHide()}>
							<Icon ref={plusRef} className="plus withBackground" onClick={onCreate} />
							<Icon id={`widget-${parent.id}-arrow`} className="arrow withBackground" onClick={onArrow} />
						</div>
					) : ''}
				</div>
			</div>

			<div className="buttons">
				{buttons.map((item, i) => {
					let cnt = null;

					if (item.id == 'member') {
						cnt = <div className="cnt">{requestCnt}</div>;
					};

					return (
						<div 
							key={i} 
							id={`item-${item.id}`} 
							className="item" 
							onClick={e => onButtonClick(e, item)}
						>
							<div className="side left">
								<Icon className={item.id} />
								<div className="name">
									{item.name}
								</div>
							</div>
							<div className="side right">
								{cnt}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);

}));

export default WidgetSpace;
