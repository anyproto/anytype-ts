import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

@observer
class ViewList extends React.Component<Props, {}> {

	render () {
		const { data, view, readOnly} = this.props;
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		
		const Row = (item: any) => (
			<div className="item">
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={'list-cell-' + relation.id} 
						id={item.index} 
						view={view} 
						relation={...relation} 
						data={data[item.index]} 
						readOnly={readOnly}
					/>
				))}
			</div>
		);
		
		return (
			<div className="wrap">
				<div className="viewItem viewList">
					{data.map((item: any, i: number) => (
						<Row key={'list-row-' + i} index={i} {...item} />
					))}
				</div>
			</div>
		);
	};

};

export default ViewList;