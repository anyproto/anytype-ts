import * as React from 'react';
import { Loader, IconObject, Cover, Icon } from 'ts/component';
import { commonStore, detailStore, blockStore } from 'ts/store';
import { I, C, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	onClick?: (e: any) => void;
};

interface State {
	loading: boolean;
};

const Constant = require('json/constant.json');
const Colors = [ 'yellow', 'red', 'ice', 'lime' ];

const GraphPreview = observer(class ObjectPreviewBlock extends React.Component<Props, State> {
	
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
		const { rootId } = this.props;
		const check = DataUtil.checkDetails(rootId);
		const object = check.object;
		const { name, description, coverType, coverId, coverX, coverY, coverScale } = object;
		const author = detailStore.get(rootId, object.creator, []);
		const isTask = object.layout == I.ObjectLayout.Task;
		const cn = [ 'preview' , check.className, ];

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
							<div className="name">{name}</div>
							<div className="description">{description}</div>
							<div className="author">{author.name}</div>
						</div>
					</React.Fragment>
				)}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
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

		C.BlockShow(rootId, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			this.setState({ loading: false });
		});
	};

});

export default GraphPreview;