import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Drag, Cover, Loader } from 'Component';
import { I, C, Util, DataUtil, ObjectUtil, focus, translate, keyboard, Action } from 'Lib';
import { commonStore, blockStore, detailStore, menuStore } from 'Store';
import ControlButtons  from 'Component/page/head/controlButtons';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

interface State {
	isEditing: boolean;
};

const BlockCover = observer(class BlockCover extends React.Component<I.BlockComponent, State> {
	
	_isMounted = false;
	node: any = null;
	state = {
		isEditing: false,
	};
	cover: any = null;
	refDrag: any = null;
	rect: any = {};
	x = 0;
	y = 0;
	cx = 0;
	cy = 0;
	loaded = false;
	scale = 0;
	coords: { x: number, y: number } = { x: 0, y: 0 };
	
	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onIcon = this.onIcon.bind(this);
		this.onCoverOpen = this.onCoverOpen.bind(this);
		this.onCoverClose = this.onCoverClose.bind(this);
		this.onCoverSelect = this.onCoverSelect.bind(this);
		this.onLayout = this.onLayout.bind(this);

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
	};
	
	render () {
		const { isEditing } = this.state;
		const { rootId, readonly } = this.props;
		const object = detailStore.get(rootId, rootId, [ 'iconImage', 'iconEmoji' ].concat(Constant.coverRelationKeys), true);
		const { coverType, coverId } = object;
		const isImage = DataUtil.coverIsImage(coverType);
		const root = blockStore.getLeaf(rootId, rootId);
		const cn = [ 'elements', 'editorControlElements' ];

		if (!root) {
			return null;
		};

		let image = null;
		let author = null;
		let elements = null;
		let content = null;

		if (coverType == I.CoverType.Source) {
			image = detailStore.get(rootId, coverId, [ 'mediaArtistName', 'mediaArtistURL' ], true);
			author = (
				<div className="author">
					Photo by <a href={image.mediaArtistURL + Url.unsplash.utm}>{image.mediaArtistName}</a> on <a href={Url.unsplash.site + Url.unsplash.utm}>Unsplash</a>
				</div>
			);
		};

		if (isImage) { 
			content = <img id="cover" src="" className={[ 'cover', 'type' + coverType, coverId ].join(' ')} />;
		} else {
			content = <Cover id={coverId} image={coverId} type={coverType} className={coverId} />;
		};

		if (isEditing) {
			cn.push('active');

			elements = (
				<React.Fragment>
					<div key="btn-drag" className="btn black drag withIcon">
						<Icon />
						<div className="txt">{translate('blockCoverDrag')}</div>
					</div>
					
					<div className="dragWrap">
						<Drag 
							ref={ref => this.refDrag = ref} 
							onStart={this.onScaleStart} 
							onMove={this.onScaleMove} 
							onEnd={this.onScaleEnd} 
						/>
						<div id="dragValue" className="number">100%</div>
					</div>
					
					<div className="controlButtons">
						<div className="btn white" onMouseDown={this.onSave}>{translate('commonSave')}</div>
						<div className="btn white" onMouseDown={this.onCancel}>{translate('commonCancel')}</div>
					</div>
				</React.Fragment>
			);
		} else {
			elements = (
				<ControlButtons 
					rootId={rootId} 
					readonly={readonly}
					onIcon={this.onIcon} 
					onCoverOpen={this.onCoverOpen}
					onCoverClose={this.onCoverClose}
					onCoverSelect={this.onCoverSelect}
					onLayout={this.onLayout}
					onEdit={this.onEdit}
					onUploadStart={this.onUploadStart}
					onUpload={this.onUpload}
				/>
			);
		};

		elements = (
			<div id="elements" className={cn.join(' ')}>
				{elements}
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className={[ 'wrap', (isEditing ? 'isEditing' : '') ].join(' ')} 
				onMouseDown={this.onDragStart} 
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
			>
				<Loader id="cover-loader" />
				{content}
				{elements}
				{author}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();

		Util.renderLinks($(this.node));
		$(window).off('resize.cover').on('resize.cover', () => this.resize());
	};
	
	componentDidUpdate () {
		this.resize();

		Util.renderLinks($(this.node));
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		$(window).off('resize.cover');
	};

	onIcon (e: any) {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		
		focus.clear(true);
		root.isObjectHuman() ? this.onIconUser() : this.onIconPage();
	};
	
	onIconPage () {
		const { rootId, block } = this.props;
		const node = $(this.node);
		const elements = node.find('#elements');
		const object = detailStore.get(rootId, rootId, []);
		const { iconEmoji, iconImage } = object;
		
		menuStore.open('smile', { 
			element: `#block-${block.id} #button-icon`,
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				elements.addClass('hover');
			},
			onClose: () => {
				elements.removeClass('hover');
			},
			data: {
				noRemove: !(iconEmoji || iconImage),
				onSelect: (icon: string) => {
					ObjectUtil.setIcon(rootId, icon, '', () => {
						menuStore.update('smile', { element: `#block-icon-${rootId}` });
					});
				},
				onUpload (hash: string) {
					ObjectUtil.setIcon(rootId, '', hash, () => {
						menuStore.update('smile', { element: `#block-icon-${rootId}` });
					});
				},
			}
		});
	};
	
	onIconUser () {
		const { rootId } = this.props;

		Action.openFile(Constant.extension.cover, paths => {
			C.FileUpload('', paths[0], I.FileType.Image, (message: any) => {
				if (!message.error.code) {
					ObjectUtil.setIcon(rootId, '', message.hash);
				};
			});
		});
	};

	onLayout (e: any) {
		const { rootId, block } = this.props;
		const node = $(this.node);
		const elements = node.find('#elements');
		const object = detailStore.get(rootId, rootId, []);
		
		menuStore.open('blockLayout', { 
			element: `#block-${block.id} #button-layout`,
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				elements.addClass('hover');
			},
			onClose: () => {
				elements.removeClass('hover');
			},
			subIds: Constant.menuIds.layout,
			data: {
				rootId: rootId,
				value: object.layout,
			}
		});
	};

	onCoverOpen () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		node.find('#elements').addClass('hover');

		focus.clear(true);
	};

	onCoverClose () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		node.find('#elements').removeClass('hover');
	};

	onCoverSelect (item: any) {
		const { rootId } = this.props;

		this.loaded = false;
		ObjectUtil.setCover(rootId, item.type, item.id, item.coverX, item.coverY, item.coverScale);
	};
	
	onEdit (e: any) {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys, true);

		this.coords.x = object.coverX;
		this.coords.y = object.coverY;
		this.scale = object.coverScale;

		this.setState({ isEditing: true });
	};

	setLoading (v: boolean) {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const loader = node.find('#cover-loader');

		v ? loader.show() : loader.hide();
	};
	
	onUploadStart () {
		this.setLoading(true);
	};
	
	onUpload (type: I.CoverType, hash: string) {
		const { rootId } = this.props;

		this.coords.x = 0;
		this.coords.y = -0.25;
		this.scale = 0;

		ObjectUtil.setCover(rootId, type, hash, this.coords.x, this.coords.y, this.scale, () => {
			this.loaded = false;
			this.setLoading(false);
		});
	};
	
	onSave (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys, true);

		ObjectUtil.setCover(rootId, object.coverType, object.coverId, this.coords.x, this.coords.y, this.scale, () => {
			this.setState({ isEditing: false });
		});
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
		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys, true);
		const { coverId, coverType } = object;
		const node = $(this.node);
		const isImage = DataUtil.coverIsImage(coverType);
		
		if (!isImage || !node.hasClass('wrap')) {
			return;
		};
		
		this.cover = node.find('.cover');
		
		const el = this.cover.get(0);
		if (!el) {
			return;
		};

		this.setLoading(true);

		const cb = () => {
			const object = detailStore.get(rootId, rootId, [ 'coverScale' ], true);
			const { coverScale } = object;

			if (this.refDrag) {
				this.refDrag.setValue(coverScale);
			};

			this.rect = (node.get(0) as Element).getBoundingClientRect();
			this.onScaleMove($.Event('resize'), coverScale);
			this.cover.css({ opacity: 1 });
			this.loaded = true;
			this.setLoading(false);
		};
		
		if (this.loaded) {
			cb();
		} else {
			this.cover.css({ opacity: 0 });

			el.onload = cb;
			el.onerror = cb;
		};

		if ([ I.CoverType.Upload, I.CoverType.Source ].includes(coverType)) {
			el.src = commonStore.imageUrl(coverId, Constant.size.cover);
		};
	};
	
	onDragStart (e: any) {
		e.preventDefault();
		
		const { isEditing } = this.state;
		
		if (!this._isMounted || !isEditing) {
			return false;
		};
		
		const win = $(window);
		const node = $(this.node);
		
		this.x = e.pageX - this.rect.x - this.x;
		this.y = e.pageY - this.rect.y - this.y;
		this.onDragMove(e);

		keyboard.disableSelection(true);
		node.addClass('isDragging');
		
		win.off('mousemove.cover mouseup.cover');
		win.on('mousemove.cover', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.cover', (e: any) => { this.onDragEnd(e); });
	};
	
	onDragMove (e: any) {
		if (!this._isMounted || !this.rect) {
			return false;
		};
		
		const { x, y } = this.setTransform(e.pageX - this.rect.x - this.x, e.pageY - this.rect.y - this.y);
		this.cx = x;
		this.cy = y;
	};
	
	onDragEnd (e: any) {
		if (!this._isMounted) {
			return false;
		};
		
		const win = $(window);
		const node = $(this.node);
		
		keyboard.disableSelection(true);
		win.off('mousemove.cover mouseup.cover');
		node.removeClass('isDragging');
		
		this.x = e.pageX - this.rect.x - this.x;
		this.y = e.pageY - this.rect.y - this.y;

		this.coords = { x: this.cx / this.rect.cw, y: this.cy / this.rect.ch };
	};
	
	onScaleStart (e: any, v: number) {
		keyboard.disableSelection(true);
	};
	
	onScaleMove (e: any, v: number) {
		if (!this._isMounted || !this.cover || !this.cover.length) {
			return false;
		};

		const node = $(this.node);
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, [ 'coverX', 'coverY' ], true);
		const { coverX, coverY } = object;
		const value = node.find('#dragValue');

		v = (v + 1) * 100;
		value.text(Math.ceil(v) + '%');
		this.cover.css({ height: 'auto', width: v + '%' });

		const rect = this.cover.get(0).getBoundingClientRect() as DOMRect;

		this.rect.cw = rect.width;
		this.rect.ch = rect.height;

		this.x = coverX * this.rect.cw;
		this.y = coverY * this.rect.ch;

		this.setTransform(this.x, this.y);
	};
	
	onScaleEnd (e: any, v: number) {
		keyboard.disableSelection(false);
		this.scale = v;
	};
	
	onDragOver (e: any) {
		const { readonly } = this.props;

		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length || readonly) {
			return;
		};
		
		const node = $(this.node);
		node.addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		const { readonly } = this.props;

		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length || readonly) {
			return;
		};
		
		const node = $(this.node);
		node.removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		const { rootId, dataset, readonly } = this.props;

		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length || readonly) {
			return;
		};
		
		const { preventCommonDrop } = dataset || {};
		const file = e.dataTransfer.files[0].path;
		const node = $(this.node);
		
		node.removeClass('isDraggingOver');
		preventCommonDrop(true);
		this.setLoading(true);
		
		C.FileUpload('', file, I.FileType.Image, (message: any) => {
			this.setLoading(false);
			preventCommonDrop(false);
			
			if (message.error.code) {
				return;
			};
			
			this.loaded = false;
			ObjectUtil.setCover(rootId, I.CoverType.Upload, message.hash);
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

});

export default BlockCover;