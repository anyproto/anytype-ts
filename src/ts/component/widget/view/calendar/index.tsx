import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, Icon } from 'Component';
import { I, S, U, J } from 'Lib';

interface State {
	value: number;
};

const WidgetViewCalendar = observer(class WidgetViewCalendar extends React.Component<I.WidgetViewComponent, State> {

	node = null;
	refMonth = null;
	refYear = null;
	state = {
		value: U.Date.now(),
	};

	constructor (props: I.WidgetViewComponent) {
		super(props);

		this.onArrow = this.onArrow.bind(this);
	};

	render (): React.ReactNode {
		const { value } = this.state;
		const { block, getView } = this.props;
		const view = getView();

		if (!view) {
			return null;
		};

		const data = U.Date.getCalendarMonth(value);
		const { m, y } = this.getDateParam(value);
		const today = this.getDateParam(U.Date.now());
		const days = U.Date.getWeekDays();
		const months = U.Date.getMonths();
		const years = U.Date.getYears(0, 3000);
		const { groupRelationKey } = view;

		return (
			<div ref={ref => this.node = ref} className="body">
				<div id="dateSelect" className="dateSelect">
					<div className="side left">
						<Select 
							ref={ref => this.refMonth = ref}
							id={`widget-${block.id}-calendar-month`} 
							value={m} 
							options={months} 
							className="month" 
							onChange={m => this.setValue(U.Date.timestamp(y, m, 1))} 
						/>
						<Select 
							ref={ref => this.refYear = ref}
							id={`widget-${block.id}-calendar-year`} 
							value={y} 
							options={years} 
							className="year" 
							onChange={y => this.setValue(U.Date.timestamp(y, m, 1))} 
						/>
					</div>

					<div className="side right">
						<Icon className="arrow left" onClick={() => this.onArrow(-1)} />
						<Icon className="arrow right" onClick={() => this.onArrow(1)} />
					</div>
				</div>

				<div className="table">
					<div className="tableHead">
						{days.map((item, i) => (
							<div key={i} className="item">
								<div className="inner">{item.name.substring(0, 2)}</div>
							</div>
						))}
					</div>

					<div className="tableBody">
						{data.map((item, i) => {
							const cn = [ 'day' ];
							if (m != item.m) {
								cn.push('other');
							};
							if ((today.d == item.d) && (today.m == item.m) && (today.y == item.y)) {
								cn.push('today');
							};
							if (i < 7) {
								cn.push('first');
							};

							const check = this.checkItems(item.d, item.m, item.y, groupRelationKey);
							return (
								<div 
									id={`day-${item.d}-${item.m}-${item.y}`} 
									key={i}
									className={cn.join(' ')} 
									onClick={() => this.onClick(item.d, item.m, item.y)}
								>
									<div className="inner">
										{item.d}
										{check ? <div className="bullet" /> : ''}
									</div>
								</div>	
							);
						})}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		this.setSelectsValue(this.state.value);
	};

	setSelectsValue (value: number) {
		const { m, y } = this.getDateParam(value);

		this.refMonth?.setValue(m);
		this.refYear?.setValue(y);
	};

	getDateParam (t: number) {
		const [ d, m, y ] = U.Date.date('j,n,Y', t).split(',').map(it => Number(it));
		return { d, m, y };
	};

	onArrow (dir: number) {
		let { m, y } = this.getDateParam(this.state.value);

		m += dir;
		if (m < 0) {
			m = 12;
			y--;
		};
		if (m > 12) {
			m = 1;
			y++;
		};

		this.setValue(U.Date.timestamp(y, m, 1));
	};

	setValue (value: number) {
		this.state.value = value;
		this.setState({ value }, () => this.props.reload());
		this.setSelectsValue(value);
	};

	onClick (d: number, m: number, y: number) {
		const { rootId, getView, canCreate, onCreate } = this.props;
		const view = getView();
		const element = `#day-${d}-${m}-${y}`;

		S.Menu.closeAll([ 'dataviewCalendarDay' ], () => {
			S.Menu.open('dataviewCalendarDay', {
				element,
				className: 'fixed fromWidget',
				classNameWrap: 'fromSidebar',
				horizontal: I.MenuDirection.Center,
				noFlipX: true,
				onOpen: () => $(element).addClass('active'),
				onClose: () => $(element).removeClass('active'),
				data: {
					rootId,
					blockId: J.Constant.blockId.dataview,
					relationKey: view.groupRelationKey,
					d,
					m, 
					y,
					hideIcon: view.hideIcon,
					fromWidget: true,
					readonly: !canCreate,
					onCreate: () => {
						const details = {};
						details[view.groupRelationKey] = U.Date.timestamp(y, m, d, 12, 0, 0);

						onCreate({ details });
					}
				}
			});
		});
	};

	getFilters (): I.Filter[] {
		const { getView } = this.props;
		const view = getView();
		const relation = S.Record.getRelationByKey(view.groupRelationKey);

		if (!relation) {
			return [];
		};

		const data = U.Date.getCalendarMonth(this.state.value);
		if (!data.length) {
			return;
		};

		const first = data[0];
		const last = data[data.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d, 0, 0, 0);
		const end = U.Date.timestamp(last.y, last.m, last.d, 23, 59, 59);

		return [
			{ 
				operator: I.FilterOperator.And, 
				relationKey: relation.relationKey, 
				condition: I.FilterCondition.GreaterOrEqual, 
				value: start, 
				quickOption: I.FilterQuickOption.ExactDate,
				format: relation.format,
			},
			{ 
				operator: I.FilterOperator.And, 
				relationKey: relation.relationKey, 
				condition: I.FilterCondition.LessOrEqual, 
				value: end, 
				quickOption: I.FilterQuickOption.ExactDate,
				format: relation.format,
			}
		];
	};

	checkItems (d: number, m: number, y: number, relationKey: string) {
		const { rootId } = this.props;
		const items = S.Record.getRecords(S.Record.getSubId(rootId, J.Constant.blockId.dataview), [ relationKey ]);
		const current = [ d, m, y ].join('-');

		return !!items.find(it => U.Date.date('j-n-Y', it[relationKey]) == current);
	};


});

export default WidgetViewCalendar;