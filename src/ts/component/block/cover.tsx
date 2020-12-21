import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Drag, Cover, Loader } from 'ts/component';
import { I, C, Util, DataUtil, focus, translate } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};

interface State {
	editing: boolean;
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class BlockCover extends React.Component<Props, State> {
	
	_isMounted = false;
	state = {
		editing: false,
		loading: false,
	};
	cover: any = null;
	refDrag: any = null;
	rect: any = {};
	x: number = 0;
	y: number = 0;
	cx: number = 0;
	cy: number =  0;
	loaded: boolean = false;
	
	constructor (props: any) {
		super(props);
		
		this.onMenu = this.onMenu.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onUploadStart = this.onUploadStart.bind(this);
		
		this.onScaleStart = this.onScaleStart.bind(this);
		this.onScaleMove = this.onScaleMove.bind(this);
		this.onScaleEnd = this.onScaleEnd.bind(this);
		
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragMove = this.onDragMove.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);

		this.onOver = this.onOver.bind(this);
		this.onOut = this.onOut.bind(this);
	};
	
	render() {
		const { editing, loading } = this.state;
		const { rootId, readOnly } = this.props;
		const details = blockStore.getDetails(rootId, rootId);
		const { coverType, coverId,  } = details;
		const canEdit = !readOnly && coverType && ([ I.CoverType.Image, I.CoverType.BgImage ].indexOf(coverType) >= 0);
		
		let elements = null;
		if (editing) {
			elements = (
				<React.Fragment>
					<div key="btn-drag" className="btn black drag">
						<Icon />
						<div className="txt">{translate('blockCoverDrag')}</div>
					</div>
					
					<div className="dragWrap">
						<Drag ref={(ref: any) => { this.refDrag = ref; }} onStart={this.onScaleStart} onMove={this.onScaleMove} onEnd={this.onScaleEnd} />
						<div id="drag-value" className="number">100%</div>
					</div>
					
					<div className="buttons">
						<div className="btn white" onMouseDown={this.onSave}>{translate('commonSave')}</div>
						<div className="btn white" onMouseDown={this.onCancel}>{translate('commonCancel')}</div>
					</div>
				</React.Fragment>
			);
		} else {
			elements = (
				<React.Fragment>
					<div className="buttons">
						<div id="button-cover-edit" className={[ 'btn', 'white', 'addCover', (commonStore.menuIsOpen('blockCover') ? 'active' : '') ].join(' ')} onClick={this.onMenu}>
							<Icon />
							<div className="txt">{translate('blockCoverUpdate')}</div>
						</div>
					</div>
				</React.Fragment>
			);
		};
		
		return (
			<div 
				className={[ 'wrap', (editing ? 'isEditing' : '') ].join(' ')} 
				onMouseDown={this.onDragStart} 
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
				onMouseOver={this.onOver}
				onMouseOut={this.onOut}
			>
				{loading ? <Loader /> : ''}
				{canEdit ? (
					<img id="cover" src="" className={[ 'cover', 'type' + coverType, coverId ].join(' ')} />
				) : (
					<Cover id="cover" type={coverType} className={coverId} />
				)}
				{!readOnly ? (
					<div id="elements" className="elements">
						{elements}
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		
		const win = $(window);
		win.unbind('resize.cover').on('resize.cover', () => { this.resize(); });
	};
	
	componentDidUpdate () {
		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		$(window).unbind('resize.cover');
	};
	
	onMenu (e: any) {
		const { rootId } = this.props;
		
		focus.clear(true);
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
				onUploadStart: this.onUploadStart,
				onUpload: this.onUpload,
				onSelect: (item: any) => {
					this.loaded = false;
					DataUtil.pageSetCover(rootId, item.type, item.id, item.coverX, item.coverY, item.coverScale);
				}
			},
		});
	};
	
	onEdit (e: any) {
		this.setState({ editing: true });
	};
	
	onUploadStart () {
		this.setState({ loading: true });
	};
	
	onUpload () {
		this.loaded = false;
		this.setState({ loading: false, editing: true });
	};
	
	onSave (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		this.setState({ editing: false });
	};
	
	onCancel (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		this.setState({ editing: false });
	};
	
	resize () {
		if (!this._isMounted) {
			return false;
		};
		
		const { rootId } = this.props;
		const details = blockStore.getDetails(rootId, rootId);
		const { coverId, coverType } = details;
		const canEdit = coverType && [ I.CoverType.Image, I.CoverType.BgImage ].indexOf(coverType) >= 0;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!node.hasClass('wrap')) {
			return;
		};
		
		this.cover = node.find('#cover');
		
		if (canEdit) {
			const el = this.cover.get(0);
			const cb = () => {
				const details = blockStore.getDetails(rootId, rootId);
				const { coverScale } = details;

				if (this.refDrag) {
					this.refDrag.setValue(coverScale);
				};
				
				this.rect = (node.get(0) as Element).getBoundingClientRect();
				this.onScaleMove(coverScale);
				this.cover.css({ opacity: 1 });
				this.loaded = true;
			};
			
			if (this.loaded) {
				cb();
			} else {
				this.cover.css({ opacity: 0 });
				el.onload = cb;
			};
			
			if (coverType == I.CoverType.Image) {
				el.src = commonStore.imageUrl(coverId, Constant.size.cover);
			};

			if (coverType == I.CoverType.BgImage) {
				el.src = Util.coverSrc(coverId);
			};
		};
	};
	
	onDragStart (e: any) {
		e.preventDefault();
		
		const { editing } = this.state;
		
		if (!this._isMounted || !editing) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		this.x = e.pageX - this.rect.x - this.x;
		this.y = e.pageY - this.rect.y - this.y;
		this.onDragMove(e);

		selection.preventSelect(true);
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
		const details = blockStore.getDetails(rootId, rootId);
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
		
		selection.preventSelect(false);
		win.unbind('mousemove.cover mouseup.cover');
		node.removeClass('isDragging');
		
		this.x = e.pageX - this.rect.x - this.x;
		this.y = e.pageY - this.rect.y - this.y;
	
		DataUtil.pageSetCoverXY(rootId, this.cx / this.rect.cw, this.cy / this.rect.ch);
	};
	
	onScaleStart (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		selection.preventSelect(true);
	};
	
	onScaleMove (v: number) {
		if (!this._isMounted) {
			return false;
		};

		if (!this.cover || !this.cover.length) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const { rootId } = this.props;
		const details = blockStore.getDetails(rootId, rootId);
		const { coverX, coverY } = details;
		const value = node.find('#drag-value');
		const rect = this.cover.get(0).getBoundingClientRect() as DOMRect;
		
		v = (v + 1) * 100;
		value.text(Math.ceil(v) + '%');
		this.cover.css({ height: 'auto', width: v + '%' });

		this.rect.cw = rect.width;
		this.rect.ch = rect.height;
		
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

		selection.preventSelect(false);
		DataUtil.pageSetCoverScale(rootId, v);
	};
	
	onDragOver (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const { rootId, dataset } = this.props;
		const { preventCommonDrop } = dataset || {};
		const file = e.dataTransfer.files[0].path;
		const node = $(ReactDOM.findDOMNode(this));
		
		node.removeClass('isDraggingOver');
		preventCommonDrop(true);
		this.setState({ loading: true });
		
		C.UploadFile('', file, I.FileType.Image, true, (message: any) => {
			this.setState({ loading: false });
			preventCommonDrop(false);
			
			if (message.error.code) {
				return;
			};
			
			this.loaded = false;
			DataUtil.pageSetCover(rootId, I.CoverType.Image, message.hash);
		});
	};
	
	setTransform (x: number, y: number) {
		let mx = this.rect.cw - this.rect.width;
		let my = this.rect.ch - this.rect.height;

		x = Math.max(-mx, Math.min(0, x));
		y = Math.max(-my, Math.min(0, y));
		
		let css: any = { transform: `translate3d(${x}px,${y}px,0px)` };
		
		if (this.rect.ch < this.rect.height) {
			css.transform = 'translate3d(0px,0px,0px)';
			css.height = this.rect.height;
			css.width = 'auto';
		};
		
		this.cover.css(css);
		return { x: x, y: y };
	};
	
	checkPercent (p: number): number {
		return Math.min(1, Math.max(0, p));
	};

	onOver (e: any) {
		$('.headerMainEditSearch').addClass('active');
	};

	onOut (e: any) {
		$('.headerMainEditSearch').removeClass('active');
	};
	
};

export default BlockCover;