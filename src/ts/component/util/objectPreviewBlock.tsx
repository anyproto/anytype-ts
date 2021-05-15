import * as React from 'react';
import { Loader, IconObject, Cover } from 'ts/component';
import { detailStore, blockStore } from 'ts/store';
import { I, C } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
};
interface State {
	loading: boolean;
};

@observer
class ObjectPreviewBlock extends React.Component<Props, State> {
	
	state = {
		loading: false,
	};
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { loading } = this.state;
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId);
		const { name, description, coverType, coverId, coverX, coverY, coverScale } = object;
		const author = detailStore.get(rootId, object.creator, []);
		const children = blockStore.getChildren(rootId, rootId, (it: I.Block) => {
			return !it.isLayoutHeader();
		});

		console.log(children);

		let content = null;
		if (loading) {
			content = <Loader />;
		} else {
			content = (
				<React.Fragment>
					{coverType && coverId ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
					<div className="heading">
						<IconObject size={40} object={object} />
						<div className="name">{name}</div>
						<div className="description">{description}</div>
						<div className="author">{author.name}</div>
					</div>
				</React.Fragment>
			);
		};
		
		return (
			<div className={[ 'objectPreviewBlock' , 'align' + object.layoutAlign ].join(' ')}>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this.open();
	};
	
	open () {
		const { rootId } = this.props;

		this.setState({ loading: true });

		C.BlockOpen(rootId, (message: any) => {
			if (message.error.code) {
				return;
			};

			this.setState({ loading: false });
		});
	};	

};

export default ObjectPreviewBlock;