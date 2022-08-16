import * as React from 'react';
import { I, C, DataUtil, Util } from 'Lib';
import { IconObject, Pager, ObjectName } from 'Component';
import { detailStore, dbStore, blockStore } from 'Store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	blockId: string;
};

const Constant = require('json/constant.json');

const ListObject = observer(class ListObject extends React.Component<Props, {}> {

	public static defaultProps = {
	};
	
	render () {
		const { rootId } = this.props;
		const subId = this.getSubId();
		const items = this.getItems();
		const { offset, total } = dbStore.getMeta(subId, '');
		const isFileType = DataUtil.isFileType(rootId);

		let pager = null;
		if (total && items.length) {
			pager = (
				<Pager 
					offset={offset} 
					limit={Constant.limit.dataview.records} 
					total={total} 
					onChange={(page: number) => { this.getData(page); }} 
				/>
			);
		};

		const Row = (item: any) => {
			const author = detailStore.get(subId, item.creator, []);
			const cn = [ 'row' ];

			if ((item.layout == I.ObjectLayout.Task) && item.isDone) {
				cn.push('isDone');
			};
			if (item.isArchived) {
				cn.push('isArchived');
			};
			if (item.isDeleted) {
				cn.push('isDeleted');
			};
			if (item.isHidden) {
				cn.push('isHidden');
			};

			return (
				<tr className={cn.join(' ')}>
					<td className="cell">
						<div className="cellContent isName cp" onClick={(e: any) => { DataUtil.objectOpenEvent(e, item); }}>
							<div className="flex">
								<IconObject object={item} />
								<ObjectName object={item} />
							</div>
						</div>
					</td>
					<td className="cell">
						{item.lastModifiedDate ? (
							<div className="cellContent">
								{Util.date(DataUtil.dateFormat(I.DateFormat.MonthAbbrBeforeDay), item.lastModifiedDate)}
							</div>
						) : ''}
					</td>
					{!isFileType ? (
						<td className="cell">
							{!author._empty_ ? (
								<div className="cellContent cp" onClick={(e: any) => { DataUtil.objectOpenEvent(e, author); }}>
									<IconObject object={author} />
									<div className="name">{author.name}</div>
								</div>
							) : ''}
						</td>
					) : null}
				</tr>
			);
		};

		return (
			<React.Fragment>
				<table>
					<thead>
						<tr className="row">
							<th className="cellHead">
								<div className="name">Name</div>
							</th>
							<th className="cellHead">
								<div className="name">Updated</div>
							</th>
							{!isFileType ? (
								<th className="cellHead">
									<div className="name">Owner</div>
								</th>
							) : null}
						</tr>
					</thead>
					<tbody>
						{!items.length ? (
							<tr>
								<td className="cell empty" colSpan={3}>No objects yet</td>
							</tr>
						) : (
							<React.Fragment>
								{items.map((item: any, i: number) => (
									<Row key={i} {...item} />
								))}
							</React.Fragment>
						)}
					</tbody>
				</table>
				
				{pager}
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.getData(0);
	};

	getView () {
		const { rootId, blockId } = this.props;
		const views = dbStore.getViews(rootId, blockId);

		return views.length ? views[0] : null;		
	};

	getItems () {
		const subId = this.getSubId();
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, this.getKeys()));
	};

	getSubId () {
		const { rootId, blockId } = this.props;
		return dbStore.getSubId(rootId, blockId);
	};

	getKeys () {
		return Constant.defaultRelationKeys.concat([ 'creator', 'lastModifiedDate', 'createdDate' ]);
	};

	getData (page: number, callBack?: (message: any) => void) {
		const view = this.getView();
		if (!view) {
			return;
		};

		const { rootId, blockId } = this.props;
		const limit = Constant.limit.dataview.records;
		const offset = (page - 1) * limit;
		const block = blockStore.getLeaf(rootId, blockId);
		const subId = this.getSubId();
		const filters = view.filters.concat([
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
		]);

		dbStore.metaSet(subId, '', { offset: offset });
		C.ObjectSearchSubscribe(subId, filters, view.sorts, this.getKeys(), block.content.sources, offset, limit, true, '', '', false, callBack);
	};

});

export default ListObject;