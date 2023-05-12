import * as React from 'react';
import { Icon, IconObject } from 'Component';
import { detailStore, blockStore } from 'Store';
import { I, ObjectUtil, keyboard, Storage, Util } from 'Lib';
import Constant from 'json/constant.json';

interface Props {
	rootId?: string;
};

class Navigation extends React.Component<Props> {

	_isMounted = false;
	node: any = null;
	obj: any = null;
	dx = 0;
	dy = 0;
	width = 0;
	height = 0;

	constructor (props: Props) {
		super(props);

		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onGraph = this.onGraph.bind(this);
		this.onSearch = this.onSearch.bind(this);
	};

	render () {
		const profile = detailStore.get(Constant.subId.profile, blockStore.profile);
		const buttons: any[] = [
			{ className: 'back', tooltip: 'Back', onClick: this.onBack, disabled: !keyboard.checkBack() },
			{ className: 'forward', tooltip: 'Forward', onClick: this.onForward, disabled: !keyboard.checkForward() },
			{ className: 'plus', tooltip: 'Create new object', onClick: this.onAdd },
			{ className: 'graph', tooltip: 'Graph', onClick: this.onGraph },
			{ className: 'search', tooltip: 'Search', onClick: this.onSearch },
		];

		return (
			<div 
				ref={node => this.node = node}
				className="navigationPanel"
			>
				<div className="inner">
					{buttons.map(item => {
						const cn = [ item.className ];

						if (item.disabled) {
							cn.push('disabled');
						};

						return (
							<Icon key={item.className} {...item} className={cn.join(' ')} tooltipY={I.MenuDirection.Top} />
						);
					})}
					<div className="line" />
					<IconObject object={profile} size={28} iconSize={20} />
				</div>
				<div className="bg" onMouseDown={this.onDragStart} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		this.resize();
		$(window).off('resize.navigation').on('resize.navigation', () => this.resize());
	};

	componentWillUnmount () {
		this._isMounted = false;
		$(window).off('resize.navigation');
	};

	onBack () {
		keyboard.onBack();
	};

	onForward () {
		keyboard.onForward();
	};

	onAdd () {
		ObjectUtil.create('', '', {}, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ], (message: any) => {
			ObjectUtil.openAuto({ id: message.targetId });
		});
	};

	onGraph () {
		ObjectUtil.openAuto({ id: this.props.rootId, layout: I.ObjectLayout.Graph });
	};

	onSearch () {
		keyboard.onSearchPopup();
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

	onDragStart (e: any) {
		const win = $(window);
		const offset = this.obj.offset();

		this.dx = e.pageX - offset.left;
		this.dy = e.pageY - offset.top;

		win.off('mousemove.progress mouseup.progress');
		win.on('mousemove.progress', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.progress', (e: any) => { this.onDragEnd(e); });
	};

	onDragMove (e: any) {
		const win = $(window);
		const x = e.pageX - this.dx - win.scrollLeft();
		const y = e.pageY - this.dy - win.scrollTop();

		this.setStyle(x, y);
	};

	onDragEnd (e: any) {
		$(window).off('mousemove.progress mouseup.progress');
	};

	checkCoords (x: number, y: number): { x: number, y: number } {
		const win = $(window);
		const ww = win.width();
		const wh = win.height();

		x = Number(x) || 0;
		x = Math.max(0, x);
		x = Math.min(ww - this.width, x);

		y = Number(y) || 0;
		y = Math.max(Util.sizeHeader(), y);
		y = Math.min(wh - this.height, y);

		return { x, y };
	};

	setStyle (x: number, y: number) {
		const coords = this.checkCoords(x, y);
		
		this.obj.css({ margin: 0, left: coords.x, top: coords.y });
		Storage.set('progress', coords);
	};
	
};

export default Navigation;