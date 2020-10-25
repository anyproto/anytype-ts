import * as React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	column: number;
	index: number;
	idx: number;
	data: any;
};

const getItemStyle = (snapshot: any, style: any) => {
	if (snapshot.isDragging) {
		style.background = '#f3f2ef';
	};
	return style;
};

@observer
class Card extends React.Component<Props, {}> {

	render () {
		const { rootId, block, view, readOnly, column, idx, index, data } = this.props;
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		return (
			<Draggable draggableId={[ column, index ].join(' ')} index={idx} type="row">
				{(provided: any, snapshot: any) => (
					<div 
						className="card"
						ref={provided.innerRef}
						{...provided.draggableProps}
						{...provided.dragHandleProps}
						style={getItemStyle(snapshot, provided.draggableProps.style)}
					>
						{relations.map((relation: any, i: number) => (
							<Cell 
								key={'board-cell-' + relation.key} 
								id={String(index)} 
								rootId={rootId}
								block={block}
								view={view} 
								relation={...relation} 
								data={data}
								index={index}
								readOnly={readOnly} 
							/>
						))}
					</div>
				)}
			</Draggable>
		);
	};

};

export default Card;