import * as React from 'react';
import { Icon } from 'ts/component';
import { I, translate } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';

import Card from './card';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	values: any[];
	onAdd (column: number): void;
	onDragStartColumn?: (e: any, groupId: any) => void;
	onDragStartCard?: (e: any, groupId: any, record: any) => void;
};

const Column = observer(class Column extends React.Component<Props, {}> {

	render () {
		const { rootId, block, id, getView, onAdd, values, onDragStartColumn } = this.props;
		const view = getView();
		const subId = dbStore.getSubId(rootId, [ block.id, id ].join(':'));
		const records = dbStore.getRecords(subId, '');
		const { offset, total } = dbStore.getMeta(subId, '');

		const Add = (item: any) => (
			<div 
				className="card add"
				onClick={() => { onAdd(item.column); }}
			>
				<Icon className="plus" />
			</div>
		);

		const Head = (item: any) => {
			const head = {};
			head[view.groupRelationKey] = values;

			return (
				<div 
					className="head" 
					draggable={true}
					onDragStart={(e: any) => { onDragStartColumn(e, id); }}
				>
					<Cell 
						id={'board-head-' + item.index} 
						rootId={rootId}
						subId={subId}
						block={block}
						relationKey={id} 
						viewType={I.ViewType.Board}
						getRecord={() => { return head; }}
						readonly={true} 
						placeholder={translate('placeholderCellCommon')}
					/>
				</div>
			);
		};

		return (
			<div 
				id={'column-' + id} 
				className="column" 
				data-id={id}
			>
				<div className="ghost left" />
				<div className="body">
					<Head index={id} />
					<div className="list">
						{records.map((record: any, i: number) => (
							<Card key={'board-card-' +  view.id + i} {...this.props} id={record.id} groupId={id} />
						))}
						<Add column={id} />
					</div>
				</div>
				<div className="ghost right" />
			</div>
		);
	};

});

export default Column;