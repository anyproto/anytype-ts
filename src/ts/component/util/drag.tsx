import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Util } from 'ts/lib';
import { Icon } from 'ts/component';

interface Props {
	className: string;
	value: number;
	onStart?(v: number): void;
	onMove?(v: number): void;
	onEnd?(v: number): void;
};

const $ = require('jquery');

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
		const { className } = this.props;
		
		let cn: string[] = [ 'input-drag' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')} onMouseDown={this.start}>
				<div id="back" className="back"></div>
				<div id="fill" className="fill"></div>
				<Icon id="icon" />
			</div>
		);
	};
	
	componentDidMount () {
		const win = $(window);
		
		this.node = $(ReactDOM.findDOMNode(this));
		this.back = this.node.find('#back');
		this.fill = this.node.find('#fill');
		this.icon = this.node.find('#icon');
		
		this.nw = this.node.width();
		this.iw = this.icon.width();
		this.ox = this.node.offset().left;
		
		this.setValue(this.props.value);
	};
	
	setValue (v: number) {
		this.move(this.checkValue(v) * this.maxWidth());
	};
	
	getValue () {
		return this.checkValue(this.value);
	};
	
	start (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const { onStart } = this.props;
		const win = $(window);
		
		this.move(e.pageX - this.ox - this.iw / 2);
		this.node.addClass('isDragging');
		
		win.unbind('mousemove.drag touchmove.drag').on('mousemove.drag touchmove.drag', (e: any) => {
			this.move(e.pageX - this.ox - this.iw / 2);
		});
		
		win.unbind('mouseup.drag touchend.drag').on('mouseup.drag touchend.drag', (e: any) => {
			this.end(e);
		});
		
		if (onStart) {
			onStart(this.value);
		};
	};
	
	move (x: number) {
		const { onMove } = this.props;
		
		x = Math.max(0, x);
		x = Math.min(this.maxWidth(), x);
		
		let w = Math.min(this.nw, x + this.iw / 2);
		
		this.icon.css({ left: x });
		this.back.css({ left: (w + 8), width: (this.nw - w - 8) });
		this.fill.css({ width: (w - 2) });
		
		this.value = this.checkValue(x / this.maxWidth());
		
		if (onMove) {
			onMove(this.value);
		};
	};
	
	maxWidth () {
		return this.nw - this.iw;
	};
	
	end (e: any) {
		const { onEnd } = this.props;
		const win = $(window);
		
		win.unbind('mousemove.drag touchmove.drag mouseup.drag touchend.drag');
		this.node.removeClass('isDragging');
		
		if (onEnd) {
			onEnd(this.value);
		};
	};
	
	checkValue (v: number): number {
		v = Number(v) || 0;
		v = Math.max(0, v);
		v = Math.min(1, v);
		return v;
	};
	
};

export default Drag;