import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { dbStore } from 'Store';
import { Icon, LoadMore } from 'Component';
import { I, translate, UtilCommon, UtilCalendar } from 'Lib';
import Row from './list/row';

const ViewCalendar = observer(class ViewCalendar extends React.Component<I.ViewComponent> {

	node: any = null;
	ref = null;

	constructor (props: I.ViewComponent) {
		super (props);
	};

	render () {
		const { rootId, block, className, isPopup, isInline, getView, onRecordAdd, getLimit, getEmpty, getRecords } = this.props;
		const cn = [ 'viewContent', className ];
		const data = this.getData();

		const value = UtilCommon.time();
		const d = Number(UtilCommon.date('j', value));
		const m = Number(UtilCommon.date('n', value));
		const y = Number(UtilCommon.date('Y', value));

		return (
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
				<div className={cn.join(' ')}>
					{data.map((item, i) => {
						const cn = [ 'day' ];
						if (m != item.m) {
							cn.push('other');
						};
						if ((d == item.d) && (m == item.m) && (y == item.y)) {
							cn.push('active');
						};
						return (
							<div key={i} className={cn.join(' ')}>
								<div className="number">{item.d}</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	getData () {
		return UtilCalendar.getData(UtilCommon.time());
	};

	loadData () {
	};

});

export default ViewCalendar;