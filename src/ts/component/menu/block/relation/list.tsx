import * as React from 'react';
import { I, DataUtil, Util } from 'ts/lib';
import { Icon, Cell } from 'ts/component';
import { blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuBlockRelationList extends React.Component<Props, {}> {

	constructor(props: any) {
		super(props);

	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const block = blockStore.getLeaf(rootId, rootId);
		const details = blockStore.getDetails(rootId, rootId);
		const filter = new RegExp(Util.filterFix(data.filter), 'gi');

		let relations = dbStore.getRelations(rootId).filter((it: I.Relation) => { return !it.isHidden; });
		if (filter) {
			relations = relations.filter((it: I.Relation) => { return it.name.match(filter); });
		};

		const Item = (item: any) => {
			const relation = item.relation;
			return (
				<div className="item sides" onClick={(e: any) => { this.onSelect(e, relation); }}>
					<div className="info">
						<Icon className={'relation c-' + DataUtil.relationClass(relation.format)} />
						{relation.name}
					</div>
					<div className={[ 'cell', 'c-' + DataUtil.relationClass(relation.format) ].join(' ')}>
						<Cell 
							id="0"
							rootId={rootId}
							block={block}
							relation={relation}
							getRecord={() => { return details; }}
							viewType={I.ViewType.Grid}
							readOnly={true}
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

};

export default MenuBlockRelationList;