import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { SortableElement } from 'react-sortable-hoc';
import { observer } from 'mobx-react';

import Handle from './handle';

interface Props {
	relation: I.ViewRelation;
	index: number;
	onResizeStart(e: any, key: string): void;
};

@observer
class HeadCell extends React.Component<Props, {}> {

	render () {
		const { relation, index, onResizeStart } = this.props;

		const Cell = SortableElement((item: any) => {
			const id = DataUtil.cellId('head', relation.key, '');

			return (
				<th id={id} className={'head c-' + DataUtil.relationClass(relation.format)} style={{ width: relation.width }}>
					<div className="cellContent">
						<Handle {...relation} />
						<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, relation.key); }}>
							<div className="line" />
						</div>
					</div>
				</th>
			);
		});

		return <Cell index={index} />;
	};

};

export default HeadCell;