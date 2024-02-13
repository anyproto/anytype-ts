import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Icon, Label } from 'Component';
import { UtilCommon, C, Storage, keyboard } from 'Lib';
import { commonStore } from 'Store';

const Progress = observer(class Progress extends React.Component {
	
	_isMounted = false;
	node: any = null;
	obj: any = null;
	dx = 0;
	dy = 0;
	width = 0;
	height = 0;

	constructor (props: any) {
		super(props);
		
		this.onCancel = this.onCancel.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
	};
	
	render () {
		const { progress } = commonStore;
		const { status, current, total, isUnlocked, canCancel } = progress || {};

		if (!status) {
			return null;
		};
		
		const text = UtilCommon.sprintf(status, current, total);
		const cn = [ 'progress', (isUnlocked ? 'isUnlocked' : '') ];
		
		return (
			<div 
				ref={node => this.node = node} 
				className={cn.join(' ')}
			>
				<div id="inner" className="inner" onMouseDown={this.onDragStart}>
					<Label text={text} />
					{canCancel ? <Icon className="close" onClick={this.onCancel} /> : ''}
					<div className="bar">
						<div className="fill" style={{width: (Math.ceil(current / total * 100)) + '%'}} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		const { progress } = commonStore;
		if (!progress) {
			return;
		};

		const { current, total } = progress;
		const win = $(window);
		const node = $(this.node);

		node.removeClass('hide');
		this.resize();

		win.off('resize.progress').on('resize.progress', () => this.resize());
		
		if (total && (current >= total)) {
			node.addClass('hide');
			win.off('resize.progress');

			window.setTimeout(() => commonStore.progressClear(), 200);
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onCancel (e: any) {
		const { progress } = commonStore;
		const { id } = progress;
		
		C.ProcessCancel(id);
	};

	onDragStart (e: any) {
		const win = $(window);
		const offset = this.obj.offset();

		this.dx = e.pageX - offset.left;
		this.dy = e.pageY - offset.top;

		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		win.off('mousemove.progress mouseup.progress');
		win.on('mousemove.progress', e => this.onDragMove(e));
		win.on('mouseup.progress', e => this.onDragEnd(e));
	};

	onDragMove (e: any) {
		const win = $(window);
		const x = e.pageX - this.dx - win.scrollLeft();
		const y = e.pageY - this.dy - win.scrollTop();

		this.setStyle(x, y);
	};

	onDragEnd (e: any) {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		$(window).off('mousemove.progress mouseup.progress');
	};

	checkCoords (x: number, y: number): { x: number, y: number } {
		const { ww, wh } = UtilCommon.getWindowDimensions();

		x = Number(x) || 0;
		x = Math.max(0, x);
		x = Math.min(ww - this.width, x);

		y = Number(y) || 0;
		y = Math.max(UtilCommon.sizeHeader(), y);
		y = Math.min(wh - this.height, y);

		return { x, y };
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const coords = Storage.get('progress');

		this.obj = node.find('#inner');
		this.height = this.obj.outerHeight();
		this.width = this.obj.outerWidth();

		if (coords) {
			this.setStyle(coords.x, coords.y);
		};
	};

	setStyle (x: number, y: number) {
		const coords = this.checkCoords(x, y);

		if ((coords.x !== null) && (coords.y !== null)) {
			this.obj.css({ margin: 0, left: coords.x, top: coords.y });
			Storage.set('progress', coords, true);
		};
	};
	
});

export default Progress;