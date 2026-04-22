import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Button, Icon, Widget, IconObject, ObjectName, Label, Sync } from 'Component';
import { I, C, M, S, U, J, keyboard, analytics, translate, sidebar, Action } from 'Lib';

const SidebarPageWidgetManage = forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { sidebarDirection } = props;
	const { widgetSections } = S.Common;
	const { widgets } = S.Block;
	const spaceview = U.Space.getSpaceview();
	const canWrite = U.Space.canMyParticipantWrite();
	const isOwner = U.Space.isMyOwner();
	const bodyRef = useRef<HTMLDivElement>(null);
	const [ , setDummy ] = useState(0);
	const forceUpdate = () => setDummy(v => v + 1);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const getChild = (id: string): I.Block => {
		const childrenIds = S.Block.getChildrenIds(widgets, id);
		if (!childrenIds.length) {
			return null;
		};
		return S.Block.getLeaf(widgets, childrenIds[0]);
	};

	const getPinnedBlocks = () => {
		return S.Block.getChildren(widgets, widgets, (block: I.Block) => {
			if (!block.isWidget()) {
				return false;
			};

			const child = getChild(block.id);
			if (!child) {
				return false;
			};

			const target = child.getTargetObjectId();

			if ([ J.Constant.widgetId.allObject, J.Constant.widgetId.chat, J.Constant.widgetId.bin ].includes(target)) {
				return false;
			};

			if (Object.values(J.Constant.widgetId).includes(target)) {
				return false;
			};

			const object = S.Detail.get(widgets, target);
			if (!object || object._empty_ || object.isArchived || object.isDeleted) {
				return false;
			};

			return true;
		});
	};

	const onDone = () => {
		sidebar.leftPanelSubPageOpen('widget', true, true);
	};

	const onAddPin = () => {
		S.Menu.open('searchObject', {
			className: 'single fixed',
			classNameWrap: 'fromSidebar',
			element: '#button-manage-add-pin',
			offsetY: 4,
			data: {
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
					{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] },
				],
				onSelect: (el: any) => {
					Action.createWidgetFromObject(widgets, el.id, '', I.BlockPosition.InnerFirst, analytics.route.widget);
				},
			},
		});
	};

	const onUnpin = (e: React.MouseEvent, block: I.Block) => {
		e.preventDefault();
		e.stopPropagation();

		C.BlockListDelete(widgets, [ block.id ]);
	};

	const onToggleSection = (e: React.MouseEvent, sectionId: I.WidgetSection) => {
		e.preventDefault();
		e.stopPropagation();

		const idx = widgetSections.findIndex(it => it.id == sectionId);
		if (idx < 0) {
			return;
		};

		widgetSections[idx].isHidden = !widgetSections[idx].isHidden;
		S.Common.widgetSectionsSet([ ...widgetSections ]);

		analytics.event(widgetSections[idx].isHidden ? 'HideSection' : 'ShowSection');
		forceUpdate();
	};

	const onPinDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!active || !over || (active.id == over.id)) {
			return;
		};

		C.BlockListMoveToExistingObject(widgets, widgets, String(over.id), [ String(active.id) ], I.BlockPosition.Top);
		analytics.event('ReorderWidget');
	};

	const onSectionDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!active || !over || (active.id == over.id)) {
			return;
		};

		const fixedIds = [ String(I.WidgetSection.Pin), String(I.WidgetSection.Unread) ];
		if (fixedIds.includes(String(active.id)) || fixedIds.includes(String(over.id))) {
			return;
		};

		const oldIndex = widgetSections.findIndex(it => String(it.id) == String(active.id));
		const newIndex = widgetSections.findIndex(it => String(it.id) == String(over.id));

		if ((oldIndex < 0) || (newIndex < 0)) {
			return;
		};

		S.Common.widgetSectionsSet(arrayMove(widgetSections, oldIndex, newIndex));
		analytics.event('ReorderSection', { type: active.id });
		forceUpdate();
	};

	const spaceBlock = new M.Block({
		id: J.Constant.widgetId.space,
		type: I.BlockType.Widget,
		content: { layout: I.WidgetLayout.Space },
	});

	const pinnedBlocks = getPinnedBlocks();
	const sectionOptions = U.Menu.widgetSections();
	const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);

	const onSync = () => {
		S.Menu.closeAllForced(null, () => {
			S.Menu.open('syncStatus', {
				element: '#headerSync',
				offsetY: 4,
				classNameWrap: 'fixed fromSidebar',
				subIds: J.Menu.syncStatus,
			});
		});
	};

	useEffect(() => {
		S.Common.widgetSectionsInit();
	}, []);

	const head = (
		<>
			<div className="side left">
				<Icon
					id="button-widget-panel-toggle"
					name="widget/vaultToggle" className="vaultToggle" withBackground={true}
					onClick={() => sidebar.leftPanelToggle(true, true)}
					tooltipParam={{ text: translate('commonToggleSidebar'), typeY: I.MenuDirection.Bottom }}
				/>
				<Icon
					name="header/widget" withBackground={true}
					onClick={() => sidebar.leftPanelSubPageToggle('widget', true, true)}
					tooltipParam={{
						text: translate('commonWidgets'),
						caption: keyboard.getCaption('widget'),
						typeY: I.MenuDirection.Bottom,
					}}
				/>
			</div>
			<div className="side right">
				<Icon
					id="button-widget-search"
					name="common/search" withBackground={true}
					onClick={() => keyboard.onSearchPopup(analytics.route.widget)}
					tooltipParam={{ text: translate('commonSearch'), typeY: I.MenuDirection.Bottom }}
				/>
				{spaceview.isShared ? (
					<Icon
						id="button-widget-members"
						name="widget/member"
						withBackground={true}
						inner={<Label className="cnt" text={String(members.length)} />}
						onClick={() => Action.openSpaceShare(analytics.route.widget)}
						tooltipParam={{ text: translate('commonMembers'), typeY: I.MenuDirection.Bottom }}
					/>
				) : ''}
				<Sync id="headerSync" onClick={onSync} />
			</div>
		</>
	);

	const PinnedItem = ({ block, index }: { block: I.Block; index: number }) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: !canWrite });
		const child = getChild(block.id);
		const targetId = child?.getTargetObjectId();
		const object = S.Detail.get(widgets, targetId);
		const style = { transform: CSS.Transform.toString(transform), transition };
		const cn = [ 'manageItem' ];

		if (isDragging) {
			cn.push('isDragging');
		};

		return (
			<motion.div
				ref={setNodeRef}
				className={cn.join(' ')}
				style={style}
				{...attributes}
				{...listeners}
				{...U.Common.animationProps({ transition: { duration: 0.2, delay: index * 0.03 } })}
			>
				<Icon className="dnd" name="common/dnd" />
				<IconObject object={object} size={20} iconSize={20} />
				<ObjectName object={object} />
				<Icon
					className="action"
					name="menu/action/unpin"
					onClick={e => onUnpin(e, block)}
					tooltipParam={{ text: translate('menuWidgetUnpinFromChannel'), typeY: I.MenuDirection.Bottom }}
				/>
			</motion.div>
		);
	};

	const SectionItem = ({ section, index }: { section: any; index: number }) => {
		const isFixed = [ I.WidgetSection.Pin, I.WidgetSection.Unread ].includes(section.id);
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(section.id), disabled: (!canWrite || isFixed) });
		const cfg = widgetSections.find(it => it.id == section.id);
		const isHidden = !!cfg?.isHidden;
		const style = { transform: CSS.Transform.toString(transform), transition };
		const cn = [ 'manageItem' ];

		if (isDragging) {
			cn.push('isDragging');
		};
		if (isFixed) {
			cn.push('isFixed');
		};

		return (
			<motion.div
				ref={setNodeRef}
				className={cn.join(' ')}
				style={style}
				{...(isFixed ? {} : attributes)}
				{...(isFixed ? {} : listeners)}
				{...U.Common.animationProps({ transition: { duration: 0.2, delay: index * 0.03 } })}
			>
				{isFixed ? <Icon className="dnd" /> : <Icon className="dnd" name="common/dnd" />}
				<Label text={section.name} />
				<Icon
					className="action"
					name={isHidden ? 'common/eye0' : 'common/eye1'}
					onClick={e => onToggleSection(e, section.id)}
					tooltipParam={{ text: translate(isHidden ? 'widgetShowSection' : 'widgetHideSection'), typeY: I.MenuDirection.Bottom }}
				/>
			</motion.div>
		);
	};

	return (
		<>
			<div id="head" className="head isManage">
				{head}
			</div>

			<div id="body" ref={bodyRef} className="body">
				<div className="content">
					<motion.div {...U.Common.animationProps({ transition: { duration: 0.2 } })}>
						<Widget
							block={spaceBlock}
							disableContextMenu={true}
							canEdit={false}
							canRemove={false}
							sidebarDirection={sidebarDirection}
							getObject={id => id ? spaceview : null}
						/>
					</motion.div>

					{isOwner ? (
						<motion.div
							className="manageSection"
							{...U.Common.animationProps({ transition: { duration: 0.2, delay: 0.05 } })}
						>
							<div className="sectionHead">
								<Label text={translate('widgetManageChannelPins')} />
								{canWrite ? (
									<Icon
										id="button-manage-add-pin"
										className="add"
										name="plus/widgetSection"
										onClick={onAddPin}
										size={12}
										tooltipParam={{ text: translate('commonAdd'), typeY: I.MenuDirection.Bottom }}
									/>
								) : ''}
							</div>
							<div className="items">
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragEnd={onPinDragEnd}
									modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
								>
									<SortableContext items={pinnedBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
										{pinnedBlocks.map((block, i) => <PinnedItem key={block.id} block={block} index={i} />)}
									</SortableContext>
								</DndContext>
								{!pinnedBlocks.length ? (
									<div className="empty">{translate('widgetManageChannelPinsEmpty')}</div>
								) : ''}
							</div>
						</motion.div>
					) : ''}

					<motion.div
						className="manageSection"
						{...U.Common.animationProps({ transition: { duration: 0.2, delay: 0.1 } })}
					>
						<div className="sectionHead">
							<Label text={translate('widgetManagePersonal')} />
						</div>
						<div className="items">
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={onSectionDragEnd}
								modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
							>
								<SortableContext items={sectionOptions.filter(s => ![ I.WidgetSection.Pin, I.WidgetSection.Unread ].includes(s.id)).map(s => String(s.id))} strategy={verticalListSortingStrategy}>
									{sectionOptions.map((section, i) => <SectionItem key={section.id} section={section} index={i} />)}
								</SortableContext>
							</DndContext>
						</div>
					</motion.div>

					<motion.div
						className="buttons"
						{...U.Common.animationProps({ transition: { duration: 0.2, delay: 0.15 } })}
					>
						<Button text={translate('commonDone')} color="accent" size={36} onClick={onDone} />
					</motion.div>
				</div>
			</div>
		</>
	);

});

export default SidebarPageWidgetManage;
