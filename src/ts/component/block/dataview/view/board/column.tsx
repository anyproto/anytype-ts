import * as React from 'react';
import { Icon, Loader } from 'ts/component';
import { I, C, Util, translate, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore } from 'ts/store';

import Card from './card';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	onAdd (groupId: string): void;
	onDragStartColumn?: (e: any, groupId: string) => void;
	onScrollColumn?: () => void;
	onDragStartCard?: (e: any, groupId: string, record: any) => void;
	getSubId?: () => string;
};

interface State {
	loading: boolean;
};

const Column = observer(class Column extends React.Component<Props, State> {

	cache: any = {};
	width: number = 0;
	columnWidth: number = 0;
	columnCount: number = 0;
	offset: number = 0;
	state = {
		loading: false,
	};

	constructor(props: Props) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
	};

	render () {
		const { rootId, block, id, getSubId, getView, onAdd, value, onDragStartColumn, isPopup } = this.props;
		const { loading } = this.state;
		const view = getView();
		const subId = getSubId();
		const records = dbStore.getRecords(subId, '');
		const items = this.getItems();
		const { offset, total } = dbStore.getMeta(subId, '');
		const head = {};

		head[view.groupRelationKey] = value;

		records.forEach((it: any) => {
			const object = detailStore.get(subId, it.id, [ view.groupRelationKey ]);
		});

		return (
			<div 
				id={'column-' + id} 
				className="column" 
				data-id={id}
			>
				<div 
					className="head" 
					draggable={true}
					onDragStart={(e: any) => { onDragStartColumn(e, id); }}
				>
					<Cell 
						id={'board-head-' + id} 
						rootId={rootId}
						subId={subId}
						block={block}
						relationKey={view.groupRelationKey} 
						viewType={I.ViewType.Board}
						getRecord={() => { return head; }}
						readonly={true} 
						placeholder={translate('placeholderCellCommon')}
					/>
				</div>

				<div className="body" onScroll={this.onScroll}>
					{loading ? <Loader / > : (
						<React.Fragment>
							{items.map((item: any, i: number) => {
								let content = null;
								let key = [ 'board', view.id, id, item.id ].join('-');

								if (item.isAdd) {
									content = (
										<div key={key}  id={`card-${id}-add`} className="card add" onClick={() => { onAdd(id); }}>
											<Icon className="plus" />
										</div>
									);
								} else {
									content = (
										<Card 
											key={key} 
											{...this.props} 
											id={item.id} 
											groupId={id}
											index={i}
										/>
									);
								};
								return content;
							})}
						</React.Fragment>
					)}
				</div>

			</div>
		);
	};

	componentDidMount () {
		this.load();
	};

	componentWillUnmount () {
		this.clear();
	};

	load () {
		const { rootId, block, getView, getKeys, getSubId, value, id } = this.props;
		const view = getView();
		const relation = dbStore.getRelation(rootId, block.id, view.groupRelationKey);
		const subId = getSubId();

		if (!relation) {
			return;
		};

		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
		];

		switch (relation.format) {
			default:
				filters.push({ operator: I.FilterOperator.And, relationKey: relation.relationKey, condition: I.FilterCondition.Equal, value: value });
				break;
		};

		this.setState({ loading: true });
		C.ObjectSearchSubscribe(subId, filters, view.sorts, getKeys(view.id), block.content.sources, 0, 100, true, '', '', false, () => {
			this.setState({ loading: false });
		});
	};

	clear () {
		const { getSubId } = this.props;
		dbStore.recordsClear(getSubId(), '');
	};

	getItems () {
		const { getSubId, id } = this.props;
		const subId = getSubId();
		const records = dbStore.getRecords(subId, '');
		const items = Util.objectCopy(records);

		return items.concat([
			{ id: `${id}-add`, isAdd: true }
		]);
	};

	onScroll (e: any) {
		if (keyboard.isDragging) {
			this.props.onScrollColumn();
		};
	};

});

export default Column;