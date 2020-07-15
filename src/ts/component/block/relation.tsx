import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

interface Props {
	rootId: string;
	block: I.Block;
};

const Schema = {
	page: require('json/schema/page.json'),
	relation: require('json/schema/relation.json'),
};

@observer
class BlockRelation extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render (): any {
		const { rootId } = this.props;
		const schema = Schema.page;
		const details = blockStore.getDetails(rootId, rootId);

		const Item = (item: any) => (
			<tr>
				<td>{item.name}</td>
				<td>{details[item.id]}</td>
			</tr>
		);

		return (
			<table>
				<tbody>
				{schema.default.map((item: any, i: number) => (
					<Item key={i} {...item} />
				))}
				</tbody>
			</table>
		);
	};

};

export default BlockRelation;