import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, DragHorizontal, Cover, Loader, Label } from 'Component';
import { I, C, S, U, J, focus, translate, keyboard } from 'Lib';
import ControlButtons from 'Component/page/elements/head/controlButtons';

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
		const object = S.Detail.get(rootId, rootId, [ 'iconImage', 'iconEmoji' ].concat(J.Relation.cover), true);
		const { coverType, coverId } = object;
		const isImage = U.Data.coverIsImage(coverType);
		const root = S.Block.getLeaf(rootId, rootId);
		const cn = [ 'elements', 'editorControlElements' ];

		if (!root) {
			return null;
		};

		let image = null;
		let author = null;
		let elements = null;
		let content = null;

		if (coverType == I.CoverType.Source) {
			image = S.Detail.get(rootId, coverId, [ 'mediaArtistName', 'mediaArtistURL' ], true);
			author = (
				<Label className="author" text={U.Common.sprintf(translate('unsplashString'), `<a href=${image.mediaArtistURL + J.Url.unsplash.utm}>${image.mediaArtistName}</a>`, `<a href=${J.Url.unsplash.site + J.Url.unsplash.utm}>Unsplash</a>`)} />
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
				<>
					<div key="btn-drag" className="btn black drag withIcon">
						<Icon />
						<div className="txt">{translate('blockCoverDrag')}</div>
					</div>
					
					<div className="dragWrap">
						<DragHorizontal 
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
				</>
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

		U.Common.renderLinks($(this.node));
		$(window).off('resize.cover').on('resize.cover', () => this.resize());
	};
	
	componentDidUpdate () {
		this.resize();

		U.Common.renderLinks($(this.node));
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		$(window).off('resize.cover');
	};

	onIcon (e: any) {
		const { rootId, block } = this.props;
		const node = $(this.node);
		const elements = node.find('#elements');
		const object = S.Detail.get(rootId, rootId, []);
		const cb = () => S.Menu.update('smile', { element: `#block-icon-${rootId}` });

		focus.clear(true);

		S.Menu.open('smile', { 
			element: `#block-${block.id} #button-icon`,
			horizontal: I.MenuDirection.Center,
			onOpen: () => elements.addClass('hover'),
			onClose: () => elements.removeClass('hover'),
			data: {
				value: (object.iconEmoji || object.iconImage || ''),
				onSelect: (icon: string) => {
					U.Object.setIcon(rootId, icon, '', cb);
				},
				onUpload (objectId: string) {
					U.Object.setIcon(rootId, '', objectId, cb);
				},
			}
		});
	};
	
	onLayout () {
		const { rootId, block } = this.props;
		const node = $(this.node);
		const elements = node.find('#elements');
		
		S.Menu.open('blockLayout', { 
			element: `#block-${block.id} #button-layout`,
			onOpen: () => elements.addClass('hover'),
			onClose: () => elements.removeClass('hover'),
			subIds: J.Menu.layout,
			data: {
				rootId: rootId,
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
		U.Object.setCover(rootId, item.type, item.id, item.coverX, item.coverY, item.coverScale);
	};
	
	onEdit (e: any) {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);

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
	
	onUpload (type: I.CoverType, objectId: string) {
		const { rootId } = this.props;

		this.coords.x = 0;
		this.coords.y = -0.25;
		this.scale = 0;

		U.Object.setCover(rootId, type, objectId, this.coords.x, this.coords.y, this.scale, () => {
			this.loaded = false;
			this.setLoading(false);
		});
	};
	
	onSave (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);

		U.Object.setCover(rootId, object.coverType, object.coverId, this.coords.x, this.coords.y, this.scale, () => {
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
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);
		const { coverId, coverType } = object;
		const node = $(this.node);
		const isImage = U.Data.coverIsImage(coverType);
		
		if (!isImage || !node.hasClass('wrap')) {
			return;
		};
		
		this.cover = node.find('.cover');
		
		const el = this.cover.get(0);
		if (!el) {
			return;
		};

		const cb = () => {
			const object = S.Detail.get(rootId, rootId, [ 'coverScale' ], true);

			this.rect = (node.get(0) as Element).getBoundingClientRect();
			this.onScaleMove($.Event('resize'), object.coverScale);
			this.cover.css({ opacity: 1 });
			this.refDrag?.setValue(object.coverScale);

			if (!this.loaded) {
				this.setLoading(false);
			};
			this.loaded = true;
		};

		if (this.loaded) {
			cb();
		} else {
			this.cover.css({ opacity: 0 });
			this.setLoading(true);

			el.onload = cb;
			el.onerror = cb;
		};

		if ([ I.CoverType.Upload, I.CoverType.Source ].includes(coverType)) {
			el.src = S.Common.imageUrl(coverId, J.Size.cover);
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
		win.on('mousemove.cover', e => this.onDragMove(e));
		win.on('mouseup.cover', e => this.onDragEnd(e));
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
		const object = S.Detail.get(rootId, rootId, [ 'coverX', 'coverY' ], true);
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

	canDrop (e: any) {
		return this._isMounted && !this.props.readonly && U.File.checkDropFiles(e);
	};
	
	onDragOver (e: any) {
		e.preventDefault();
		e.stopPropagation();

		$(this.node).addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		e.preventDefault();
		e.stopPropagation();

		$(this.node).removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this.canDrop(e)) {
			return;
		};

		const { rootId, readonly } = this.props;

		if (!this._isMounted || !U.File.checkDropFiles(e) || readonly) {
			return;
		};

		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		const node = $(this.node);
		
		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);
		this.setLoading(true);
		
		C.FileUpload(S.Common.space, '', file, I.FileType.Image, {}, (message: any) => {
			this.setLoading(false);
			keyboard.disableCommonDrop(false);
			
			if (!message.error.code) {
				this.loaded = false;
				U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
			};
			
			this.loaded = false;
			U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
		});
	};
	
	setTransform (x: number, y: number) {
		const mx = this.rect.cw - this.rect.width;
		const my = this.rect.ch - this.rect.height;

		x = Math.max(-mx, Math.min(0, x));
		y = Math.max(-my, Math.min(0, y));

		const px = Math.min(0, x / this.rect.cw * 100);
		const py = Math.min(0, y / this.rect.ch * 100);
		const css: any = { transform: `translate3d(${px}%,${py}%,0px)` };

		if (this.rect.ch < this.rect.height) {
			css.transform = 'translate3d(0px,0px,0px)';
			css.height = this.rect.height;
			css.width = 'auto';
		};

		this.cover.css(css);

		return { x, y };
	};
	
	checkPercent (p: number): number {
		return Math.min(1, Math.max(0, p));
	};

});

export default BlockCover;