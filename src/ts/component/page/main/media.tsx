import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Button, IconObject, Deleted, ObjectName } from 'Component';
import { I, M, C, Util, Action, Renderer, ObjectUtil } from 'Lib';
import { blockStore, detailStore } from 'Store';
import Errors from 'json/error.json';

interface State {
	isDeleted: boolean;
};

const MAX_HEIGHT = 396;

const PageMainMedia = observer(class PageMainMedia extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	loading = false;

	state = {
		isDeleted: false,
	};

	constructor (props: I.PageComponent) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onDownload = this.onDownload.bind(this);
	};

	render () {
		const { isDeleted } = this.state;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'heightInPixels' ]);

		if (isDeleted || object.isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (this.loading) {
			return <Loader id="loader" />;
		};

		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
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
				<Header component="mainObject" ref={ref => this.refHeader = ref} {...this.props} rootId={rootId} />

				<div id="blocks" className={cn.join(' ')}>
					{file ? (
						<React.Fragment>
							<div className="side left">
								{content}
							</div>

							<div className="side right">
								<div className="head">
									<ObjectName className="title" object={object} />
									<div className="descr">{object.description}</div>

									<Block {...this.props} key={featured.id} rootId={rootId} iconSize={20} block={featured} />

									<div className="buttons">
										<Button text="Open" color="blank" onClick={this.onOpen} />
										<Button text="Download" color="blank" onClick={this.onDownload} />
									</div>
								</div>

								<div className="section">
									{relations.map((item: any) => (
										<Block {...this.props} key={item.id} rootId={rootId} block={item} readonly={true} isSelectionDisabled={true} />
									))}
								</div>
							</div>
						</React.Fragment>
					) : (
						<div id="empty" className="empty">
							File not found
						</div>
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

		this.id = rootId;
		this.loading = true;
		this.forceUpdate();

		C.ObjectOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true });
				} else {
					ObjectUtil.openHome('route');
				};
				return;
			};

			this.loading = false;
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};
		});
	};

	close () {
		const { isPopup, match } = this.props;
		const rootId = this.getRootId();
		
		let close = true;
		if (isPopup && (match.params.id == rootId)) {
			close = false;
		};

		if (close) {
			Action.pageClose(rootId, true);
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
		const { content } = block;

		C.FileDownload(content.hash, window.Electron.tmpPath, (message: any) => {
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
		const container = Util.getScrollContainer(isPopup);
		const wh = container.height() - 60;

		if (blocks.hasClass('vertical')) {
			blocks.css({ minHeight: wh });
		};

		if (empty.length) {
			empty.css({ lineHeight: wh + 'px' });
		};
	};

});

export default PageMainMedia;