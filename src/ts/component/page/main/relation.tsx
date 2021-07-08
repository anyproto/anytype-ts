import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { IconObject, HeaderMainEdit as Header, FooterMainEdit as Footer, Loader, Block } from 'ts/component';
import { I, M, C, crumbs, Action } from 'ts/lib';
import { detailStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {
	rootId?: string;
	isPopup?: boolean;
}

const PageMainRelation = observer(class PageMainRelation extends React.Component<Props, {}> {

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

		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'relationFormat' ]);
		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />

				<div className="blocks wrapper">
					<div className="head">
						<div className="side left">
							<IconObject size={96} object={object} />
						</div>
						<div className="side right">
							<div className="title">{object.name}</div>
							<div className="descr">{object.description}</div>

							<Block {...this.props} key={featured.id} rootId={rootId} iconSize={20} block={featured} readonly={true} />
						</div>
					</div>
				</div>

				<Footer {...this.props} rootId={rootId} />
			</div>
		);
	};

	componentDidMount () {
		this.open();
	};

	componentDidUpdate () {
		this.open();
	};

	componentWillUnmount () {
		this.close();
	};


	open () {
		const { history } = this.props;
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.loading = true;
		this.forceUpdate();
		
		crumbs.addPage(rootId);
		crumbs.addRecent(rootId);

		C.BlockOpen(rootId, (message: any) => {
			if (message.error.code) {
				history.push('/main/index');
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

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

});

export default PageMainRelation;