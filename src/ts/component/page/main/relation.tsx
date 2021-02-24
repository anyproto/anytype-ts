import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, IconObject, HeaderMainRelation as Header } from 'ts/component';
import { I, C, DataUtil, Util } from 'ts/lib';
import { blockStore, dbStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainRelation extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

	};

	render () {
		const { match } = this.props;
		const rootId = match.params.id;
		const object = blockStore.getDetails(rootId, rootId);

		console.log(object);

		return (
			<div>
				<Header {...this.props} rootId={rootId} />
				<div className="wrapper">
					<div className="head">
						<div className="side left">
							<IconObject size={96} object={object} />
						</div>
						<div className="side right">
							<div className="title">{object.name}</div>
							<div className="descr">{object.description}</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.open();
	};

	open () {
		const { match } = this.props;

		C.BlockOpen(match.params.id, (message: any) => {
			this.forceUpdate();
		});
	};
	
};

export default PageMainRelation;