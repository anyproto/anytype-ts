import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Button, IconObject, Deleted } from 'Component';
import { I, C, S, M, U, Action, translate, Relation } from 'Lib';
import HeadSimple from 'Component/page/elements/head/simple';

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
		const { config } = S.Common;
		const { isLoading, isDeleted } = this.state;
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, [ 'widthInPixels', 'heightInPixels' ]);
		const allowed = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const type = S.Record.getTypeById(object.type);
		const recommended = Relation.getArrayValue(type?.recommendedRelations);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (isLoading) {
			return <Loader id="loader" />;
		};

		const file = this.getBlock();
		if (!file) {
			return null;
		};

		const relations = S.Record.getObjectRelations(rootId, rootId).filter(it => {
			if (!it) {
				return false;
			};

			if (!recommended.includes(it.id) || (it.relationKey == 'description')) {
				return false;
			};

			return !config.debug.hiddenObject ? !it.isHidden : true;
		}).sort((c1, c2) => U.Data.sortByFormat(c1, c2));

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
											block={new M.Block({ id: item.id, type: I.BlockType.Relation, content: { key: item.relationKey } })} 
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

		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
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

	getBlock (): I.Block {
		const rootId = this.getRootId();
		const blocks = S.Block.getBlocks(rootId);

		return blocks.find(it => it.isFile());
	};

	onOpen () {
		Action.openFile(this.getBlock()?.content?.targetObjectId);
	};

	onDownload () {
		Action.download(this.getBlock(), 'media');
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
		const container = U.Common.getScrollContainer(isPopup);
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
