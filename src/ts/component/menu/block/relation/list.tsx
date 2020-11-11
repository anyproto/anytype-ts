import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
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
		const relations = dbStore.getRelations(rootId).filter((it: any) => { return !it.isHidden; });
		const details = blockStore.getDetails(rootId, rootId);

		const Item = (item: any) => (
			<div className="item">
				<div className="side left">
					<Icon className={'relation c-' + DataUtil.relationClass(item.relation.format)} />
					{item.relation.name}
				</div>
				<div className="side right">
					<Cell 
						id="0"
						rootId={rootId}
						block={block}
						relation={item.relation}
						data={[ details ]}
						index={0}
						viewType={I.ViewType.Grid}
						readOnly={true}
					/>
				</div>
			</div>
		);

		return (
			<div>
				{relations.map((item: any, i: number) => (
					<Item key={i} relation={item} />
				))}
			</div>
		);
	};

};

export default MenuBlockRelationList;