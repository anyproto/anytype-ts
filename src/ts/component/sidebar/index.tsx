import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, Preview, sidebar } from 'Lib';
import { commonStore } from 'Store';
import ListWidget from 'Component/list/widget';

interface Props {
	dataset?: any;
};
	
const Sidebar = observer(class Sidebar extends React.Component<Props> {
	
	private _isMounted = false;
	node: any = null;
    ox = 0;
	oy = 0;
    refFooter: React.Ref<HTMLUnknownElement> = null;

	constructor (props: Props) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
		this.onDragMove = this.onDragMove.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResizeMove = this.onResizeMove.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
	};

    render() {
        const cn = [ 'sidebar' ];

        return (
            <div 
				ref={node => this.node = node}
                id="sidebar" 
                className={cn.join(' ')} 
            >
                <div className="head" draggable={true} onDragStart={this.onDragStart}>
					<Icon
						className="toggleSidebar"
						tooltip="Close sidebar"
						tooltipY={I.MenuDirection.Bottom}
						onClick={() => { sidebar.collapse(); }}
					/>
				</div>

				<div className="body">
					<ListWidget {...this.props} />
				</div>

				<div className="resize-h" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Horizontal); }} />
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
		$(window).on('resize.sidebar', (e: any) => { sidebar.resize(); });
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
		const offset = node.offset();

		this.ox = e.pageX - offset.left;
		this.oy = e.pageY - offset.top;

		sidebar.resizePage();
		sidebar.setDragging(true);

		keyboard.disableSelection(true);

		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.sidebar', (e: any) => { this.onDragEnd(e); });
	}

	onDragMove (e: React.MouseEvent) {
		const win = $(window);

		sidebar.set({
			x: e.pageX - this.ox - win.scrollLeft(),
			y: e.pageY - this.oy - win.scrollTop(),
		});
	};

	onDragEnd (e: React.MouseEvent) {
		$(window).off('mousemove.sidebar mouseup.sidebar');
		sidebar.setDragging(false);
		keyboard.disableSelection(false);
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
		const offset = node.offset();

		if (commonStore.isSidebarFixed && (dir == I.MenuType.Vertical)) {
			return;
		};

		this.ox = offset.left;
		this.oy = offset.top;

		keyboard.disableSelection(true);
		keyboard.setResize(true);

		body.addClass(dir == I.MenuType.Vertical ? 'rowResize' : 'colResize');

		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onResizeMove(e, dir); });
		win.on('mouseup.sidebar', (e: any) => { this.onResizeEnd(e); });
	};

	onResizeMove (e: React.MouseEvent, dir: I.MenuType) {
		const { width, snap } = sidebar.data;

		if (dir == I.MenuType.Horizontal) {
			sidebar.setWidth(
				snap == I.MenuDirection.Right
					? (this.ox - e.pageX + width)
					: (e.pageX - this.ox)
			);
		};

		if (dir == I.MenuType.Vertical) {
			sidebar.setHeight(e.pageY - this.oy);
		};

		sidebar.resizePage();
		$(window).trigger('resize');
	};

	onResizeEnd (e: React.MouseEvent) {
		keyboard.disableSelection(false);
		keyboard.setResize(false);

		$('body').removeClass('rowResize colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');
	};

});

export default Sidebar;
