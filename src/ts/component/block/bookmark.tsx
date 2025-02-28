import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, ObjectName, ObjectDescription, Loader, Error, Icon } from 'Component';
import { I, C, S, U, focus, translate, analytics, Action, keyboard, Preview } from 'Lib';

const BlockBookmark = observer(class BlockBookmark extends React.Component<I.BlockComponent> {

	_isMounted = false;
	node: any = null;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { state, targetObjectId } = block.content;
		const object = S.Detail.get(rootId, targetObjectId, [ 'picture' ]);
		const { iconImage, picture, isArchived, isDeleted } = object;
		const url = this.getUrl();
		const cn = [ 'focusable', `c${block.id}`, 'resizable' ];

		let element = null;

		if (isDeleted) {
			element = (
				<div className="deleted">
					<Icon className="ghost" />
					<div className="name">{translate('commonDeletedObject')}</div>
				</div>
			);
		} else {
			switch (state) {
				default:
				case I.BookmarkState.Error:
				case I.BookmarkState.Empty: {
					element = (
						<>
							{state == I.BookmarkState.Error ? <Error text={translate('blockBookmarkError')} /> : ''}
							<InputWithFile 
								block={block} 	
								icon="bookmark" 
								textFile={translate('inputWithFileTextUrl')} 
								withFile={false} 
								onChangeUrl={this.onChangeUrl} 
								readonly={readonly} 
							/>
						</>
					);
					break;
				};
					
				case I.BookmarkState.Fetching: {
					element = <Loader />;
					break;
				};
					
				case I.BookmarkState.Done: {
					const cni = [ 'inner' ];
					const cnl = [ 'side', 'left' ];
					
					let archive = null;
						
					if (picture) {
						cni.push('withImage');
					};

					if (isArchived) {
						cni.push('isArchived');
					};

					if (block.bgColor) {
						cni.push(`bgColor bgColor-${block.bgColor}`);
					};

					if (isArchived) {
						archive = <div className="tagItem isMultiSelect archive">{translate('blockLinkArchived')}</div>;
					};

					element = (
						<a 
							href={url}
							className={cni.join(' ')} 
							onClick={this.onClick} 
							onMouseDown={this.onMouseDown}
							{...U.Common.dataProps({ href: url })}
						>
							<div className={cnl.join(' ')}>
								<div className="link">
									{iconImage ? <img src={S.Common.imageUrl(iconImage, 16)} className="fav" /> : ''}
									{U.Common.shortUrl(url)}
								</div>
								<ObjectName object={object} />
								<ObjectDescription object={object} />

								{archive}
							</div>
							<div className="side right">
								{picture ? <img src={S.Common.imageUrl(picture, 500)} className="img" /> : ''}
							</div>
						</a>
					);
					break;
				};
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')} 
				tabIndex={0} 
				onKeyDown={this.onKeyDown} 
				onKeyUp={this.onKeyUp} 
				onFocus={this.onFocus}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				{element}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.rebind();
	};
	
	componentDidUpdate () {
		this.resize();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};

		this.unbind();
		$(this.node).on('resizeInit resizeMove', e => this.resize());
	};
	
	unbind () {
		if (!this._isMounted) {
			return;
		};
		
		$(this.node).off('resizeInit resizeMove');
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

	getUrl () {
		const { rootId, block } = this.props;
		const { url, targetObjectId } = block.content;
		const object = S.Detail.get(rootId, targetObjectId, [ 'source' ], true);

		return object.source || url;
	};
	
	onClick (e: any) {
		if (e.button) {
			return;
		};

		e.preventDefault();

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if (!(keyboard.withCommand(e) && ids.length)) {
			this.open();
		};
	};

	onMouseEnter (e: React.MouseEvent) {
		const { rootId, block } = this.props;
		const { targetObjectId } = block.content;

		if (!targetObjectId) {
			return;
		};

		const object = S.Detail.get(rootId, targetObjectId, []);
		if (object._empty_ || object.isArchived || object.isDeleted) {
			return;
		};

		Preview.previewShow({ 
			rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 },
			object,
			target: targetObjectId, 
			noUnlink: true,
			noEdit: true,
			passThrough: true,
		});
	};

	onMouseLeave () {
		Preview.previewHide(true);
	};

	onMouseDown (e: any) {
		e.persist();

		if (keyboard.withCommand(e)) {
			return;
		};

		// middle mouse click
		if (e.button == 1) {
			e.preventDefault();
			e.stopPropagation();

			this.open();
		};
	};

	open () {
		Action.openUrl(this.getUrl());
		analytics.event('BlockBookmarkOpenUrl');
	};
	
	onChangeUrl (e: any, url: string) {
		const { rootId, block } = this.props;
		const bookmark = S.Record.getBookmarkType();

		C.BlockBookmarkFetch(rootId, block.id, url, bookmark?.defaultTemplateId);
	};
	
	resize () {
		window.setTimeout(() => {
			if (!this._isMounted) {
				return;
			};

			const { getWrapperWidth } = this.props;
			const node = $(this.node);
			const inner = node.find('.inner');

			inner.toggleClass('isVertical', inner.width() <= getWrapperWidth() / 2);
		});
	};

});

export default BlockBookmark;
