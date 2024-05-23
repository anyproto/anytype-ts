import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { throttle } from 'lodash';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, Preview, sidebar, translate } from 'Lib';
import { commonStore } from 'Store';
import ListWidget from 'Component/list/widget';
const Constant = require('json/constant.json');

interface Props {
	dataset?: any;
};

const THROTTLE = 20;
	
const Sidebar = observer(class Sidebar extends React.Component<Props> {
	
	private _isMounted = false;
	node = null;
	refBody = null;
    ox = 0;
	oy = 0;
	sx = 0;
	refList = null;
	frame = 0;
	width = 0;
	movedX = false;

	constructor (props: Props) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
		this.onDragMove = this.onDragMove.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResizeMove = this.onResizeMove.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onHandleClick = this.onHandleClick.bind(this);
	};

    render() {
        const cn = [ 'sidebar' ];
		const cmd = keyboard.cmdSymbol();

        return (
            <div 
				ref={node => this.node = node}
                id="sidebar" 
                className={cn.join(' ')} 
            >
				<div className="inner">
					<div className="head" draggable={true} onDragStart={this.onDragStart}>
						<Icon
							className="toggle"
							tooltip={translate('sidebarToggle')}
							tooltipCaption={`${cmd} + \\, ${cmd} + .`}
							tooltipY={I.MenuDirection.Bottom}
							onClick={() => sidebar.toggleExpandCollapse()}
						/>
					</div>

					<div 
						ref={ref => this.refBody = ref}
						className="body"
					>
						<ListWidget ref={ref => this.refList = ref} {...this.props} />
					</div>
				</div>

				<div className="resize-h" draggable={true} onDragStart={this.onResizeStart}>
					<div className="resize-handle" onClick={this.onHandleClick} />
				</div>
            </div>
		);
    };

	// Lifecycle Methods

	componentDidMount (): void {
		this._isMounted = true;

		sidebar.init();
		this.rebind();
	};

	componentWillUnmount (): void {
		this._isMounted = false;
		this.unbind();

		Preview.tooltipHide(true);
	};

	setActive (id: string): void {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);

		node.find('.item.hover').removeClass('hover');

		if (id) {
			node.find(`.item.c${id}`).addClass('hover');
		};
	};

	rebind (): void {
		this.unbind();
		$(window).on('resize.sidebar', () => sidebar.resize());
	};

	unbind (): void {
		$(window).off('resize.sidebar');
	};

	// Event Handlers

	onDragStart (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const node = $(this.node);
		const { left, top } = node.offset();

		this.ox = e.pageX - left;
		this.oy = e.pageY - top;

		sidebar.resizePage();
		sidebar.setDragging(true);

		keyboard.setDragging(true);
		keyboard.disableSelection(true);

		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', throttle(e => this.onDragMove(e), THROTTLE));
		win.on('mouseup.sidebar', e => this.onDragEnd());
	};

	onDragMove (e: React.MouseEvent) {
		raf.cancel(this.frame);
		this.frame = raf(() => {
			const win = $(window);

			sidebar.set({
				x: e.pageX - this.ox - win.scrollLeft(),
				y: e.pageY - this.oy - win.scrollTop(),
			});
		});
	};

	onDragEnd () {
		$(window).off('mousemove.sidebar mouseup.sidebar');

		raf.cancel(this.frame);
		sidebar.setDragging(false);
		keyboard.disableSelection(false);
		keyboard.setDragging(false);
	};

	onResizeStart (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const win = $(window);
		const body = $('body');
		const { left, top } = node.offset();

		this.ox = left;
		this.oy = top;
		this.sx = e.pageX;

		keyboard.disableSelection(true);
		keyboard.setResize(true);
		body.addClass('colResize');

		win.off('mousemove.sidebar mouseup.sidebar blur.sidebar');
		win.on('mousemove.sidebar', e => this.onResizeMove(e));
		win.on('mouseup.sidebar blur.sidebar', e => this.onResizeEnd());
	};

	onResizeMove (e: any) {
		const { width, snap } = sidebar.data;

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			if (sidebar.isAnimating) {
				return;
			};

			if (Math.abs(this.sx - e.pageX) >= 10) {
				this.movedX = true;
			};

			const w = Math.max(0, snap == I.MenuDirection.Right ? (this.ox - e.pageX + width) : (e.pageX - this.ox));
			const d = w - this.width;

			if (d === 0) {
				return;
			};

			if (d < 0) {
				if (commonStore.isSidebarFixed && (w <= Constant.size.sidebar.width.close)) {
					sidebar.close();
				} else {
					sidebar.set({ width: w, isClosed: false });
				};
			};

			if (d > 0) {
				if ((w >= 0) && (w <= Constant.size.sidebar.width.close)) {
					sidebar.open(Constant.size.sidebar.width.min);
				} else 
				if (w > Constant.size.sidebar.width.close) {
					sidebar.set({ width: w, isClosed: false });
				};
			};

			this.width = w;
		});
	};

	onResizeEnd () {
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		raf.cancel(this.frame);

		$('body').removeClass('rowResize colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');

		window.setTimeout(() => this.movedX = false, 15);
	};

	onHandleClick () {
		if (!this.movedX && commonStore.isSidebarFixed) {
			sidebar.toggleOpenClose();
		};
	};

});

export default Sidebar;
