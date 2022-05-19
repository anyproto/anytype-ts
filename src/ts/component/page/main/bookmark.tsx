import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Header, FooterMainEdit as Footer, Loader, Block, Button, Deleted, ObjectName } from 'ts/component';
import { I, M, C, Util, crumbs, Action } from 'ts/lib';
import { blockStore, detailStore } from 'ts/store';

import HeadSimple from 'ts/component/page/head/simple';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

interface State {
	isDeleted: boolean;
};

const Errors = require('json/error.json');

const PageMainBookmark = observer(class PageMainBookmark extends React.Component<Props, State> {

	_isMounted: boolean = false;
	id: string = '';
	refHeader: any = null;
	refHead: any = null;
	loading: boolean = false;

	state = {
		isDeleted: false,
	};

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { isDeleted } = this.state;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'heightInPixels' ]);

		if (isDeleted || object.isDeleted) {
			return <Deleted {...this.props} />;
		};
		if (this.loading) {
			return <Loader id="loader" />;
		};
		
		const blocks = blockStore.getBlocks(rootId, it => it.isRelation());

		return (
			<div>
				<Header component="mainEdit" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

				<div id="blocks" className="blocks wrapper">
					<HeadSimple ref={(ref: any) => { this.refHead = ref;}} type="bookmark" rootId={rootId} />

					<div className="buttons">
						<Button text="Open link" color="blank" onClick={this.onOpen} />
					</div>

					<div className="section">
						{blocks.map((item: any) => (
							<Block {...this.props} key={item.id} rootId={rootId} block={item} readonly={true} />
						))}
					</div>
				</div>

				<Footer {...this.props} rootId={rootId} />
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
	};

	componentWillUnmount () {
		this._isMounted = false;
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

			crumbs.addPage(rootId);
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

	onOpen (e: any) {
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	resize () {
	};

});

export default PageMainBookmark;