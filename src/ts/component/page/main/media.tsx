import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Button, Icon, IconObject, Deleted, HeadSimple } from 'Component';
import { I, C, S, M, U, Action, translate, Relation, analytics, sidebar, keyboard } from 'Lib';

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
		
		this.onDownload = this.onDownload.bind(this);
		this.onRelationAdd = this.onRelationAdd.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const { isLoading, isDeleted } = this.state;
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, [ 'widthInPixels', 'heightInPixels' ]);
		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowedRelation = false; //S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const type = S.Record.getTypeById(object.type);
		const showSidebar = S.Common.getShowSidebarRight(isPopup);

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

		if (isVideo || isImage || isAudio || isPdf) {
			if (showSidebar || isVideo || isAudio || (object.widthInPixels > object.heightInPixels)) {
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

		if (showSidebar) {
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
						{...this.props} 
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
			<div ref={node => this.node = node}>
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
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
										{...this.props} 
										ref={ref => this.refHead = ref} 
										placeholder={translate('defaultNamePage')} 
										rootId={rootId} 
										isContextMenuDisabled={true}
										noIcon={true}
									/>

									<div className="buttons">
										<Button text={translate('commonDownload')} color="blank" className="c36" onClick={this.onDownload} />
									</div>
								</div>

								<div className="section">
									<div className="title">{translate('commonFileInfo')}</div>

									{relations.map((item: any) => (
										<Block 
											{...this.props} 
											key={item.id} 
											rootId={rootId} 
											block={new M.Block({ id: item.id, type: I.BlockType.Relation, content: { key: item.relationKey } })} 
											readonly={!allowedDetails} 
											isSelectionDisabled={true}
											isContextMenuDisabled={true}
										/>
									))}

									{allowedRelation ? (
										<div id="item-add" className="item add" onClick={this.onRelationAdd}>
											<Icon className="plus" />
											<div className="name">{translate('commonAddRelation')}</div>
										</div>
									) : ''}
								</div>
							</div>
						</>
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
		const { isPopup } = this.props;
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
			sidebar.rightPanelSetState(isPopup, { rootId });
			this.setState({ isLoading: false });
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup } = this.props;
		const close = !isPopup || (this.getRootId() == this.id);

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

	onDownload () {
		const block = this.getBlock();
		if (block) {
			Action.downloadFile(block.getTargetObjectId(), analytics.route.media, block.isFileImage());
		};
	};

	onRelationAdd (e: any) {
		const { isPopup } = this.props;
		const container = U.Common.getPageContainer(isPopup);
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, []);
		const type = S.Record.getTypeById(object.type);

		S.Menu.open('relationSuggest', { 
			element: container.find('#item-add'),
			offsetX: 32,
			data: {
				filter: '',
				rootId,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipKeys: S.Record.getObjectRelations(rootId, object.type).map(it => it.relationKey),
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					if (type && !type.recommendedRelations.includes(relation.relationKey)) {
						C.ObjectTypeRelationAdd(type.id, [ relation.relationKey ]);
					};

					C.ObjectRelationAdd(rootId, [ relation.relationKey ], onChange);
				},
			}
		});
	};

	getRootId () {
		return keyboard.getRootId(this.props.isPopup);
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
