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
		let image = '';
		
		if (coverType == I.CoverType.Image) {
			image = commonStore.imageUrl(coverId, 2048);
		};
		
		if (isEditing) {
			elements = (
				<React.Fragment>
					<div key="btn-drag" className="btn black drag" onMouseDown={this.onDragStart}>
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
				<img id="cover" src={image} className={[ 'cover', 'type' + details.coverType, details.coverId ].join(' ')} />
				<div id="elements" className="elements">
					{elements}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.init();
	};
	
	componentDidUpdate () {
		this.init();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
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
	
	init () {
		if (!this._isMounted) {
			return false;
		};
		
		const { rootId } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const { coverX, coverY, coverScale } = details;
		const node = $(ReactDOM.findDOMNode(this));

		this.cover = node.find('#cover');
		
		raf(() => {
			if (this.refDrag) {
				this.refDrag.setValue(coverScale);
			};
			
			this.onScaleMove(coverScale);
			this.cover.css({ transform: 'translate3d(' + (coverX * 100) + '%, ' + (coverY * 100) + '%, 0px)' });
		});
	};
	
	onDragStart (e: any) {
		e.preventDefault();
		
		const { isEditing } = this.state;
		
		if (!this._isMounted) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		this.rect = (node.get(0) as Element).getBoundingClientRect();
		this.x = e.pageX - this.rect.x - this.x;
		this.y = e.pageY - this.rect.y - this.y;
		
		this.rect.mx = this.cover.width() - this.rect.width;
		this.rect.my = this.cover.height() - this.rect.height;
		
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
		
		let x = e.pageX - this.rect.x - this.x;
		let y = e.pageY - this.rect.y - this.y;
		
		x = Math.min(0, x);
		x = Math.max(-this.rect.mx, x);
		
		y = Math.min(0, y);
		y = Math.max(-this.rect.my, y);
		
		this.cover.css({ transform: `translate3d(${x}px,${y}px,0px)` });
	};
	
	onDragEnd (e: any) {
		if (!this._isMounted) {
			return false;
		};
		
		const { rootId, dataset } = this.props;
		const { selection } = dataset;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		selection.setPreventSelect(false);
		win.unbind('mousemove.cover mouseup.cover');
		node.removeClass('isDragging');
		
		this.x = e.pageX - this.rect.x - this.x;
		this.y = e.pageY - this.rect.y - this.y;
		
		C.BlockSetDetails(rootId, [ 
			{ key: 'coverX', value: (this.x / this.rect.width) },
			{ key: 'coverY', value: (this.y / this.rect.height) },
		]);
	};
	
	onScaleStart (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset;
		
		selection.setPreventSelect(true);
	};
	
	onScaleMove (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#drag-value');
		
		v = (v + 1) * 100;
		value.text(Math.ceil(v) + '%');
		this.cover.css({ width: v + '%' });
	};
	
	onScaleEnd (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const { rootId, dataset } = this.props;
		const { selection } = dataset;
		
		selection.setPreventSelect(false);
		C.BlockSetDetails(rootId, [ 
			{ key: 'coverScale', value: v },
		]);
	};
	
	checkPercent (p: number): number {
		return Math.min(1, Math.max(0, p));
	};
	
};

export default BlockCover;