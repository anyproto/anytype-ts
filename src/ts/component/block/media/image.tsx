import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, Loader, Icon, Error } from 'Component';
import { I, C, S, J, translate, focus, Action, keyboard, analytics } from 'Lib';

const BlockImage = observer(class BlockImage extends React.Component<I.BlockComponent> {

	_isMounted = false;
	node: any = null;
	
	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onLoad = this.onLoad.bind(this);
		this.onDownload = this.onDownload.bind(this);
		this.onError = this.onError.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { width } = block.fields || {};
		const { state, targetObjectId } = block.content;
		const object = S.Detail.get(rootId, targetObjectId, []);
		const css: any = {};
		
		if (width) {
			css.width = (width * 100) + '%';
		};
		
		let element = null;
		if (object.isDeleted) {
			element = (
				<div className="deleted">
					<Icon className="ghost" />
					<div className="name">{translate('commonDeletedObject')}</div>
				</div>
			);
		} else {
			switch (state) {
				default:
				case I.FileState.Empty: {
					element = (
						<>
							{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
							<InputWithFile 
								block={block} 
								icon="image" 
								textFile={translate('blockImageUpload')} 
								accept={J.Constant.fileExtension.image} 
								onChangeUrl={this.onChangeUrl} 
								onChangeFile={this.onChangeFile} 
								readonly={readonly} 
							/>
						</>
					);
					break;
				};
					
				case I.FileState.Uploading: {
					element = <Loader />;
					break;
				};
					
				case I.FileState.Done: {
					element = (
						<div id="wrap" className="wrap" style={css}>
							<img 
								className="mediaImage" 
								src={S.Common.imageUrl(targetObjectId, J.Size.image)} 
								onDragStart={e => e.preventDefault()} 
								onClick={this.onClick} 
								onLoad={this.onLoad} 
								onError={this.onError} 
							/>
							<Icon className="download" onClick={this.onDownload} />
							<Icon className="resize" onMouseDown={e => this.onResizeStart(e, false)} />
						</div>
					);
					break;
				};
			};
		};
		
		return (
			<div 
				ref={node => this.node = node} 
				className={[ 'focusable', 'c' + block.id ].join(' ')} 
				tabIndex={0} 
				onKeyDown={this.onKeyDown} 
				onKeyUp={this.onKeyUp} 
				onFocus={this.onFocus}
			>
				{element}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onKeyDown (e: any) {
		const { onKeyDown } = this.props;
		
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onFocus () {
		focus.set(this.props.block.id, { from: 0, to: 0 });
	};
	
	onChangeUrl (e: any, url: string) {
		const { rootId, block } = this.props;
		const { id } = block;
		
		Action.upload(I.FileType.Image, rootId, id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { rootId, block } = this.props;
		const { id } = block;
		
		Action.upload(I.FileType.Image, rootId, id, '', path);
	};
	
	onResizeStart (e: any, checkMax: boolean) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!this._isMounted) {
			return;
		};
		
		const { block } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const node = $(this.node);
		
		focus.set(block.id, { from: 0, to: 0 });
		win.off('mousemove.media mouseup.media');
		
		selection?.hide();

		keyboard.disableSelection(true);		
		node.addClass('isResizing');
		win.on('mousemove.media', e => this.onResize(e, checkMax));
		win.on('mouseup.media', e => this.onResizeEnd(e, checkMax));
	};
	
	onResize (e: any, checkMax: boolean) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		const wrap = node.find('#wrap');
		
		if (!wrap.length) {
			return;
		};
		
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = this.getWidth(checkMax, e.pageX - rect.x + 20);
		
		wrap.css({ width: (w * 100) + '%' });
	};
	
	onResizeEnd (e: any, checkMax: boolean) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, block } = this.props;
		const { id } = block;
		const node = $(this.node);
		const wrap = node.find('#wrap');
		
		if (!wrap.length) {
			return;
		};
		
		const win = $(window);
		const ox = wrap.offset().left;
		const w = this.getWidth(checkMax, e.pageX - ox + 20);
		
		win.off('mousemove.media mouseup.media');
		node.removeClass('isResizing');
		keyboard.disableSelection(false);
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: w } },
		]);
	};

	onLoad () {
		$(window).trigger('resize');
	};

	onError () {
		const node = $(this.node);
		const wrap = node.find('#wrap');

		wrap.addClass('brokenMedia');
	};
	
	onClick (e: any) {
		if (keyboard.withCommand(e)) {
			return;
		};

		const { rootId, block } = this.props;
		const blocks = S.Block.getBlocks(rootId, (it: I.Block) => it.isFileImage() || it.isFileVideo());
		const targetId = block.getTargetObjectId();
		const gallery = [];

		blocks.forEach(it => {
			const target = it.getTargetObjectId();
			const type = it.isFileImage() ? I.FileType.Image : I.FileType.Video;
			const object = S.Detail.get(rootId, target, []);

			if (object._empty_ || object.isDeleted) {
				return;
			};

			let src = '';

			switch (object.layout) {
				case I.ObjectLayout.Image: {
					src = S.Common.imageUrl(target, J.Size.image);
					break;
				};

				case I.ObjectLayout.Video: {
					src = S.Common.fileUrl(target);
					break;
				};
			};

			gallery.push({ object, src, type });
		});

		S.Popup.open('preview', { 
			data: {
				initialIdx: gallery.findIndex(it => it.object.id == targetId),
				gallery,
			},
		});
	};

	onDownload () {
		const { block } = this.props;

		Action.downloadFile(block.getTargetObjectId(), analytics.route.block, block.isFileImage());
	};
	
	getWidth (checkMax: boolean, v: number): number {
		const { block } = this.props;
		const { id, fields } = block;
		const el = $(`#selectionTarget-${id}`);
		const width = Number(fields.width) || 1;
		
		if (!el.length) {
			return width;
		};
		
		const ew = el.width();
		const w = Math.min(ew, Math.max(60, checkMax ? width * ew : v));
		
		return Math.min(1, Math.max(0, w / ew));
	};
	
});

export default BlockImage;
