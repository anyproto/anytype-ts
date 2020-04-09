import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Drag, Cover } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { trace } from 'mobx';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
	block: I.Block;
};

interface State {
	isEditing: boolean;
};

const $ = require('jquery');
const raf = require('raf');

@observer
class BlockCover extends React.Component<Props, State> {
	
	_isMounted = false;
	state = {
		isEditing: false,
	};
	cover: any = null;
	refDrag: any = null;
	rect: any = {};
	x: number = 0;
	y: number = 0;
	cx: number = 0;
	cy: number =  0;
	
	constructor (props: any) {
		super(props);
		
		this.onMenu = this.onMenu.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
		
		this.onScaleStart = this.onScaleStart.bind(this);
		this.onScaleMove = this.onScaleMove.bind(this);
		this.onScaleEnd = this.onScaleEnd.bind(this);
		
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragMove = this.onDragMove.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
	};
	
	render() {
		const { isEditing } = this.state;
		const { rootId } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const { coverType, coverId } = details;
		
		let elements = null;
		if (isEditing) {
			elements = (
				<React.Fragment>
					<div key="btn-drag" className="btn black drag">
						<Icon />
						<div className="txt">Drag image to reposition</div>
					</div>
					
					<div className="dragWrap">
						<Drag ref={(ref: any) => { this.refDrag = ref; }} onStart={this.onScaleStart} onMove={this.onScaleMove} onEnd={this.onScaleEnd} />
						<div id="drag-value" className="number">100%</div>
					</div>
					
					<div className="buttons">
						<div className="btn white" onMouseDown={this.onSave}>Save changes</div>
						<div className="btn white" onMouseDown={this.onCancel}>Cancel</div>
					</div>
				</React.Fragment>
			);
		} else {
			elements = (
				<React.Fragment>
					<div className="buttons">
						<div id="button-cover-edit" className={[ 'btn', 'white', 'addCover', (commonStore.menuIsOpen('blockCover') ? 'active' : '') ].join(' ')} onClick={this.onMenu}>
							<Icon />
							<div className="txt">Update cover image</div>
						</div>
					</div>
				</React.Fragment>
			);
		};
		
		return (
			<div className={[ 'wrap', (isEditing ? 'isEditing' : '') ].join(' ')} onMouseDown={this.onDragStart}>
				{coverType == I.CoverType.Image ? (
					<img id="cover" src={commonStore.imageUrl(coverId, 2048)} className={[ 'cover', 'type' + details.coverType, details.coverId ].join(' ')} />
				) : (
					<Cover id="cover" type={details.coverType} className={details.coverId} />
				)}
				<div id="elements" className="elements">
					{elements}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		
		const win = $(window);
		win.unbind('resize').on('resize', () => { this.resize(); });
	};
	
	componentDidUpdate () {
		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		$(window).unbind('resize');
	};
	
	onMenu (e: any) {
		const { rootId } = this.props;
		
		commonStore.menuOpen('blockCover', {
			element: '#button-cover-edit',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 17,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				onEdit: this.onEdit,
				onUpload: this.onEdit,
				onSelect: (type: I.CoverType, id: string) => {
					C.BlockSetDetails(rootId, [ 
						{ key: 'coverType', value: type },
						{ key: 'coverId', value: id },
						{ key: 'coverX', value: 0 },
						{ key: 'coverY', value: 0 },
						{ key: 'coverScale', value: 0 },
					]);
				}
			},
		});
	};
	
	onEdit (e: any) {
		this.setState({ isEditing: true });
	};
	
	onSave (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		this.setState({ isEditing: false });
	};
	
	onCancel (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		this.setState({ isEditing: false });
	};
	
	resize () {
		if (!this._isMounted) {
			return false;
		};
		
		const { rootId } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const { coverX, coverY, coverScale } = details;
		const node = $(ReactDOM.findDOMNode(this));
		
		const cb = (e: any) => {
			if (this.refDrag) {
				this.refDrag.setValue(coverScale);
			};
			
			this.rect = (node.get(0) as Element).getBoundingClientRect();
			this.onScaleMove(coverScale);
		};

		this.cover = node.find('#cover');
		this.cover.get(0).onload = cb;
		raf(cb);
	};
	
	onDragStart (e: any) {
		e.preventDefault();
		
		const { isEditing } = this.state;
		
		if (!this._isMounted || !isEditing) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		this.x = e.pageX - this.rect.x - this.x;
		this.y = e.pageY - this.rect.y - this.y;
		this.onDragMove(e);

		selection.setPreventSelect(true);
		node.addClass('isDragging');
		
		win.unbind('mousemove.cover mouseup.cover');
		win.on('mousemove.cover', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.cover', (e: any) => { this.onDragEnd(e); });
	};
	
	onDragMove (e: any) {
		if (!this._isMounted || !this.rect) {
			return false;
		};
		
		const { rootId } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const { coverScale } = details;
		const { x, y} = this.setTransform(e.pageX - this.rect.x - this.x, e.pageY - this.rect.y - this.y);
		
		this.cx = x;
		this.cy = y;
	};
	
	onDragEnd (e: any) {
		if (!this._isMounted) {
			return false;
		};
		
		const { rootId, dataset } = this.props;
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		selection.setPreventSelect(false);
		win.unbind('mousemove.cover mouseup.cover');
		node.removeClass('isDragging');
		
		this.x = e.pageX - this.rect.x - this.x;
		this.y = e.pageY - this.rect.y - this.y;
		
		C.BlockSetDetails(rootId, [ 
			{ key: 'coverX', value: (this.cx / this.rect.cw) },
			{ key: 'coverY', value: (this.cy / this.rect.ch) },
		]);
	};
	
	onScaleStart (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		selection.setPreventSelect(true);
	};
	
	onScaleMove (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const { rootId } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const { coverX, coverY } = details;
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#drag-value');
		
		v = (v + 1) * 100;
		value.text(Math.ceil(v) + '%');
		this.cover.css({ width: v + '%' });
		
		this.rect.cw = this.cover.width();
		this.rect.ch = this.cover.height();
		this.x = coverX * this.rect.cw;
		this.y = coverY * this.rect.ch;
		
		this.setTransform(this.x, this.y);
	};
	
	onScaleEnd (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const { rootId, dataset } = this.props;
		const { selection } = dataset || {};
		
		selection.setPreventSelect(false);
		C.BlockSetDetails(rootId, [ 
			{ key: 'coverScale', value: v },
		]);
	};
	
	setTransform (x: number, y: number) {
		let mx = this.rect.cw - this.rect.width;
		let my = this.rect.ch - this.rect.height;
		
		x = Math.max(-mx, Math.min(0, x));
		y = Math.max(-my, Math.min(0, y));
		
		this.cover.css({ transform: `translate3d(${x}px,${y}px,0px)` });
		return { x: x, y: y };
	};
	
	checkPercent (p: number): number {
		return Math.min(1, Math.max(0, p));
	};
	
};

export default BlockCover;