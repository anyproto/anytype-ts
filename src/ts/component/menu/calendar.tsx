import React, { forwardRef, useRef, MouseEvent } from 'react';
import { CalendarSelect, Icon } from 'Component';
import { CalendarSelectRefProps, CalendarDay } from 'Component/util/menu/calendarSelect';
import { observer } from 'mobx-react';
import * as I from 'Interface';

const MenuCalendar = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, position, getId, close } = props;
	const { data, className, classNameWrap } = param;
	const { value, isEmpty, relationKey, canEdit, canClear = true, noKeyboard, getDotMap, isTemplate, hasPlaceholder, rootId, onChange } = data;
	const calendarRef = useRef<CalendarSelectRefProps>(null);

	const onDayClick = (item: CalendarDay, ts: number): boolean => {
		if (canEdit) {
			if (isTemplate) {
				C.TemplateSetPlaceholders(rootId, [{ relationKey, values: [{ type: I.PlaceholderType.Value, value: ts }] }]);
			} else {
				onChange?.(ts);
			};

			S.Menu.updateData(props.id, { value: ts, hasPlaceholder: false });
			close();
		} else {
			U.Object.openDateByTimestamp(relationKey, ts);
		};
		return false;
	};

	const handleChange = (ts: number | null): void => {
		if (!canEdit) {
			return;
		};

		if (isTemplate) {
			if (ts === null) {
				C.TemplateDeletePlaceholders(rootId, [ relationKey ]);
			} else {
				C.TemplateSetPlaceholders(rootId, [{ relationKey, values: [{ type: I.PlaceholderType.Value, value: ts }] }]);
			};
		} else {
			onChange?.(ts);
		};

		S.Menu.updateData(props.id, { value: ts, hasPlaceholder: false });
		close();
	};

	const onDayContextMenu = (e: MouseEvent, item: CalendarDay): void => {
		e.preventDefault();

		S.Menu.open('select', {
			element: `#${getId()} #${[ 'day', item.d, item.m, item.y ].join('-')}`,
			offsetY: 4,
			noFlipY: true,
			className,
			classNameWrap,
			data: {
				options: [
					{ id: 'open', iconParam: { name: 'common/expand' }, name: translate('commonOpenObject') },
				],
				onSelect: () => {
					U.Object.openDateByTimestamp(relationKey, U.Date.timestamp(item.y, item.m, item.d));
				},
			}
		});
	};

	const onPlaceholderToday = () => {
		C.TemplateSetPlaceholders(rootId, [{ relationKey, values: [{ type: I.PlaceholderType.Today }] }]);
		close();
	};

	return (
		<>
			<CalendarSelect
				ref={calendarRef}
				value={value}
				onChange={handleChange}
				isReadonly={false}
				canClear={canClear}
				position={position}
				menuClassNameWrap={classNameWrap}
				isEmpty={isEmpty}
				enableKeyboard={!noKeyboard}
				enableHoverState={true}
				showFooter={canEdit}
				getDotMap={getDotMap}
				onDayClick={onDayClick}
				onDayContextMenu={onDayContextMenu}
			/>

			{isTemplate && canEdit ? (
				<div className="dynamicDates">
					<div className="sectionName">{translate('menuCalendarDynamicDates')}</div>
					<div
						className={[ 'item', (hasPlaceholder ? 'active' : '') ].join(' ')}
						onClick={onPlaceholderToday}
					>
						<Icon name="common/calendar" />
						<div className="name">{translate('placeholderToday')}</div>
					</div>
				</div>
			) : ''}
		</>
	);

}));

export default MenuCalendar;
