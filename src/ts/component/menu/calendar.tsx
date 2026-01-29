import React, { forwardRef, useRef } from 'react';
import { I, S, U, translate } from 'Lib';
import { CalendarSelect } from 'Component';
import { CalendarSelectRefProps, CalendarDay } from 'Component/util/menu/calendarSelect';
import { observer } from 'mobx-react';

const MenuCalendar = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, position, getId, close } = props;
	const { data, className, classNameWrap } = param;
	const { value, isEmpty, relationKey, canEdit, canClear = true, noKeyboard, getDotMap, onChange } = data;
	const calendarRef = useRef<CalendarSelectRefProps>(null);

	const onDayClick = (item: CalendarDay, ts: number): boolean => {
		if (canEdit) {
			S.Menu.updateData(props.id, { value: ts });
			onChange?.(ts);
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

		S.Menu.updateData(props.id, { value: ts });
		onChange?.(ts);
		close();
	};

	const onDayContextMenu = (e: React.MouseEvent, item: CalendarDay): void => {
		e.preventDefault();

		S.Menu.open('select', {
			element: `#${getId()} #${[ 'day', item.d, item.m, item.y ].join('-')}`,
			offsetY: 4,
			noFlipY: true,
			className,
			classNameWrap,
			data: {
				options: [
					{ id: 'open', icon: 'expand', name: translate('commonOpenObject') },
				],
				onSelect: () => {
					U.Object.openDateByTimestamp(relationKey, U.Date.timestamp(item.y, item.m, item.d));
				},
			}
		});
	};

	return (
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
	);

}));

export default MenuCalendar;
