import React, { forwardRef, useEffect, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Header, Footer, ListObjectPreview, Deleted, HeadSimple, Block } from 'Component';
import { I, C, S, U, J, focus, Action, analytics, translate, keyboard, sidebar } from 'Lib';

const PageMainType = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const headerRef = useRef(null);
	const headRef = useRef(null);
	const idRef = useRef(null);

	const getRootId = () => keyboard.getRootId(isPopup);
	const rootId = getRootId();
	const type = S.Detail.get(rootId, rootId, U.Data.typeRelationKeys());
	const subIdTemplate = S.Record.getSubId(rootId, 'templates');
	const canShowTemplates = !U.Object.getLayoutsWithoutTemplates().includes(type.recommendedLayout) && (type.uniqueKey != J.Constant.typeKey.template);

	const open = () => {
		const rootId = getRootId();

		if (idRef.current == rootId) {
			return;
		};

		close();

		idRef.current = rootId;

		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
			if (object.isDeleted) {
				return;
			};

			headerRef.current?.forceUpdate();
			headRef.current?.forceUpdate();
			sidebar.rightPanelSetState(isPopup, { rootId });
			
			loadTemplates();
		});
	};

	const close = () => {
		if (!idRef.current) {
			return;
		};

		const rootId = getRootId();
		const close = !(isPopup && (rootId == idRef.current));

		if (close) {
			Action.pageClose(idRef.current, true);
		};
	};

	const loadTemplates = () => {
		const rootId = getRootId();
		const type = S.Detail.get(rootId, rootId);

		U.Data.searchSubscribe({
			spaceId: type.spaceId,
			subId: subIdTemplate,
			filters: [
				{ relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: type.id },
				{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: J.Constant.typeKey.template },
			],
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			],
			keys: [ 'id' ],
			ignoreDeleted: true,
		});
	};

	const onTemplateAdd = () => {
		C.ObjectCreate({ targetObjectType: type.id }, [], '', J.Constant.typeKey.template, S.Common.space, message => {
			if (message.error.code) {
				return;
			};

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: type.id, route: analytics.route.store });

			templateOpen(message.details);
		});
	};

	const templateOpen = (object: any) => {
		U.Object.openConfig(object, {
			onClose: () => $(window).trigger(`updatePreviewObject.${object.id}`)
		});
	};

	const isAllowedObject = (): boolean => {
		if (!type || !type.isInstalled) {
			return false;
		};

		const canWrite = U.Space.canMyParticipantWrite();
		if (!canWrite) {
			return false;
		};

		const layout = type.recommendedLayout;

		let ret = (
			U.Object.isInPageLayouts(layout) ||
			U.Object.isInSetLayouts(layout) ||
			U.Object.isBookmarkLayout(layout) ||
			U.Object.isChatLayout(layout)
		);

		if (type.uniqueKey == J.Constant.typeKey.template) {
			ret = false;
		};

		return ret;
	};

	const onCreate = () => {
		if (U.Object.isBookmarkLayout(type.recommendedLayout)) {
			onBookmarkAdd();
		} else {
			onObjectAdd();
		};
	};

	const onMore = () => {
		const options = [
			{ id: 'set', name: translate('pageMainTypeNewSetOfObjects') }
		];

		S.Menu.open('select', {
			element: `#button-create`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {

						case 'set':
							onSetAdd();
							break;
					};
				},
			},
		});
	};

	const onEdit = () => {
		sidebar.rightPanelToggle(true, true, isPopup, 'type', { rootId });
	};

	const onObjectAdd = () => {
		const details: any = {};

		if (U.Object.isInSetLayouts(type.recommendedLayout)) {
			details.layout = type.recommendedLayout;
		};

		C.ObjectCreate(details, [ I.ObjectFlag.SelectTemplate ], type.defaultTemplateId, type.uniqueKey, S.Common.space, (message: any) => {
			if (message.error.code || !message.details) {
				return;
			};

			const object = message.details;

			U.Object.openConfig(object);
			analytics.createObject(object.type, object.layout, analytics.route.type, message.middleTime);
		});
	};

	const onBookmarkAdd = () => {
		S.Menu.open('dataviewCreateBookmark', {
			type: I.MenuType.Horizontal,
			element: `#button-create`,
			horizontal: I.MenuDirection.Right,
			data: {
				route: analytics.route.type,
			}
		});
	};

	const onSetAdd = () => {
		const details = {
			name: U.Common.sprintf(translate('commonSetName'), type.name),
			iconEmoji: type.iconEmoji,
		};

		C.ObjectCreateSet([ type.id ], details, '', S.Common.space, (message: any) => {
			if (!message.error.code) {
				focus.clear(true);
				U.Object.openConfig(message.details);
			};
		});
	};

	const onMenu = (item: any) => {
		if (S.Menu.isOpen('dataviewTemplateContext', item.id)) {
			S.Menu.close('dataviewTemplateContext');
			return;
		};

		const template: any = { 
			id: item.id, 
			typeId: type.id,
			isDefault: item.id == type.defaultTemplateId,
		};

		S.Menu.closeAll(J.Menu.dataviewTemplate, () => {
			S.Menu.open('dataviewTemplateContext', {
				menuKey: item.id,
				element: `#item-more-${item.id}`,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Right,
				onOpen: () => $(`#item-${item.id}`).addClass('active'),
				onClose: () => $(`#item-${item.id}`).removeClass('active'),
				data: {
					template,
					typeId: type.id,
					templateId: type.defaultTemplateId,
					route: analytics.route.type,
					onSetDefault: () => {
						U.Object.setDefaultTemplateId(type.id, template.id);
					},
					onDuplicate: (object: any) => {
						templateOpen(object);
					},
					onArchive: () => {
						if (template.isDefault) {
							U.Object.setDefaultTemplateId(type.id, '');
						};
					}
				}
			});
		});
	};

	const children = S.Block.getChildren(rootId, rootId, it => it.isDataview());
	const allowedObject = isAllowedObject();
	const isAllowedTemplate = type?.isInstalled && isAllowedObject() && canShowTemplates;
	const allowedBlock = type.isInstalled && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Block ]);
	const templates = S.Record.getRecordIds(subIdTemplate, '');
	const totalObject = S.Record.getMeta(S.Record.getSubId(rootId, J.Constant.blockId.dataview), '').total;
	const totalTemplate = templates.length;
	const isFileType = U.Object.isInFileLayouts(type.recommendedLayout);
	const columns: any[] = [
		{
			relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
			mapper: v => v ? U.Date.dateWithFormat(S.Common.dateFormat, v) : '',
		},
	];

	if (!isFileType) {
		columns.push({ relationKey: 'creator', name: translate('commonOwner'), isObject: true });
	};

	useEffect(() => {
		return () => close();
	}, []);

	useEffect(() => open());

	let content = null;
	if (type.isDeleted) {
		content = <Deleted {...props} />;
	} else {
		content = (
			<div>
				<Header
					{...props}
					component="mainObject"
					ref={headerRef}
					rootId={rootId}
				/>

				<div className="blocks wrapper">
					<HeadSimple
						{...props}
						ref={headRef}
						placeholder={translate('defaultNameType')}
						rootId={rootId}
						onEdit={onEdit}
					/>

					{canShowTemplates ? (
						<div className="section template">
							<div className="title">
								<div className="side left">
									{U.Common.plural(totalTemplate, translate('pluralTemplate'))}
									<span className="cnt">{totalTemplate}</span>
								</div>

								<div className="side right">
									{isAllowedTemplate ? (
										<Icon
											className="plus withBackground"
											tooltip={translate('commonCreateNewTemplate')}
											onClick={onTemplateAdd}
										/>
									) : ''}
								</div>
							</div>

							{totalTemplate || isAllowedTemplate ? (
								<div className="content">
									<ListObjectPreview
										key="listTemplate"
										getItems={() => S.Record.getRecords(subIdTemplate, [])}
										canAdd={isAllowedTemplate}
										onAdd={onTemplateAdd}
										onMenu={isAllowedTemplate ? (e: any, item: any) => onMenu(item) : null}
										onClick={(e: any, item: any) => templateOpen(item)}
										defaultId={type.defaultTemplateId}
									/>
								</div>
							) : (
								<div className="empty">
									{translate('pageMainTypeNoTemplates')}
								</div>
							)}
						</div>
					) : ''}

					{type.isInstalled ? (
						<div className="section set">
							<div className="title">
								<div className="side left">
									{U.Common.plural(totalObject, translate('pluralObject'))}
									<span className="cnt">{totalObject}</span>
								</div>

								<div className="side right">
									<Icon
										id="button-create"
										className="more withBackground"
										onClick={onMore}
									/>

									{allowedObject ? (
										<Icon
											className="plus withBackground"
											tooltip={translate('commonCreateNewObject')}
											onClick={onCreate}
										/>
									) : ''}
								</div>
							</div>
							<div className="content">
								{children.map((block: I.Block, i: number) => (
									<Block
										{...props}
										key={block.id}
										rootId={rootId}
										iconSize={20}
										block={block}
										className="noPlus"
										isSelectionDisabled={true}
										readonly={allowedBlock}
									/>
								))}
							</div>
						</div>
					) : ''}
				</div>

				<Footer component="mainObject" {...props} />
			</div>
		);
	};

	return content;

}));

export default PageMainType;