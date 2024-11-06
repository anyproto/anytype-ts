import * as React from 'react';
import $ from 'jquery';

interface Props {
	id?: string;
	className: string;
	value: number;
	snaps?: number[];
	strictSnap?: boolean;
	onStart?(e: any, v: number): void;
	onMove?(e: any, v: number): void;
	onEnd?(e: any, v: number): void;
};

const SNAP = 0.025;

class DragHorizontal extends React.Component<Props> {

	public static defaultProps = {
		value: 0,
		min: 0,
		max: 1,
		className: '',
	};
	
	value = null;
	ox = 0;
	nw = 0;
	iw = 0;
	node: any = null;
	back: any = null;
	fill: any = null;
	icon: any = null;

	constructor (props: Props) {
		super(props);
		
		this.start = this.start.bind(this);
	};
	
	render () {
		const { id, className } = this.props;
		const cn = [ 'input-drag-horizontal' ];

		if (className) {
			cn.push(className);
		};
		
		return (
			<div 
				ref={node => this.node = node}
				id={id} 
				className={cn.join(' ')} 
				onMouseDown={this.start}
			>
				<div id="back" className="back" />
				<div id="fill" className="fill" />
				<div id="icon" className="icon">
					<div className="bullet" />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const node = $(this.node);

		this.back = node.find('#back');
		this.fill = node.find('#fill');
		this.icon = node.find('#icon');
		this.setValue(this.props.value);
	};

	setValue (v: number) {
		this.move(this.checkValue(v) * this.maxWidth());
	};
	
	getValue () {
		return this.checkValue(this.value);
	};

	resize () {
		this.setValue(this.value);
	};

	start (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const { onStart, onMove, onEnd } = this.props;
		const win = $(window);
		const node = $(this.node);
		const iw = this.icon.width();
		const ox = node.offset().left;
		
		this.move(e.pageX - ox - iw / 2);
		node.addClass('isDragging');
		
		if (onStart) {
			onStart(e, this.value);
		};

		win.off('mousemove.drag touchmove.drag').on('mousemove.drag touchmove.drag', (e: any) => {
			this.move(e.pageX - ox - iw / 2);

			if (onMove) {
				onMove(e, this.value);
			};
		});
		
		win.off('mouseup.drag touchend.drag').on('mouseup.drag touchend.drag', (e: any) => {
			this.end(e);

			if (onEnd) {
				onEnd(e, this.value);
			};
		});
	};
	
	move (x: number) {
		const { strictSnap } = this.props;
		const snaps = this.props.snaps || [];
		const node = $(this.node);
		const nw = node.width();
		const iw = this.icon.width() / 2;
		const ib = parseInt(this.icon.css('border-width'));
		const mw = this.maxWidth();

		x = Math.max(0, x);
		x = Math.min(mw, x);

		this.value = this.checkValue(x / mw);

		// Snap
		if (strictSnap && snaps.length && (this.value < snaps[0] / 2)) {
			this.value = 0;
		} else {
			const step = 1 / snaps.length;
			for (const snap of snaps) {
				const d = strictSnap ? step / 2 : SNAP;

				if ((this.value >= snap - d) && (this.value < snap + d)) {
					this.value = snap;
					break;
				};
			};
		};

		x = this.value * mw;

		const w = Math.min(nw, x + iw);

		this.icon.css({ left: x });
		this.back.css({ left: (w + iw + ib), width: (nw - w - iw - ib) });
		this.fill.css({ width: (w - ib) });
	};
	
	end (e) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const node = $(this.node);
		
		win.off('mousemove.drag touchmove.drag mouseup.drag touchend.drag');
		node.removeClass('isDragging');
	};

	maxWidth () {
		const node = $(this.node);
		return node.width() - this.icon.width();
	};
	
	checkValue (v: number): number {
		v = Number(v) || 0;
		v = Math.max(0, v);
		v = Math.min(1, v);
		return v;
	};
	
};

export default DragHorizontal;