import * as React from 'react';
import { DragLayer } from 'react-dnd';
import { flow, throttle } from 'lodash';

let getStyles = (props: any) => {
	const { initialOffset, currentOffset, mouseOffset } = props;

	if (!initialOffset || !currentOffset) {
		return { display: 'none' };
	};

	const { x, y } = mouseOffset;
	const transform = `translate3d(${x}px, ${y}px, 0px)`;
	const width = '100px';
	const height = '100px';
	const border = '1px solid red';

	return { transform, width, height, border };
};

interface Props {
	isDragging: boolean;
	item: any;
	itemType: any;
};

class CustomDragLayer extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { item, itemType, isDragging } = this.props;

		if (!isDragging) {
			return null;
		};
		
		return <div className="dragLayer" style={getStyles(this.props)} />;
	};
	
};
	
const collect = (monitor: any) => {
	return {
		item: monitor.getItem(),
		itemType: monitor.getItemType(),
		initialOffset: monitor.getInitialSourceClientOffset(),
		currentOffset: monitor.getSourceClientOffset(),
		isDragging: monitor.isDragging(),
		mouseOffset: monitor.getClientOffset()
	};
};

export default flow([ DragLayer(collect) ])(CustomDragLayer);