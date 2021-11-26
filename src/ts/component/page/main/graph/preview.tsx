import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Loader, IconObject, Cover, Icon, Block, Button } from 'ts/component';
import { detailStore } from 'ts/store';
import { I, C, M, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	onClick?: (e: any) => void;
	onClose?: (e: any) => void;
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
	};
	
	render () {
		const { loading } = this.state;
		const { rootId, onClose } = this.props;
		const contextId = this.getRootId();
		const check = DataUtil.checkDetails(contextId, rootId);
		const object = check.object;
		const { layout, fileExt, description, snippet, coverType, coverId, coverX, coverY, coverScale } = object;
		const author = detailStore.get(contextId, object.creator, []);
		const isTask = object.layout == I.ObjectLayout.Task;
		const cn = [ 'panelPreview', 'blocks', check.className, ];
		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });

		let name = object.name;
		if ([ I.ObjectLayout.File, I.ObjectLayout.Image ].indexOf(layout) >= 0) {
			name += '.' + fileExt;
		};

		return (
			<div className={cn.join(' ')}>
				{loading ? <Loader /> : (
					<React.Fragment>
						{coverType && coverId ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
						<div className="heading">
							{isTask ? (
								<Icon className={[ 'checkbox', (object.done ? 'active' : '') ].join(' ')} />
							) : (
								<IconObject size={48} iconSize={32} object={object} />
							)}

							{layout == I.ObjectLayout.Note ? (
								<div className="description">{name}</div>
							) : (
								<React.Fragment>
									<div className="title">{name}</div>
									<div className="description">{description || snippet}</div>
								</React.Fragment>
							)}
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

		C.BlockShow(rootId, TRACE, (message: any) => {
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

});

export default GraphPreview;