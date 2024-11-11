import * as React from 'react';
import { observer } from 'mobx-react';
import { Action, C, I, S, translate, U } from 'Lib';
import { Header, Footer, ListObject, Button } from 'Component';
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
	relationKeyWithCounterList: { relationKey: string, counter: number }[];
};

const PageMainDate = observer(class PageMainDate extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;

	state = {
		isLoading: false,
		isDeleted: false,
		relationKeyWithCounterList: [],
	};

	render () {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, [ 'backlinks' ]);

		const subId = this.getSubId();
		const total = S.Record.getMeta(subId, '').total;

		const filters: I.Filter[] = [ { relationKey: 'id', condition: I.FilterCondition.In, value: object.backlinks || [] } ];

		const columns: any[] = [
			{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
			{ relationKey: 'creator', name: translate('commonOwner'), isObject: true },
		];

		return (
			<div ref={node => this.node = node}>
				<Header
					{...this.props}
					component="mainObject"
					ref={ref => this.refHeader = ref}
					rootId={rootId}
				/>
				
				{
					this.state.relationKeyWithCounterList.map(({ relationKey, counter }, ndx) => {
						console.log('RelationKey:', relationKey, 'Counter:', counter);
						return (
							<Button
								key={ndx}
								color="blank"
								text={translate(relationKey)}
								className="button"
								onClick={() => {
									// Action.pageOpen(rootId, relationKey);
								}}
							/>
						);
					})
				}

				<div className="blocks wrapper">
					<HeadSimple
						{...this.props}
						ref={ref => this.refHead = ref}
						placeholder={translate('defaultNameTag')}
						rootId={rootId}
						isContextMenuDisabled={true}
						noIcon={true}
						withColorPicker={false}
					/>

					{!object._empty_ ? (
						<div className="section set">
							<div className="title">{total} {U.Common.plural(total, translate('pluralObject'))}</div>
							<div className="content">
								<ListObject
									{...this.props}
									spaceId={this.getSpaceId()}
									subId={subId}
									rootId={rootId}
									columns={columns}
									relationKeys={[ 'creator', 'createdDate' ]}
									filters={filters}
								/>
							</div>
						</div>
					) : ''}
				</div>

				<Footer component="mainObject" {...this.props} />
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
		this.close();
	};

	open () {
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.close();
		this.id = rootId;
		this.setState({ isDeleted: false, isLoading: true });

		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();
			this.setState({ isLoading: false });
		});

		C.RelationListWithValue(U.Router.getRouteSpaceId(), rootId, (message: any) => {
			console.log('Message!!!:', message);
			const { error } = message;
			if (error) {
				return;
			};
			// const object = S.Detail.get(this.props.rootId, U.Router.getRouteSpaceId());
			// console.log('Object:', object);
			// const { countersList, relationskeysList } = message;
			// const relationKeyWithCounterList = relationskeysList.map((relationKey: string, ndx: number) => {
			// 	return {
			// 		relationKey,
			// 		counter: countersList[ndx],
			// 	};
			// });
			// console.log('RelationKeyWithCounterList:', relationKeyWithCounterList);
			this.setState({ relationKeyWithCounterList: message.relationKeyWithCounterList });
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup, match } = this.props;

		let close = true;
		if (isPopup && (match.params.id == this.id)) {
			close = false;
		};

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	getSpaceId () {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, [ 'spaceId' ], true);

		return object.spaceId;
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	getSubId () {
		return S.Record.getSubId(this.getRootId(), 'backlinks');
	};
});

export default PageMainDate;
