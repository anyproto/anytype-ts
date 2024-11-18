import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';
import Cell from './cell';

interface Props extends I.ViewComponent {
	getColumnWidths?: (relationId: string, width: number) => any;
};

const FootRow = observer(class FootRow extends React.Component<Props> {

	render () {
		const { getVisibleRelations, getColumnWidths } = this.props;
		const widths = getColumnWidths('', 0);
		const relations = getVisibleRelations();
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');

		return (
			<div 
				id="rowFoot"
				className="rowFoot"
				style={{ gridTemplateColumns: str }}
			>
				{relations.map((relation: any, i: number) => (
					<Cell
						{...this.props}
						key={`grid-foot-${relation.relationKey}`}
						relationKey={relation.relationKey}
					/>
				))}
				<div className="cellFoot last" />
			</div>
		);
	};

});

export default FootRow;