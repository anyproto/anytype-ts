import * as React from 'react';
import { I, C, DataUtil, Util } from 'ts/lib';
import { Icon, Cell } from 'ts/component';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuBlockRelationList extends React.Component<Props, {}> {

	cellRefs: Map<string, any> = new Map();

	constructor (props: any) {
		super(props);

		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, readOnly } = data;
		const block = blockStore.getLeaf(rootId, rootId);
		const details = blockStore.getDetails(rootId, rootId);
		const filter = new RegExp(Util.filterFix(data.filter), 'gi');
		const idPrefix = 'menuBlockRelationListCell';

		let relations = dbStore.getRelations(rootId, rootId).filter((it: I.Relation) => { return !it.isHidden; });
		if (filter) {
			relations = relations.filter((it: I.Relation) => { return it.name.match(filter); });
		};

		const Item = (item: any) => {
			const relation = item.relation;
			const id = DataUtil.cellId(idPrefix, relation.relationKey, '0');
			return (
				<div className="item sides" onClick={(e: any) => { this.onSelect(e, relation); }}>
					<div className="info">
						<Icon className={'relation c-' + DataUtil.relationClass(relation.format)} />
						{relation.name}
					</div>
					<div
						id={id} 
						className={[ 'cell', 'c-' + DataUtil.relationClass(relation.format), 'canEdit' ].join(' ')} 
						onClick={(e: any) => { this.onCellClick(e, relation.relationKey, 0); }}
					>
						<Cell 
							ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
							rootId={rootId}
							storeId={rootId}
							block={block}
							relationKey={relation.relationKey}
							getRecord={() => { return details; }}
							viewType={I.ViewType.Grid}
							index={0}
							idPrefix={idPrefix}
							menuClassName="fromBlock"
							onCellChange={this.onCellChange}
							readOnly={readOnly}
						/>
					</div>
				</div>
			);
		};

		return (
			<div>
				{relations.map((item: any, i: number) => (
					<Item key={i} relation={item} />
				))}
			</div>
		);
	};

	componentDidUpdate () {
		this.props.position();
	};

	onSelect (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;

		if (onSelect) {
			close();
			onSelect(item);
		};
	};

	onCellClick (e: any, relationKey: string, index: number) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, readOnly } = data;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		if (!relation || readOnly || relation.isReadOnly) {
			return;
		};

		const id = DataUtil.cellId('menuBlockRelationListCell', relationKey, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, key: string, value: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		C.BlockSetDetails(rootId, [ 
			{ key: key, value: value },
		]);
	};

};

export default MenuBlockRelationList;