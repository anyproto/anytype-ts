import * as React from 'react';
import { DragLayer } from 'react-dnd';
import { flow, throttle } from 'lodash';
import WithThrottle from 'react-with-throttle';
import { Block } from 'ts/component';
import { I, Util } from 'ts/lib';

let getStyles = (props: any) => {
	const { item, itemType, initialOffset, currentOffset, mouseOffset } = props;

	if (!initialOffset || !currentOffset) {
		return { display: 'none' };
	};

	let { x, y } = mouseOffset;
	let width = item.bounds.width;
	
	switch (itemType) {
		case I.DragItem.Block:
			x += 42;
			width -= 50;
			break;
	};
	
	return {
		transform: `translate3d(${x}px, ${y}px, 0px)`,
		width: `${width}px`
	};
};

interface Props {
	isDragging: boolean;
	item: any;
	itemType: any;
};

class CustomDragLayer extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.renderContent = this.renderContent.bind(this);
	};
	
	renderContent (props: any) {
		const { item, itemType } = props;
		
		let n = 0;
		let content = null;
		switch (itemType) {
			case I.DragItem.Block:
				content = (
					<div className="blocks">
						{item.list.map((item: any, i: number) => {
							n = Util.incrementBlockNumber(item, n);
							return <Block key={item.header.id} {...item} number={n} index={i} />
						})}
					</div>
				);
				break;
		};
		
		return (
			<div className="dragLayer" style={getStyles(props)}>
				{content}
			</div>
		);
	};
	
	render () {
		const { isDragging } = this.props;

		if (!isDragging) {
			return null;
		};
		
		return (
			<WithThrottle value={this.props} wait={30}>
				{this.renderContent}
			</WithThrottle>
		);
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