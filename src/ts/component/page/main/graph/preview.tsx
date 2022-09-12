import * as React from 'react';
import { Loader, IconObject, Cover, Icon, Block, Button, ObjectName, ObjectDescription } from 'Component';
import { I, C, M, DataUtil } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageComponent {
	rootId: string;
	onClick?: (e: any) => void;
	onClose?: (e: any) => void;
	onContextMenu?: (id: string, param: any) => void;
	setState?: (state: any) => void;
};

interface State {
	loading: boolean;
};

const TRACE = 'preview';

const GraphPreview = observer(class PreviewObject extends React.Component<Props, State> {
	
	state = {
		loading: false,
	};
	isOpen: boolean = false;
	_isMounted: boolean = false;
	id: string = '';

	constructor (props: any) {
		super(props);

		this.onMore = this.onMore.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const { rootId, onClose } = this.props;
		const contextId = this.getRootId();
		const check = DataUtil.checkDetails(contextId, rootId);
		const object = check.object;
		const { layout, fileExt, description, snippet, coverType, coverId, coverX, coverY, coverScale } = object;
		const isTask = object.layout == I.ObjectLayout.Task;
		const isBookmark = object.layout == I.ObjectLayout.Bookmark;
		const cn = [ 'panelPreview', 'blocks', check.className, ];
		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });

		let icon = null;
		let title = null;
		let descr = null;

		if (isTask || isBookmark) {
			icon = <IconObject size={24} object={object} />;
		} else {
			icon = <IconObject size={48} iconSize={32} object={object} />;
		};

		if (layout == I.ObjectLayout.Note) {
			title = <ObjectName object={object} className="description" />;
		} else {
			title = (
				<div className="titleWrap">
					{icon}
					<ObjectName object={object} className="title" />
				</div>
			);
			descr = <ObjectDescription object={object} className="description" />;
		};

		return (
			<div className={cn.join(' ')}>
				{loading ? <Loader /> : (
					<React.Fragment>
						{coverType && coverId ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={false} /> : ''}
						<Icon id="button-graph-more" className="more" onClick={this.onMore} />

						<div className="heading">
							{title}
							{descr}
							<Block {...this.props} key={featured.id} rootId={contextId} traceId={TRACE} iconSize={20} block={featured} readonly={true} />
						</div>
						<div className="buttons">
							<Button text="Open" onClick={(e: any) => { DataUtil.objectOpenPopup(object); }} />
							<Button text="Cancel" color="blank" onClick={onClose} />
						</div>
					</React.Fragment>
				)}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
	};

	componentDidUpdate () {
		this.open();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	open () {
		const { loading } = this.state;
		const { rootId } = this.props;

		if (!this._isMounted || loading || (this.id == rootId)) {
			return;
		};

		this.id = rootId;
		this.setState({ loading: true });

		C.ObjectShow(rootId, TRACE, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			this.setState({ loading: false });
			this.forceUpdate();
		});
	};

	getRootId () {
		const { rootId } = this.props;
		return [ rootId, TRACE ].join('-');
	};

	onMore (e: any) {
		const { onContextMenu, rootId } = this.props;

		onContextMenu(rootId, { element: '#button-graph-more' });
	};

});

export default GraphPreview;