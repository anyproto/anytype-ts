import * as React from 'react';
import { I, S, U, J, translate, keyboard } from 'Lib';
import { Select } from 'Component';
import { observer } from 'mobx-react';
import { eachDayOfInterval, isEqual, format, fromUnixTime } from 'date-fns';

interface State {
	dotMap: Map<string, boolean>;
	selectedItemIndex: number;
};

enum ArrowDirection {
	Up = 'arrowup',
	Down = 'arrowdown',
	Left = 'arrowleft',
	Right = 'arrowright',
}

const MenuCalendar = observer(class MenuCalendar extends React.Component<I.Menu, State> {
	
	originalValue = 0;
	monthOffset = 0;
	firstDayIndex = 0;
	lastDayIndex = 0;
	refInner: any = null;
	refMonth: any = null;
	refYear: any = null;

	state: Readonly<State> = {
		dotMap: new Map(),
		selectedItemIndex: 0,
	};
	
	render () {
		const { param } = this.props;
		const { data, classNameWrap } = param;
		const { value, isEmpty, canEdit, canClear = true } = data;
		const { dotMap, selectedItemIndex } = this.state;
		const items = this.getData();
		const { m, y } = U.Date.getCalendarDateParam(value);
		const todayParam = U.Date.getCalendarDateParam(this.originalValue);
		const now = U.Date.now();
		const tomorrow = now + 86400;
		const dayToday = U.Date.today();
		const days = [];
		const months = [];
		const years = [];

		for (let i = 1; i <= 7; ++i) {
			days.push({ id: i, name: translate('day' + i) });
		};

		for (let i = 1; i <= 12; ++i) {
			months.push({ id: i, name: translate('month' + i) });
		};

		for (let i = 0; i <= 3000; ++i) {
			years.push({ id: i, name: i });
		};

		return (
			<div className="inner" ref={ref => this.refInner = ref}>
				<div className="head">
					<div className="sides">
						<div className="side left">
							<Select 
								ref={ref => this.refMonth = ref}
								id="month"
								value={String(m || '')} 
								options={months} 
								onChange={m => this.setValue(U.Date.timestamp(y, m, 1), false, false)} 
								menuParam={{ 
									classNameWrap, 
									width: 124,
								}}
							/>

							<Select
								ref={ref => this.refYear = ref}
								id="year"
								value={String(y || '')}
								options={years}
								onChange={y => this.setValue(U.Date.timestamp(y, m, 1), false, false)}
								menuParam={{
									classNameWrap,
									width: 82,
								}}
							/>
						</div>
						<div className="side right">
							<div className="btn prevMonth" onClick={() => this.setValue(this.stepMonth(value, -1), false, false)} />
							<div className="btn nextMonth" onClick={() => this.setValue(this.stepMonth(value, 1), false, false)} />
						</div>
					</div>

					<div className="days">
						{days.map((item, i) => (
							<div key={i} className="day th">
								{item.name.substring(0, 2)}
							</div>
						))}
					</div>
				</div>
				<div className="body">
					{items.map((item, i) => {
						const cn = [ 'day' ];
						if (m != item.m) {
							cn.push('other');
						};
						if (dayToday == U.Date.timestamp(item.y, item.m, item.d)) {
							cn.push('today');
						};
						if (!isEmpty && (todayParam.d == item.d) && (todayParam.m == item.m) && (todayParam.y == item.y)) {
							cn.push('active');
						};

						if (selectedItemIndex == i) {
							cn.push('selected');
						};

						const check = dotMap.get([ item.d, item.m, item.y ].join('-'));
						return (
							<div 
								key={i}
								id={[ 'day', item.d, item.m, item.y ].join('-')}
								className={cn.join(' ')} 
								onClick={e => this.onClick(e, item)}
								onContextMenu={e => this.onContextMenu(e, item)}
							>
								<div className="inner">
									{item.d}
									{check ? <div className="bullet" /> : ''}
								</div>
							</div>
						);
					})}
				</div>
				{canEdit ? (
					<React.Fragment>
						<div className="line" />
						<div className="foot">
							<div className="sides">
								<div className="side left">
									<div className="btn" onClick={() => this.setValue(U.Date.mergeTimeWithDate(now, value), true, true)}>{translate('commonToday')}</div>
									<div className="btn" onClick={() => this.setValue(U.Date.mergeTimeWithDate(tomorrow, value), true, true)}>{translate('commonTomorrow')}</div>
								</div>
								<div className="side right">
									{canClear && <div className="btn clear" onClick={() => this.setValue(null, true, true)}>{translate('commonClear')}</div>}
								</div>
							</div>
						</div>
					</React.Fragment>
				) : ''}
			</div>
		);
	};

	componentDidMount(): void {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;

		this.refInner.focus();

		const items = this.getData();
		
		this.originalValue = value;

		const todayParam = U.Date.getCalendarDateParam(this.stepMonths(this.originalValue, this.monthOffset));
		
		this.firstDayIndex = items.findIndex(item => item.m == todayParam.m);
		this.lastDayIndex = items.findLastIndex(item => item.m == todayParam.m);
		
		const todayIndex = items.findIndex(item => item.d == todayParam.d && item.m == todayParam.m && item.y == todayParam.y);
		this.setState({
			selectedItemIndex: todayIndex,
		});

		this.initDotMap();
		this.rebind();
		this.forceUpdate();
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown = (e: any) => {

		e.stopPropagation();
		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			e.preventDefault();

			this.onArrow(pressed as ArrowDirection);
		});

		const { selectedItemIndex } = this.state;

		if (!selectedItemIndex) {
			return;
		};

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			const items = this.getData();
			this.setOrOpenDate(items[selectedItemIndex]);
		});
	};

	onArrow = (dir: ArrowDirection) => {
		const { selectedItemIndex } = this.state;
		let newItemIndex = selectedItemIndex;
		switch (dir) {
			case ArrowDirection.Up:
				newItemIndex -= 7;
				break;
			case ArrowDirection.Down:
				newItemIndex += 7;
				break;
			case ArrowDirection.Left:
				newItemIndex -= 1;
				break;
			case ArrowDirection.Right:
				newItemIndex += 1;
				break;
		}
		const month = this.stepMonths(this.originalValue, this.monthOffset);

		if (newItemIndex < this.firstDayIndex || newItemIndex > this.lastDayIndex) {
			let newIndexOffset = 0;
			switch(dir) {
				case ArrowDirection.Up:
					newIndexOffset = this.firstDayIndex - newItemIndex - 1;
					this.monthOffset -= 1;
					break;
				case ArrowDirection.Down:
					newIndexOffset = newItemIndex - this.lastDayIndex - 1;
					this.monthOffset += 1;
					break;
				case ArrowDirection.Left:
					newIndexOffset = this.firstDayIndex - newItemIndex - 1;
					this.monthOffset -= 1;
					break;
				case ArrowDirection.Right:
					newIndexOffset = newItemIndex - this.lastDayIndex - 1;
					this.monthOffset += 1;
					break;
			};

			const newMonth = this.stepMonths(this.originalValue, this.monthOffset);
			const items = U.Date.getCalendarMonth(newMonth);
			const todayParam = U.Date.getCalendarDateParam(newMonth);
			this.firstDayIndex = items.findIndex(item => item.m == todayParam.m);
			this.lastDayIndex = items.findLastIndex(item => item.m == todayParam.m);
			this.setValue(newMonth, false, false);
			
			switch(dir) {
				case ArrowDirection.Up:
					newItemIndex = this.lastDayIndex - newIndexOffset;
					break;
				case ArrowDirection.Left:
					newItemIndex = this.lastDayIndex - newIndexOffset;
					break;
				case ArrowDirection.Down:
					newItemIndex = this.firstDayIndex + newIndexOffset;
					break;
				case ArrowDirection.Right:
					newItemIndex = this.firstDayIndex + newIndexOffset;
					break;
			};
		};

		this.setState({
			selectedItemIndex: newItemIndex,
		});
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const { m, y } = U.Date.getCalendarDateParam(value);

		this.refMonth.setValue(m);
		this.refYear.setValue(y);

		this.props.position();
	};

	initDotMap () {
		const { param } = this.props;
		const { data } = param;
		const { getDotMap } = data;
		const items = this.getData();

		if (!getDotMap || !items.length) {
			return;
		};

		const first = items[0];
		const last = items[items.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d);
		const end = U.Date.timestamp(last.y, last.m, last.d);

		getDotMap(start, end, dotMap => this.setState({ dotMap }));
	};

	onClick = (e: any, item: any) => {
		e.stopPropagation();

		this.setOrOpenDate(item);
	};

	setOrOpenDate = (item: any) => {
		const { param } = this.props;
		const { data } = param;
		const { canEdit, relationKey } = data;

		if (canEdit) {
			this.setValue(U.Date.timestamp(item.y, item.m, item.d), true, true); 
		} else {
			U.Object.openDateByTimestamp(relationKey, U.Date.timestamp(item.y, item.m, item.d));
		};
	};

	onContextMenu (e: any, item: any) {
		e.preventDefault();

		const { getId, param } = this.props;
		const { className, classNameWrap, data } = param;
		const { relationKey } = data;

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
				}
			}
		});
	};

	setValue (value: number, save: boolean, close: boolean) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange, canEdit } = data;

		if (!canEdit) {
			return;
		};

		S.Menu.updateData(id, { value });

		if (save) {
			onChange(value);
		};

		if (close) {
			this.props.close();
		};
	};

	getData () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		
		return U.Date.getCalendarMonth(value);
	};

	stepMonths = (value: number, steps: number) => {
		if (steps == 0) {
			return value;
		};
		const d = steps > 0 ? 1 : -1;	
		let counter = steps;
		let ret = value;
		while (counter != 0) {
			ret = this.stepMonth(ret, d);
			counter -= d;
		}

		return ret;
	};

	stepMonth = (value: number, dir: number) => {
		const { m, y } = U.Date.getCalendarDateParam(value);

		let nY = y;
		let nM = m + dir;

		if (nM < 1) {
			nM = 12;
			nY -= 1;
		};
		if (nM > 12) {
			nM = 1;
			nY += 1;
		};

		return U.Date.timestamp(nY, nM, 1);
	};
	
});

export default MenuCalendar;
