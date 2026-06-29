import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Button, Icon, Widget, Label, SpaceName } from 'Component';
import { I, M, S, U, J, keyboard, analytics, translate, sidebar, Action } from 'Lib';

interface SectionItemProps {
	section: any;
	isFixed: boolean;
	isHidden: boolean;
	onToggle: (e: React.MouseEvent, sectionId: I.WidgetSection) => void;
};

const SectionItem = ({ section, isFixed, isHidden, onToggle }: SectionItemProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: String(section.id),
	});
	const style = { transform: CSS.Transform.toString(transform), transition };
	const cn = [ 'manageItem', 'isSection' ];

	if (isDragging) {
		cn.push('isDragging');
	};
	if (isFixed) {
		cn.push('isFixed');
	};

	return (
		<div
			ref={setNodeRef}
			className={cn.join(' ')}
			style={style}
			{...attributes}
			{...listeners}
		>
			<Icon className="dnd" name="common/dnd" />
			<Label text={section.name} />
			{!isFixed ? (
				<Icon
					className="action"
					name={isHidden ? 'common/eye0' : 'common/eye1'}
					onClick={e => onToggle(e, section.id)}
					tooltipParam={{ text: translate(isHidden ? 'widgetShowSection' : 'widgetHideSection'), typeY: I.MenuDirection.Bottom }}
				/>
			) : ''}
		</div>
	);
};

const SidebarPageWidgetManage = forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { sidebarDirection, getId } = props;
	const { widgetSections, sidebarView } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const bodyRef = useRef<HTMLDivElement>(null);
	const [ , setDummy ] = useState(0);
	const forceUpdate = () => setDummy(v => v + 1);
	const isLinksView = sidebarView == I.SidebarView.Links;
	const cnb = [ 'body' ];
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	if (isLinksView) {
		cnb.push('isLinksView');
	};

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

		const oldIndex = widgetSections.findIndex(it => String(it.id) == String(active.id));
		const newIndex = widgetSections.findIndex(it => String(it.id) == String(over.id));

		if ((oldIndex < 0) || (newIndex < 0)) {
			return;
		};

		S.Common.widgetSectionsSet(arrayMove(widgetSections, oldIndex, newIndex));
		analytics.event('ReorderSection', { type: active.id });
		forceUpdate();
	};

	const onScroll = () => {
		const top = bodyRef.current?.scrollTop ?? 0;

		U.Dom.toggleClass(U.Dom.get(getId()), 'isScrolled', top > 0);
	};

	const spaceBlock = new M.Block({
		id: J.Constant.widgetId.space,
		type: I.BlockType.Widget,
		content: { layout: I.WidgetLayout.Space },
	});

	const sectionOptions = U.Menu.widgetSections();
	const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
	const canModerate = U.Space.canMyParticipantModerate();
	const hasMembers = members.length > 1;
	const showMembers = !spaceview.isOneToOne && !spaceview.isPersonal && (hasMembers || canModerate);

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
				{showMembers ? (
					<Icon
						id="button-widget-members"
						name="widget/member"
						withBackground={true}
						inner={<Label className="cnt" text={String(members.length)} />}
						onClick={() => Action.openSpaceShare(analytics.route.widget)}
						tooltipParam={{ text: translate('commonMembers'), typeY: I.MenuDirection.Bottom }}
					/>
				) : ''}
			</div>
		</>
	);

	return (
		<>
			<div id="head" className="head isManage">
				{head}
			</div>

			<div id="body" ref={bodyRef} className={cnb.join(' ')} onScroll={onScroll}>
				<div className="content">
					<Widget
						block={spaceBlock}
						disableContextMenu={true}
						canEdit={false}
						canRemove={false}
						sidebarDirection={sidebarDirection}
						getObject={id => id ? spaceview : null}
					/>

					<SpaceName />

					<div className="manageSection">
						<div className="items">
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={onSectionDragEnd}
								modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
							>
								<SortableContext items={sectionOptions.map(s => String(s.id))} strategy={verticalListSortingStrategy}>
									{sectionOptions.map(section => {
										const isFixed = I.FIXED_WIDGET_SECTIONS.includes(section.id);
										const cfg = widgetSections.find(it => it.id == section.id);
										const isHidden = !!cfg?.isHidden;

										return (
											<SectionItem
												key={section.id}
												section={section}
												isFixed={isFixed}
												isHidden={isHidden}
												onToggle={onToggleSection}
											/>
										);
									})}
								</SortableContext>
							</DndContext>
						</div>
					</div>

					<div className="buttons">
						<Button text={translate('commonDone')} color="accent" size={36} onClick={onDone} />
					</div>
				</div>
			</div>
		</>
	);

});

export default SidebarPageWidgetManage;