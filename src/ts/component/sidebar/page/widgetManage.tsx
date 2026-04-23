import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Button, Icon, Widget, Label, Sync } from 'Component';
import { I, M, S, U, J, keyboard, analytics, translate, sidebar, Action } from 'Lib';

const SidebarPageWidgetManage = forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { sidebarDirection } = props;
	const { widgetSections } = S.Common;
	const { widgets } = S.Block;
	const spaceview = U.Space.getSpaceview();
	const canWrite = U.Space.canMyParticipantWrite();
	const bodyRef = useRef<HTMLDivElement>(null);
	const [ , setDummy ] = useState(0);
	const forceUpdate = () => setDummy(v => v + 1);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const onDone = () => {
		sidebar.leftPanelSubPageOpen('widget', true, true);
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

	const onSectionDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!active || !over || (active.id == over.id)) {
			return;
		};

		const isFixed = (id: any) => I.FIXED_WIDGET_SECTIONS.includes(Number(id));
		if (isFixed(active.id) || isFixed(over.id)) {
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

	const SectionItem = ({ section, index }: { section: any; index: number }) => {
		const isFixed = I.FIXED_WIDGET_SECTIONS.includes(section.id);
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(section.id), disabled: (!canWrite || isFixed) });
		const cfg = widgetSections.find(it => it.id == section.id);
		const isHidden = !!cfg?.isHidden;
		const style = { transform: CSS.Transform.toString(transform), transition };
		const cn = [ 'manageItem', 'isSection' ];

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
				{!isFixed ? (
					<Icon
						className="action"
						name={isHidden ? 'common/eye0' : 'common/eye1'}
						onClick={e => onToggleSection(e, section.id)}
						tooltipParam={{ text: translate(isHidden ? 'widgetShowSection' : 'widgetHideSection'), typeY: I.MenuDirection.Bottom }}
					/>
				) : ''}
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

					<motion.div
						className="manageSection"
						{...U.Common.animationProps({ transition: { duration: 0.2, delay: 0.1 } })}
					>
						<div className="items">
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={onSectionDragEnd}
								modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
							>
								<SortableContext items={sectionOptions.filter(s => !I.FIXED_WIDGET_SECTIONS.includes(s.id)).map(s => String(s.id))} strategy={verticalListSortingStrategy}>
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
