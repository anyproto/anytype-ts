import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { S, U, C, J, Storage, keyboard, translate } from 'Lib';

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
		const { show } = S.Progress;
		const list = S.Progress.getList();
		const cn = [ 'progress' ];

		if (!show || !list.length) {
			return null;
		};

		const Item = (item: any) => {
			const percent = item.total > 0 ? Math.ceil(item.current / item.total * 100) : 0;

			return (
				<div className="item">
					<div className="nameWrap">
						<Label text={translate(U.Common.toCamelCase(`progress-${item.type}`))} />
						{item.canCancel ? <Icon className="close" onClick={() => this.onCancel(item.id)} /> : ''}
					</div>

					<div className="bar">
						<div className="fill" style={{width: `${percent}%` }} />
					</div>
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				className={cn.join(' ')}
			>
				<div id="inner" className="inner" onMouseDown={this.onDragStart}>
					<div className="titleWrap">
						<Label text={translate('commonProgress')} />
						<Label className="percent" text={`${S.Progress.getPercent()}%`} />
					</div>
					<div className="items">
						{list.map(item => <Item key={item.id} {...item} />)}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.resize();
	};

	componentDidUpdate () {
		const win = $(window);

		this.resize();
		win.off('resize.progress').on('resize.progress', () => this.resize());
	};

	componentWillUnmount () {
		this._isMounted = false;
		$(window).off('resize.progress');
	};

	onCancel (id: string) {
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
		Storage.set('progress', { x, y }, true);
	};

	onDragEnd (e: any) {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		$(window).off('mousemove.progress mouseup.progress');
	};

	checkCoords (x: number, y: number): { x: number, y: number } {
		const { ww, wh } = U.Common.getWindowDimensions();

		this.width = Number(this.width) || 0;
		this.height = Number(this.height) || 0;

		x = Number(x) || 0;
		x = Math.max(0, x);
		x = Math.min(ww - this.width, x);

		y = Number(y) || 0;
		y = Math.max(J.Size.header, y);
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
		if (!this.obj.length) {
			return;
		};

		this.height = this.obj.outerHeight();
		this.width = this.obj.outerWidth();

		if (coords) {
			this.setStyle(coords.x, coords.y);
		};
	};

	setStyle (x: number, y: number) {
		const coords = this.checkCoords(x, y);

		this.obj.css({ margin: 0, left: coords.x, top: coords.y, bottom: 'auto' });
	};
	
});

export default Progress;