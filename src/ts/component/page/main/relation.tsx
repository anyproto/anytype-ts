import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, IconObject, HeaderMainEdit as Header, Loader } from 'ts/component';
import { I, C, DataUtil, Util, Storage } from 'ts/lib';
import { blockStore, dbStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {
	isPopup?: boolean;
};

@observer
class PageMainRelation extends React.Component<Props, {}> {

	id: string = '';
	refHeader: any = null;
	loading: boolean = false;

	constructor (props: any) {
		super(props);

	};

	render () {
		if (this.loading) {
			return <Loader />;
		};

		const { match, isPopup } = this.props;
		const rootId = match.params.id;
		const object = blockStore.getDetails(rootId, rootId);

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} isPopup={isPopup} />
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

	componentDidUpdate () {
		this.open();
	};

	open () {
		const { match } = this.props;
		const rootId = match.params.id;

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.loading = true;
		this.forceUpdate();

		C.BlockOpen(rootId, (message: any) => {
			this.loading = false;
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};
		});
	};

};

export default PageMainRelation;