import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { IconObject, HeaderMainEdit as Header, FooterMainEdit as Footer, Loader, Block, ListObject, Button, Deleted } from 'ts/component';
import { I, M, C, crumbs, Action, Util, DataUtil } from 'ts/lib';
import { detailStore, dbStore, commonStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {
	rootId?: string;
	isPopup?: boolean;
};

interface State {
	isDeleted: boolean;
};

const Errors = require('json/error.json');

const BLOCK_ID_OBJECT = 'dataview';

const PageMainRelation = observer(class PageMainRelation extends React.Component<Props, State> {

	id: string = '';
	refHeader: any = null;
	loading: boolean = false;

	state = {
		isDeleted: false,
	};

	constructor (props: any) {
		super(props);

		this.onCreate = this.onCreate.bind(this);
	};

	render () {
		if (this.state.isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (this.loading) {
			return <Loader id="loader" />;
		};

		const { config } = commonStore;
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'relationFormat' ]);
		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const { total } = dbStore.getMeta(dbStore.getSubId(rootId, BLOCK_ID_OBJECT), '');

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />

				<div className="blocks wrapper">
					<div className="head">
						<div className="side left">
							<IconObject size={96} object={object} />
						</div>
						<div className="side center">
							<div className="txt">
								<div className="title">{object.name}</div>
								<div className="descr">{object.description}</div>

								<Block {...this.props} key={featured.id} rootId={rootId} iconSize={20} block={featured} readonly={true} />
							</div>
						</div>
						{config.experimental ? (
							<div className="side right">
								<Button id="button-create" text="Create set" onClick={this.onCreate} />
							</div>
						) : ''}
					</div>

					<div className="section set">
						<div className="title">{total} {Util.cntWord(total, 'object', 'objects')}</div>
						<div className="content">
							<ListObject rootId={rootId} blockId={BLOCK_ID_OBJECT} />
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
		
		C.BlockOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true });
				} else {
					history.push('/main/index');
				};
				return;
			};

			crumbs.addPage(rootId);
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

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	onCreate () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);

		C.SetCreate([ rootId ], { name: object.name + ' set' }, '', (message: any) => {
			if (!message.error.code) {
				DataUtil.objectOpenPopup({ id: message.id, layout: I.ObjectLayout.Set });
			};
		});
	};

});

export default PageMainRelation;