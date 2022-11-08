// Third Party
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';

// Libraries
import { keyboard, sidebar, I, Util } from 'Lib';

// UI Components
import Footer from './footer';
import { Tree } from '../widgets';

const $ = require('jquery');

interface Props {
	dataset?: any;
};

interface State {
};


const Sidebar = observer(class Sidebar extends React.Component<Props, State> {
	private _isMounted: boolean = false;
    ox: number = 0;
	oy: number = 0;
    refFooter: React.Ref<HTMLUnknownElement> = null;

    constructor (props: Props) {
		super(props);
		this.onDragStart = this.onDragStart.bind(this)
		this.onDragMove = this.onDragMove.bind(this)
		this.onDragEnd = this.onDragEnd.bind(this)
		this.onResizeStart = this.onResizeStart.bind(this)
		this.onResizeMove = this.onResizeMove.bind(this)
		this.onResizeEnd = this.onResizeEnd.bind(this)
	};
    render() {
        const cn = [ 'sidebar' ];

        return (
            <div 
                id="sidebar" 
                className={cn.join(' ')} 
            >
                <div id="head" className="head" onMouseDown={this.onDragStart} />
                <Footer ref={(ref: any) => { this.refFooter = ref; }} />
				<Tree dataset={this.props.dataset}></Tree>
				<div className="resize-h" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Horizontal); }} />
				{/*<div className="resize-v" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Vertical); }} />*/}
            </div>);
    }

	// Lifecycle Methods

	componentDidMount (): void {
		this._isMounted = true;

		sidebar.init();
		this.rebind();
	};


	componentWillUnmount (): void {
		this._isMounted = false;
		this.unbind();
		Util.tooltipHide(true);
	};

	setActive (id: string):  void {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');

		if (id) {
			node.find(`.item.c${id}`).addClass('hover');
		};
	};


	rebind ():  void {
		this.unbind();
		$(window).on('resize.sidebar', (e: any) => { sidebar.resize(); });
	};

	unbind ():  void {
		$(window).off('resize.sidebar');
	};

	// Event Handlers

    onDragStart (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const { dataset } = this.props;
		const { selection } = dataset || {};

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const offset = node.offset();

		this.ox = e.pageX - offset.left;
		this.oy = e.pageY - offset.top;

		sidebar.set({ fixed: false });
		sidebar.resizePage();

		keyboard.setDragging(true);
		if (selection) {
			selection.preventSelect(true);
		};

		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.sidebar', (e: any) => { this.onDragEnd(e); });
	};

	onDragMove (e: React.MouseEvent) {
		const win = $(window);
		
		sidebar.set({ 
			x: e.pageX - this.ox - win.scrollLeft(), 
			y: e.pageY - this.oy - win.scrollTop(),
		});
	};

	onDragEnd (e: React.MouseEvent) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		$(window).off('mousemove.sidebar mouseup.sidebar');
		keyboard.setDragging(false);

		if (selection) {
			selection.preventSelect(false);
		};
	};

    onResizeStart (e: React.MouseEvent, dir: I.MenuType) {
		e.preventDefault();
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};

		const { dataset } = this.props;
		const { selection } = dataset || {};
		const { fixed } = sidebar.data;
		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);
		const body = $('body');
		const offset = node.offset();

		if (fixed && (dir == I.MenuType.Vertical)) {
			return;
		};
		
		this.ox = offset.left;
		this.oy = offset.top;

		if (selection) {
			selection.preventSelect(true);
		};

		keyboard.setResize(true);
		body.addClass(dir == I.MenuType.Vertical ? 'rowResize' : 'colResize');
		win.off('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onResizeMove(e, dir); });
		win.on('mouseup.sidebar', (e: any) => { this.onResizeEnd(e, dir); });
	};

	onResizeMove (e: React.MouseEvent, dir: I.MenuType) {
		const { width, snap } = sidebar.data;

		if (dir == I.MenuType.Horizontal) {
			sidebar.setWidth((snap == I.MenuDirection.Right) ? (this.ox - e.pageX + width) : (e.pageX - this.ox));
		};

		if (dir == I.MenuType.Vertical) {
			sidebar.setHeight(e.pageY - this.oy);
		};

		sidebar.resizePage();
		$(window).trigger('resize');
	};

	onResizeEnd (e: React.MouseEvent, dir: I.MenuType) {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		if (selection) {
			selection.preventSelect(false);
		};

		keyboard.setResize(false);
		$('body').removeClass('rowResize colResize');
		$(window).off('mousemove.sidebar mouseup.sidebar');
	};
});

export default Sidebar;