import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Util } from 'Lib';

interface Props {
	onDragEnd(oldIndex: number, newIndex: number): void;
	onClick?(e: any, id: string): void;
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
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const children = React.Children.map(this.props.children, (child: any) => {
			return React.cloneElement(child, { 
				onClick: this.onClick,
				onDragStart: this.onDragStart 
			});
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

	onClick (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { onClick } = this.props;

		if (onClick) {
			onClick(e, $(e.currentTarget).data('id'));
		};
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

		items.each((i: number, item: any) => {
			item = $(item);

			const id = item.data('id');
			if (!id || item.hasClass('isClone')) {
				return;
			};

			const p = item.position();
			this.cache[id] = {
				x: p.left,
				y: p.top,
				width: item.outerWidth(),
				height: item.outerHeight(),
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
		const width = clone.outerWidth();
		const height = clone.outerHeight();
		const x = e.pageX - this.ox - width / 2;
		const y = e.pageY - this.oy - height / 2;
		const center = x + width / 2;

		this.newIndex = -1;

		node.find('.isDraggable.isOver').removeClass('isOver left right');
		clone.css({ transform: `translate3d(${x}px,${y}px,0px)` });

		for (let i = 0; i < items.length; ++i) {
			const el = $(items.get(i));
			const rect = this.cache[el.data('id')];

			if (rect && Util.rectsCollide({ x: center, y, width: 2, height }, rect)) {
				const isLeft = center <= rect.x + rect.width / 2;
				this.newIndex = i;
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
		const { onDragEnd, onClick } = this.props;

		node.find('.isDraggable.isClone').remove();
		node.find('.isDraggable.isDragging').removeClass('isDragging');
		node.find('.isDraggable.isOver').removeClass('isOver left right');

		$(window).off('mousemove.dragbox mouseup.dragbox');

		if (this.newIndex >= 0) {
			onDragEnd(this.oldIndex, this.newIndex);
		};

		this.cache = {};
		this.oldIndex = -1;
		this.newIndex = -1;
	};
	
};

export default DragBox;