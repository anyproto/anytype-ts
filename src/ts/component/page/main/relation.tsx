import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { IconObject, Header, FooterMainEdit as Footer, Loader, Block, ListObject, Button, Deleted } from 'Component';
import { I, M, C, crumbs, Action, Util, DataUtil } from 'Lib';
import { detailStore, dbStore, commonStore } from 'Store';

import HeadSimple from 'Component/page/head/simple';

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
	refHead: any = null;
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

		const rootId = this.getRootId();
		const { total } = dbStore.getMeta(dbStore.getSubId(rootId, BLOCK_ID_OBJECT), '');

		return (
			<div>
				<Header component="mainEdit" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

				<div className="blocks wrapper">
					<HeadSimple ref={(ref: any) => { this.refHead = ref;}} type="relation" rootId={rootId} onCreate={this.onCreate} />

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
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.loading = true;
		this.forceUpdate();
		
		C.ObjectOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true });
				} else {
					Util.route('/main/index');
				};
				return;
			};

			crumbs.addRecent(rootId);

			this.loading = false;
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};
			if (this.refHead) {
				this.refHead.forceUpdate();
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

		C.ObjectCreateSet([ rootId ], { name: object.name + ' set' }, '', (message: any) => {
			if (!message.error.code) {
				DataUtil.objectOpenPopup({ id: message.id, layout: I.ObjectLayout.Set });
			};
		});
	};

});

export default PageMainRelation;