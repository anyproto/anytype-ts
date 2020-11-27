import * as React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	columnId: number;
	index: number;
	idx: number;
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
		const { columnId, idx, index, getView } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		return (
			<Draggable draggableId={[ columnId, index ].join(' ')} index={idx} type="row">
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
								{...this.props}
								index={index}
								viewType={I.ViewType.Board}
								relation={...relation} 
							/>
						))}
					</div>
				)}
			</Draggable>
		);
	};

};

export default Card;