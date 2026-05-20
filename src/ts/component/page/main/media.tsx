import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Header, Footer, Loader, Block, Button, IconObject, Deleted, HeadSimple } from 'Component';
import * as I from 'Interface';
import * as M from 'Model';

const MAX_HEIGHT = 396;

const PageMainMedia = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ isDeleted, setIsDeleted ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const rootId = keyboard.getRootId(isPopup);
	const object = S.Detail.get(rootId, rootId, [ 'widthInPixels', 'heightInPixels' ]);
	const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
	const type = S.Record.getTypeById(object.type);
	const nodeRef = useRef(null);
	const headerRef = useRef(null);
	const headRef = useRef(null);
	const idRef = useRef('');

	useEffect(() => {
		open();
		resize();
		rebind();

		return () => {
			close();
		};
	}, []);

	useEffect(() => {
		if (idRef.current != rootId) {
			close();
			open();
		};
		resize();
	}, [ rootId ]);

	const open = () => {
		idRef.current = rootId;
		setIsDeleted(false);
		setIsLoading(true);

		C.ObjectOpen(rootId, '', S.Common.space, (message: any) => {
			setIsLoading(false);

			if (!U.Common.checkErrorOnOpen(rootId, message.error.code)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
			if (object.isDeleted) {
				setIsDeleted(true);
				return;
			};

			headerRef.current?.forceUpdate();
			headRef.current?.forceUpdate();
			S.Common.setRightSidebarState(isPopup, { rootId });
			setDummy(dummy + 1);
		});
	};

	const close = () => {
		Action.pageClose(isPopup, idRef.current, true);
		idRef.current = '';
	};

	const rebind = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const img = U.Dom.select('img.media', node) as HTMLImageElement;
		const wrap = U.Dom.select('.block.blockMedia .wrapContent', node);

		if (!img) {
			return;
		};

		const onLoad = () => {
			const w = img.naturalWidth;
			const h = img.naturalHeight;

			let wh = wrap?.clientHeight ?? 0;
			if (wh < MAX_HEIGHT) {
				wh = MAX_HEIGHT;
				U.Dom.css(wrap, { height: `${MAX_HEIGHT}px` });
			};

			if (h < wh) {
				U.Dom.css(img, {
					position: 'absolute',
					left: '50%',
					top: '50%',
					width: `${w}px`,
					height: `${h}px`,
					transform: 'translate3d(-50%, -50%, 0px)',
				});
			};
		};

		U.Dom.removeEvent(img, 'load', onLoad);
		U.Dom.addEvent(img, 'load', onLoad);
	};

	const getBlock = (): I.Block => {
		const blocks = S.Block.getBlocks(rootId, it => it.isFile());
		return blocks.length ? blocks[0] : null;
	};

	const onDownload = () => {
		const block = getBlock();
		if (block) {
			const targetObjectId = block.getTargetObjectId();

			if (S.Common.isDownloading(targetObjectId)) {
				return;
			};

			Action.downloadFile(targetObjectId, analytics.route.media, block.isFileImage());
		};
	};

	const resize = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const blocks = U.Dom.select('#blocks', node);
		const empty = U.Dom.select('#empty', node);
		const inner = U.Dom.select('.side.left #inner', node);
		const container = U.Dom.getScrollContainer(isPopup);
		const wh = (container?.clientHeight ?? 0) - 182;

		if (U.Dom.hasClass(blocks, 'vertical')) {
			U.Dom.css(inner, { minHeight: `${wh}px` });
		};

		if (empty) {
			U.Dom.css(empty, { lineHeight: `${wh}px` });
		};
	};

	if (isDeleted) {
		return <Deleted {...props} />;
	};

	if (isLoading) {
		return <Loader id="loader" />;
	};

	const file = getBlock();
	if (!file) {
		return null;
	};

	let relations = Relation.getArrayValue(type?.recommendedFileRelations).
		map(it => S.Record.getRelationById(it));

	relations.unshift(S.Record.getRelationByKey('description'));
	relations = relations.filter(it => it);
	relations = S.Record.checkHiddenObjects(relations);

	const isVideo = file?.isFileVideo();
	const isImage = file?.isFileImage();
	const isAudio = file?.isFileAudio();
	const isPdf = file?.isFilePdf();
	const cn = [ 'blocks' ];
	const data = sidebar.getData(I.SidebarPanel.Right, isPopup);

	if (isVideo || isImage || isAudio || isPdf) {
		if (!data.isClosed || isVideo || isAudio || (object.widthInPixels > object.heightInPixels)) {
			cn.push('horizontal');
		} else {
			cn.push('vertical');
		};
		if (isVideo) {
			cn.push('isVideo');
		};
		if (isImage) {
			cn.push('isImage');
		};
		if (isAudio) {
			cn.push('isAudio');
		};
		if (isPdf) {
			cn.push('isPdf');
		};
	} else {
		cn.push('horizontal');
	};

	if (!data.isClosed) {
		cn.push('withSidebar');
	};

	if (file) {
		file.hAlign = I.BlockHAlign.Center;
	};

	let content = null;

	if (file) {
		if (isVideo || isImage || isAudio || isPdf) {
			content = (
				<Block 
					{...props} 
					key={file.id} 
					rootId={rootId} 
					block={file} 
					readonly={true} 
					isSelectionDisabled={true} 
				/>
			);
			cn.push('withContent');
		} else {
			content = <IconObject object={object} size={160} />;
		};
	};

	return (
		<div ref={nodeRef}>
			<Header 
				{...props} 
				component="mainObject" 
				ref={headerRef} 
				rootId={rootId} 
			/>

			<div id="blocks" className={cn.join(' ')}>
				{file ? (
					<>
						<div className="side left">
							<div id="inner" className="inner">
								{content}
							</div>
						</div>

						<div className="side right">
							<div className="head">
								<HeadSimple 
									{...props} 
									ref={headRef} 
									placeholder={translate('defaultNamePage')} 
									rootId={rootId} 
									isContextMenuDisabled={true}
									noIcon={true}
								/>

								<div className="buttons">
									<Button
										text={S.Common.isDownloading(file.getTargetObjectId()) ? translate('commonDownloading') : translate('commonDownload')}
										icon={S.Common.isDownloading(file.getTargetObjectId()) ? 'downloading' : ''}
										color="blank"
										className={[ 'c36', (S.Common.isDownloading(file.getTargetObjectId()) ? 'disabled' : '') ].join(' ')}
										onClick={onDownload}
									/>
								</div>
							</div>

							<div className="section">
								<div className="title">{translate('commonFileInfo')}</div>

								{relations.map((item: any) => (
									<Block 
										{...props} 
										key={item.id} 
										rootId={rootId} 
										block={new M.Block({ id: item.id, type: I.BlockType.Relation, content: { key: item.relationKey } })} 
										readonly={!allowedDetails} 
										isSelectionDisabled={true}
										isContextMenuDisabled={true}
									/>
								))}
							</div>
						</div>
					</>
				) : (
					<div id="empty" className="empty">{translate('pageMainMediaNotFound')}</div>
				)}
			</div>

			<Footer component="mainObject" {...props} />
		</div>
	);

});

export default PageMainMedia;