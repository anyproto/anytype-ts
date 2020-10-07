import * as React from 'react';
import { Icon } from 'ts/component';
import { I, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

interface Props {
	rootId: string;
	block: I.Block;
};

@observer
class BlockRelation extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render (): any {
		const { rootId } = this.props;
		const relations = [];
		const details = blockStore.getDetails(rootId, rootId);

		const Item = (item: any) => {
			let type = DataUtil.schemaField(item.type);
			let value: any = details[item.id];

			switch (type) {
				case I.RelationType.Date:
					value = Util.date('d F Y', value);
					break;
			};

			return (
				<tr className="row">
					<td className="cell name">
						<Icon className={'relation c-' + type} />
						<div className="txt">{item.name}</div>
					</td>
					<td className="cell value">{value}</td>
				</tr>
			);
		};

		return (
			<table className="table">
				<tbody>
				{relations.map((item: any, i: number) => (
					<Item key={i} {...item} />
				))}
				</tbody>
			</table>
		);
	};

};

export default BlockRelation;