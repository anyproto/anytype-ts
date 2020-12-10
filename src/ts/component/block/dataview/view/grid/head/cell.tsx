import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { SortableElement } from 'react-sortable-hoc';
import { observer } from 'mobx-react';

import Handle from './handle';

interface Props extends I.ViewRelation {
	index: number;
	onResizeStart(e: any, key: string): void;
};

@observer
class HeadCell extends React.Component<Props, {}> {

	render () {
		const { relationKey, format, width, index, onResizeStart } = this.props;

		const Cell = SortableElement((item: any) => {
			return (
				<th id={DataUtil.cellId('head', relationKey, '')} className={'cellHead c-' + DataUtil.relationClass(format)} style={{ width: width }}>
					<div className="cellContent">
						<Handle {...this.props} />
						<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, relationKey); }}>
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