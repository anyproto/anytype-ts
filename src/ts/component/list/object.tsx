import * as React from 'react';
import { observer } from 'mobx-react';
import { I, DataUtil, Util, ObjectUtil } from 'Lib';
import { IconObject, Pager, ObjectName } from 'Component';
import { detailStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
	rootId: string;
};

const LIMIT = 50;

const ListObject = observer(class ListObject extends React.Component<Props, object> {

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
					limit={LIMIT} 
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
						<div className="cellContent isName cp" onClick={(e: any) => { ObjectUtil.openEvent(e, item); }}>
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
								<div className="cellContent cp" onClick={(e: any) => { ObjectUtil.openEvent(e, author); }}>
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
		this.getData(1);
	};

	getItems () {
		const subId = this.getSubId();
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, this.getKeys()));
	};

	getSubId () {
		return dbStore.getSubId(this.props.rootId, 'data');
	};

	getKeys () {
		return Constant.defaultRelationKeys.concat([ 'creator', 'lastModifiedDate', 'createdDate' ]);
	};

	getData (page: number, callBack?: (message: any) => void) {
		const { rootId } = this.props;
		const offset = (page - 1) * LIMIT;
		const subId = this.getSubId();

		dbStore.metaSet(subId, '', { offset: offset });

		DataUtil.searchSubscribe({
			subId,
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc }
			],
			keys: this.getKeys(),
			sources: [ rootId ],
			offset,
			limit: LIMIT,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, callBack);
	};

});

export default ListObject;