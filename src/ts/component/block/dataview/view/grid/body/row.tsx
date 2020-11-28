import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

import Cell from './cell';

interface Props extends I.ViewComponent {
	index: number;
	readOnly: boolean;
	onRowOver(index: number): void;
	onRef?(ref: any, id: string): void;
	onCellClick?(e: any, key: string, index: number): void;
};

@observer
class BodyRow extends React.Component<Props, {}> {

	render () {
		const { index, getView, onRowOver } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		return (
			<tr id={'row-' + index} onMouseOver={(e: any) => { onRowOver(index); }} className="row">
				{relations.map((relation: any, i: number) => (
					<Cell key={'grid-cell-' + view.id + relation.key} {...this.props} index={index} relation={relation} />
				))}
				<td className="cell last">&nbsp;</td>
			</tr>
		);
	};

};

export default BodyRow;