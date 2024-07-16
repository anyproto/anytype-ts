import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, U, J, keyboard, Preview, sidebar, translate } from 'Lib';
import ListWidget from 'Component/list/widget';

const Sidebar = observer(class Sidebar extends React.Component {
	
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

	constructor (props) {
		super(props);

		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResizeMove = this.onResizeMove.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onHandleClick = this.onHandleClick.bind(this);
	};

    render() {
        const cn = [ 'sidebar' ];
		const space = U.Space.getSpaceview();
		const cmd = keyboard.cmdSymbol();
		const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
		const memberCnt = participants.filter(it => it.isActive).length;

		let status = '';
		if (space && !space._empty_) {
			if (space.isShared) {
				status = U.Common.sprintf('%d %s', memberCnt, U.Common.plural(memberCnt, translate('pluralMember')));
			} else {
				status = translate(`spaceAccessType${space.spaceAccessType}`);
			};
		};

        return (
			<React.Fragment>
				<Icon 
					id="sidebarToggle"
					tooltipCaption={`${cmd} + \\, ${cmd} + .`}
					tooltipY={I.MenuDirection.Bottom}
					onClick={() => sidebar.toggleOpenClose()}
				/>

				<div 
					ref={node => this.node = node}
					id="sidebar" 
					className={cn.join(' ')} 
				>
					<div className="inner">
						<div id="sidebarHead" className="head">
							{status ? <div className="status">{status}</div> : ''}
						</div>
						<div 
							id="sidebarBody"
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
			</React.Fragment>
		);
    };

	// Lifecycle Methods

	componentDidMount (): void {
		this._isMounted = true;

		sidebar.init();
	};

	componentWillUnmount (): void {
		this._isMounted = false;

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

			const w = Math.max(0, (e.pageX - this.ox));
			const d = w - this.width;

			if (d === 0) {
				return;
			};

			if (d < 0) {
				if (w <= J.Size.sidebar.width.close) {
					sidebar.close();
				} else {
					sidebar.setWidth(w);
				};
			};

			if (d > 0) {
				if ((w >= 0) && (w <= J.Size.sidebar.width.close)) {
					sidebar.open(J.Size.sidebar.width.min);
				} else 
				if (w > J.Size.sidebar.width.close) {
					sidebar.setWidth(w);
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
		if (!this.movedX) {
			sidebar.toggleOpenClose();
		};
	};

});

export default Sidebar;
