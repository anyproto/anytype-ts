import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Header, FooterMainEdit as Footer, Loader, Block, Button, IconObject, Deleted, ObjectName } from 'ts/component';
import { I, M, C, Util, crumbs, Action, Renderer } from 'ts/lib';
import { commonStore, blockStore, detailStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

interface State {
	isDeleted: boolean;
};

const $ = require('jquery');
const Errors = require('json/error.json');

const MAX_HEIGHT = 396;

const PageMainMedia = observer(class PageMainMedia extends React.Component<Props, State> {

	_isMounted: boolean = false;
	id: string = '';
	refHeader: any = null;
	loading: boolean = false;

	state = {
		isDeleted: false,
	};

	constructor (props: any) {
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
		const file = blocks.find((it: I.Block) => { return it.isFile(); });
		const relations = blocks.filter((it: I.Block) => { return it.isRelation(); });

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
				content = <Block {...this.props} key={file.id} rootId={rootId} block={file} readonly={true} />;
			} else {
				content = <IconObject object={object} size={96} />;
			};
		};

		return (
			<div>
				<Header component="mainEdit" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

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
										<Block {...this.props} key={item.id} rootId={rootId} block={item} readonly={true} />
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

				<Footer {...this.props} rootId={rootId} />
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
					Util.route('/main/index');
				};
				return;
			};

			crumbs.addRecent(rootId);

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
		const node = $(ReactDOM.findDOMNode(this));
		const img = node.find('img.media');
		const wrap = node.find('.block.blockMedia .wrapContent');

		if (img.length) {
			img.unbind('load').on('load', () => {
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
		const block = blocks.find((it: I.Block) => { return it.isFile(); });
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
		const block = blocks.find((it: I.Block) => { return it.isFile(); });
		const { content } = block;
		
		Renderer.send('download', commonStore.fileUrl(content.hash));
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	resize () {
		const { isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const blocks = node.find('#blocks');
		const empty = node.find('#empty');
		const container = Util.getScrollContainer(isPopup);
		const wh = container.height();

		if (blocks.hasClass('vertical')) {
			blocks.css({ minHeight: wh });
		};

		if (empty.length) {
			empty.css({ lineHeight: (wh - 60) + 'px' });
		};
	};

});

export default PageMainMedia;