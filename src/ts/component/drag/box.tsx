import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Util } from 'ts/lib';

interface Props {
	onDragEnd(oldIndex: number, newIndex: number): void;
};

class DragBox extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	cache: any = {};
	ox: number = 0;
	oy: number = 0;
	oldIndex: number = -1;
	newIndex: number = -1;
	
	constructor (props: any) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
	};
	
	render () {
		const children = React.Children.map(this.props.children, (child: any) => {
			return React.cloneElement(child, { onDragStart: this.onDragStart });
		});

		return (
			<span className="dragbox">
				{children}
			</span>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	onDragStart (e: any) {
		e.preventDefault();
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.isDraggable');
		const element = $(e.currentTarget);
		const clone = element.clone();
		const offset = node.offset();

		items.each((i: number, el: any) => {
			el = $(el);
			if (el.hasClass('isClone')) {
				return;
			};

			const p = el.position();
			this.cache[el.data('id')] = {
				x: p.left,
				y: p.top,
				width: el.width(),
				height: el.height(),
			};
		});

		this.ox = offset.left;
		this.oy = offset.top;
		this.oldIndex = element.data('index');

		node.append(clone);
		clone.addClass('isClone');
		element.addClass('isDragging');

		win.off('mousemove.dragbox mouseup.dragbox');
		win.on('mousemove.dragbox', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.dragbox', (e: any) => { this.onDragEnd(e); });
	};

	onDragMove (e: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.isDraggable');
		const clone = node.find('.isDraggable.isClone');
		const width = clone.width();
		const height = clone.height();
		const x = e.pageX - this.ox - width / 2;
		const y = e.pageY - this.oy - height / 2;
		const center = x + width / 2;

		this.newIndex = -1;

		node.find('.isDraggable.isOver').removeClass('isOver');
		clone.css({ transform: `translate3d(${x}px,${y}px,0px)` });

		for (let i = 0; i < items.length; ++i) {
			const el = $(items.get(i));
			const rect = this.cache[el.data('id')];

			if (rect && Util.rectsCollide({ x: center, y, width: 2, height }, rect)) {
				const isLeft = center <= rect.x + rect.width / 2;
				this.newIndex = i + (!isLeft ? 1 : 0);
				el.addClass('isOver ' + (isLeft ? 'left' : 'right'));
				break;
			};
		};
	};

	onDragEnd (e: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const { onDragEnd } = this.props;

		if (this.newIndex >= 0) {
			onDragEnd(this.oldIndex, this.newIndex);
		};

		this.cache = {};
		this.oldIndex = -1;
		this.newIndex = -1;

		node.find('.isDraggable.isClone').remove();
		node.find('.isDraggable.isDragging').removeClass('isDragging');
		node.find('.isDraggable.isOver').removeClass('isOver left right');

		$(window).off('mousemove.dragbox mouseup.dragbox');
	};
	
};

export default DragBox;