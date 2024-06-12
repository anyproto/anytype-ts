import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Button, IconObject, Deleted } from 'Component';
import { I, C, UtilCommon, Action, Renderer, UtilSpace, translate, UtilRouter } from 'Lib';
import { blockStore, detailStore } from 'Store';
import HeadSimple from 'Component/page/elements/head/simple';
const Errors = require('json/error.json');

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const MAX_HEIGHT = 396;

const PageMainMedia = observer(class PageMainMedia extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node = null;
	refHeader = null;
	refHead = null;
	id = '';

	state = {
		isLoading: false,
		isDeleted: false,
	};

	constructor (props: I.PageComponent) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onDownload = this.onDownload.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'widthInPixels', 'heightInPixels' ]);
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (isLoading) {
			return <Loader id="loader" />;
		};

		const blocks = blockStore.getBlocks(rootId);
		const file = blocks.find(it => it.isFile());
		const relations = blocks.filter(it => it.isRelation());

		const isVideo = file?.isFileVideo();
		const isImage = file?.isFileImage();
		const isAudio = file?.isFileAudio();
		const isPdf = file?.isFilePdf();
		const cn = [ 'blocks' ];

		if (isVideo || isImage || isAudio) {
			if (isVideo || isAudio || (object.widthInPixels > object.heightInPixels)) {
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
		} else {
			cn.push('vertical');
		};

		if (file) {
			file.hAlign = I.BlockHAlign.Center;
		};

		let content = null;

		if (file) {
			if (isVideo || isImage || isAudio || isPdf) {
				content = (
					<Block 
						{...this.props} 
						key={file.id} 
						rootId={rootId} 
						block={file} 
						readonly={true} 
						isSelectionDisabled={true} 
					/>
				);
			} else {
				content = <IconObject object={object} size={96} />;
			};
		};

		return (
			<div ref={node => this.node = node}>
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={rootId} 
				/>

				<div id="blocks" className={cn.join(' ')}>
					{file ? (
						<React.Fragment>
							<div className="side left">
								<div id="inner" className="inner">
									{content}
								</div>
							</div>

							<div className="side right">
								<div className="head">
									<HeadSimple 
										{...this.props} 
										ref={ref => this.refHead = ref} 
										placeholder={translate('defaultNamePage')} 
										rootId={rootId} 
										isContextMenuDisabled={true}
									/>

									<div className="buttons">
										<Button text={translate('commonOpen')} color="blank" onClick={this.onOpen} />
										<Button text={translate('commonDownload')} color="blank" onClick={this.onDownload} />
									</div>
								</div>

								<div className="section">
									{relations.map((item: any) => (
										<Block 
											{...this.props} 
											key={item.id} 
											rootId={rootId} 
											block={item} 
											readonly={!allowed} 
											isSelectionDisabled={true} 
											isContextMenuDisabled={true}
										/>
									))}
								</div>
							</div>
						</React.Fragment>
					) : (
						<div id="empty" className="empty">{translate('pageMainMediaNotFound')}</div>
					)}
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
		this.resize();
	};

	componentDidUpdate () {
		this.open();
		this.resize();
		this.rebind();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();
	};

	open () {
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.close();
		this.id = rootId;
		this.setState({ isLoading: true});

		C.ObjectOpen(rootId, '', UtilRouter.getRouteSpaceId(), (message: any) => {
			if (!UtilCommon.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();
			this.setState({ isLoading: false });
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup, match } = this.props;
		
		let close = true;
		if (isPopup && (match.params.id == this.id)) {
			close = false;
		};

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	rebind () {
		const node = $(this.node);
		const img = node.find('img.media');
		const wrap = node.find('.block.blockMedia .wrapContent');

		if (img.length) {
			img.off('load').on('load', () => {
				const w = img.width();
				const h = img.height();

				let wh = wrap.height();
				if (wh < MAX_HEIGHT) {
					wh = MAX_HEIGHT;
					wrap.css({ height: MAX_HEIGHT });
				};

				if (h < wh) {
					img.css({ 
						position: 'absolute',
						left: '50%',
						top: '50%',
						width: w, 
						height: h,
						transform: 'translate3d(-50%, -50%, 0px)',
					});
				};
			});
		};
	};

	onOpen (e: any) {
		const rootId = this.getRootId();
		const blocks = blockStore.getBlocks(rootId);
		const block = blocks.find(it => it.isFile());

		if (!block) {
			return;
		};

		C.FileDownload(block.content.targetObjectId, UtilCommon.getElectron().tmpPath, (message: any) => {
			if (message.path) {
				Renderer.send('pathOpen', message.path);
			};
		});
	};

	onDownload (e: any) {
		const rootId = this.getRootId();
		const blocks = blockStore.getBlocks(rootId);
		const block = blocks.find(it => it.isFile());
		
		Action.download(block, 'media');
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	resize () {
		const { isPopup } = this.props;
		const node = $(this.node);
		const blocks = node.find('#blocks');
		const empty = node.find('#empty');
		const inner = node.find('.side.left #inner');
		const container = UtilCommon.getScrollContainer(isPopup);
		const wh = container.height() - 182;

		if (blocks.hasClass('vertical')) {
			inner.css({ minHeight: wh });
		};

		if (empty.length) {
			empty.css({ lineHeight: wh + 'px' });
		};
	};

});

export default PageMainMedia;
