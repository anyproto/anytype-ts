import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Util } from 'ts/lib';
import { Icon } from 'ts/component';

interface Props {
	id?: string;
	className: string;
	value: number;
	snap?: number;
	onStart?(e: any, v: number): void;
	onMove?(e: any, v: number): void;
	onEnd?(e: any, v: number): void;
};

const $ = require('jquery');
const raf = require('raf');

class Drag extends React.Component<Props, {}> {

	public static defaultProps = {
		value: 0,
		className: '',
	};
	
	value: number = 0;
	ox: number = 0;
	nw: number = 0;
	iw: number = 0;
	
	node: any = null;
	back: any = null;
	fill: any = null;
	icon: any = null;

	constructor (props: any) {
		super(props);
		
		this.start = this.start.bind(this);
	};
	
	render () {
		const { id, className } = this.props;
		
		let cn: string[] = [ 'input-drag' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div id={id} className={cn.join(' ')} onMouseDown={this.start}>
				<div id="back" className="back" />
				<div id="fill" className="fill" />
				<div id="icon" className="icon">
					<div className="bullet" />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.node = $(ReactDOM.findDOMNode(this));
		this.back = this.node.find('#back');
		this.fill = this.node.find('#fill');
		this.icon = this.node.find('#icon');

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
		const iw = this.icon.width();
		const ox = this.node.offset().left;
		
		$('body').addClass('grab');

		this.move(e.pageX - ox - iw / 2);
		this.node.addClass('isDragging');
		
		if (onStart) {
			onStart(e, this.value);
		};

		win.unbind('mousemove.drag touchmove.drag').on('mousemove.drag touchmove.drag', (e: any) => {
			this.move(e.pageX - ox - iw / 2);

			if (onMove) {
				onMove(e, this.value);
			};
		});
		
		win.unbind('mouseup.drag touchend.drag').on('mouseup.drag touchend.drag', (e: any) => {
			this.end(e);

			if (onEnd) {
				onEnd(e, this.value);
			};
		});
	};
	
	move (x: number) {
		const { snap } = this.props;
		const nw = this.node.width();
		const iw = this.icon.width();
		const ib = parseInt(this.icon.css('border-width'));
		const mw = this.maxWidth();
		
		x = Math.max(0, x);
		x = Math.min(mw, x);

		this.value = this.checkValue(x / mw);
		if (snap && (this.value > snap - 0.025) && (this.value < snap + 0.025)) {
			this.value = snap;
		};
		x = this.value * mw;

		const w = Math.min(nw, x + iw / 2);

		this.icon.css({ left: x });
		this.back.css({ left: (w + iw / 2 + ib), width: (nw - w - iw / 2 - ib) });
		this.fill.css({ width: (w - ib) });
	};
	
	end (e: any) {
		const win = $(window);
		
		win.unbind('mousemove.drag touchmove.drag mouseup.drag touchend.drag');

		$('body').removeClass('grab');
		this.node.removeClass('isDragging');
	};

	maxWidth () {
		return this.node.width() - this.icon.width();
	};
	
	checkValue (v: number): number {
		v = Number(v) || 0;
		v = Math.max(0, v);
		v = Math.min(1, v);
		return v;
	};
	
};

export default Drag;