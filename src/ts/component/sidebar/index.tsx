import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { throttle } from 'lodash';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, Preview, sidebar } from 'Lib';
import { commonStore } from 'Store';
import ListWidget from 'Component/list/widget';
import Constant from 'json/constant.json';

interface Props {
	dataset?: any;
};

const THROTTLE = 20;
	
const Sidebar = observer(class Sidebar extends React.Component<Props> {
	
	private _isMounted = false;
	node: any = null;
    ox = 0;
	oy = 0;
	sx = 0;
    refFooter: React.Ref<HTMLUnknownElement> = null;
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
				<div className="over">
					<div className="head" draggable={true} onDragStart={this.onDragStart}>
						<Icon
							className="toggle"
							tooltip="Toggle sidebar fixed mode"
							tooltipCaption={`${cmd} + \\, ${cmd} + .`}
							tooltipY={I.MenuDirection.Bottom}
							onClick={() => sidebar.toggleExpandCollapse()}
						/>
					</div>

					<div className="body">
						<ListWidget {...this.props} />
					</div>
				</div>

				<div className="resize-h" draggable={true} onDragStart={e => this.onResizeStart(e, I.MenuType.Horizontal)}>
					<div className="resize-handle" onClick={this.onHandleClick} />
				</div>
				{/*<div className="resize-v" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Vertical); }} />*/}
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
		const win = $(window);

		raf.cancel(this.frame);

		this.frame = raf(() => {
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

	onResizeStart (e: React.MouseEvent, dir: I.MenuType) {
		e.preventDefault();
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const win = $(window);
		const body = $('body');
		const { left, top } = node.offset();

		if (commonStore.isSidebarFixed && (dir == I.MenuType.Vertical)) {
			return;
		};

		this.ox = left;
		this.oy = top;
		this.sx = e.pageX;

		keyboard.disableSelection(true);
		keyboard.setResize(true);

		body.addClass(dir == I.MenuType.Vertical ? 'rowResize' : 'colResize');

		win.off('mousemove.sidebar mouseup.sidebar blur.sidebar');
		win.on('mousemove.sidebar', e => this.onResizeMove(e, dir));
		win.on('mouseup.sidebar blur.sidebar', e => this.onResizeEnd());
	};

	onResizeMove (e: any, dir: I.MenuType) {
		const { width, snap } = sidebar.data;

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			if (sidebar.isAnimating) {
				return;
			};

			if (dir == I.MenuType.Horizontal) {
				if (Math.abs(this.sx - e.pageX) >= 10) {
					this.movedX = true;
				};

				const w = Math.max(0, snap == I.MenuDirection.Right ? (this.ox - e.pageX + width) : (e.pageX - this.ox));
				const d = w - this.width;

				if (d < 0) {
					if (commonStore.isSidebarFixed && (w <= Constant.size.sidebar.width.close)) {
						sidebar.close();
					} else {
						sidebar.setWidth(w);
					};
				};

				if (d > 0) {
					if ((w >= 0) && (w <= Constant.size.sidebar.width.close)) {
						sidebar.open(Constant.size.sidebar.width.min);
					} else 
					if (w > Constant.size.sidebar.width.close) {
						sidebar.setWidth(w);
					};
				};

				this.width = w;
			};

			if (dir == I.MenuType.Vertical) {
				sidebar.setHeight(e.pageY - this.oy);
			};
		});
	};

	onResizeEnd () {
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		raf.cancel(this.frame);

		$('body').removeClass('rowResize colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');

		window.setTimeout(() => { this.movedX = false; }, 15);
	};

	onHandleClick () {
		if (!this.movedX) {
			sidebar.toggleOpenClose();
		};
	};

});

export default Sidebar;
