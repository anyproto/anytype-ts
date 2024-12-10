import * as React from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Deleted, ListObject, Button, Label, Loader, HeadSimple } from 'Component';
import { I, C, S, U, J, Action, translate, analytics, keyboard } from 'Lib';
import { eachDayOfInterval, isEqual, format, fromUnixTime } from 'date-fns';

interface State {
	isDeleted: boolean;
	isLoading: boolean;
	relations: any[];
	relationKey: string;
};

const SUB_ID = 'dateListObject';

const PageMainDate = observer(class PageMainDate extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	refList: any = null;
	refCalIcon: any = null;
	timeout = 0;

	state = {
		isDeleted: false,
		isLoading: false,
		relations: [],
		relationKey: J.Relation.key.mention,
	};

	render () {
		const { space } = S.Common;
		const { isLoading, isDeleted, relations, relationKey } = this.state;
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, []);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const relation = S.Record.getRelationByKey(relationKey);

		let content = null;
		if (isLoading) {
			content = <Loader id="loader" />
		} else
		if (!relations.length || !relation) {
			content = (
				<div className="emptyContainer">
					<Label text={translate('pageMainDateEmptyText')} />
				</div>
			);
		} else {
			const columns: any[] = [
				{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
				{ relationKey: 'creator', name: translate('relationCreator'), isObject: true },
			];

			const keys = relations.map(it => it.relationKey);
			const filters: I.Filter[] = [];

			if (relation.format == I.RelationType.Object) {
				filters.push({ relationKey: J.Relation.key.mention, condition: I.FilterCondition.In, value: [ object.id ] });
			} else {
				filters.push({ relationKey: relationKey, condition: I.FilterCondition.Equal, value: object.timestamp, format: I.RelationType.Date });
			};

			if ([ 'createdDate' ].includes(relationKey)) {
				const map = {
					createdDate: 'creator',
				};

				filters.push({ relationKey: map[relationKey], condition: I.FilterCondition.NotEqual, value: J.Constant.anytypeProfileId });
				keys.push(map[relationKey]);
			};

			content = (
				<React.Fragment>
					<div className="categories">
						{relations.map((item) => {
							const isMention = item.relationKey == J.Relation.key.mention;
							const icon = isMention ? 'mention' : '';

							return (
								<Button
									id={`category-${item.relationKey}`}
									key={item.relationKey}
									active={relationKey == item.relationKey}
									color="blank"
									className="c36"
									onClick={() => this.onCategoryClick(item.relationKey)}
									icon={icon}
									text={item.name}
								/>
							);
						})}
					</div>

					<ListObject
						ref={ref => this.refList = ref}
						{...this.props}
						spaceId={space}
						subId={SUB_ID}
						rootId={rootId}
						columns={columns}
						filters={filters}
						route={analytics.route.screenDate}
						relationKeys={keys}
					/>
				</React.Fragment>
			);
		};

		return (
			<div ref={node => this.node = node}>
				<Header
					{...this.props}
					component="mainObject"
					ref={ref => this.refHeader = ref}
					rootId={rootId}
				/>

				<div className="blocks wrapper">
					<HeadSimple
						{...this.props}
						noIcon={true}
						ref={ref => this.refHead = ref}
						rootId={rootId}
						readonly={true}
						relationKey={relationKey}
						getDotMap={this.getDotMap}
					/>

					{content}
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		const match = keyboard.getMatch();
		const { relationKey } = match.params;

		this._isMounted = true;

		if (relationKey) {
			this.setState({ relationKey }, () => this.open());
		} else {
			this.open();
		};
	};

	componentDidUpdate () {
		this.open();
		this.checkDeleted();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();
	};

	checkDeleted () {
		const { isDeleted } = this.state;
		if (isDeleted) {
			return;
		};

		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, []);

		if (object.isDeleted) {
			this.setState({ isDeleted: true });
		};
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
				this.setState({ isDeleted: true });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();

			this.loadCategory();
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup, match } = this.props;
		const close = !(isPopup && (match?.params?.id == this.id));

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	loadCategory () {
        const { space, config } = S.Common;
		const { relationKey } = this.state;
        const rootId = this.getRootId();

		this.setState({ isLoading: true });

        C.RelationListWithValue(space, rootId, (message: any) => {
            const relations = (message.relations || []).map(it => S.Record.getRelationByKey(it.relationKey)).filter(it => {
				if (!it) {
					return false;
				};

                if ([ J.Relation.key.mention ].includes(it.relationKey)) {
                    return true;
                };

                if ([ 'links', 'backlinks' ].includes(it.relationKey)) {
                    return false;
                };

                return config.debug.hidden ? true : !it.isHidden;
            });

            relations.sort((c1, c2) => {
                const isMention1 = c1.relationKey == J.Relation.key.mention;
                const isMention2 = c2.relationKey == J.Relation.key.mention;

                if (isMention1 && !isMention2) return -1;
                if (!isMention1 && isMention2) return 1;
                return 0;
            });

			this.setState({ relations, isLoading: false });

			if (relations.length) {
				if (!relationKey || !relations.find(it => it.relationKey == relationKey)) {
					this.onCategory(relations[0].relationKey);
				} else {
					this.reload();
				};
			} else {
				this.reload();
			};
        });
    };

	onCategory (relationKey: string) {
		this.setState({ relationKey }, () => this.reload());
	};

	onCategoryClick (relationKey: string) {
		this.onCategory(relationKey);
		analytics.event('SwitchRelationDate', { relationKey });
	};

	reload () {
		this.refList?.getData(1);
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match?.params?.id;
	};

	getFilters = (start: number, end: number): I.Filter[] => {
		const { relationKey } = this.state;

		if (!relationKey) {
			return [];
		};

		return [

			{
				relationKey,
				condition: I.FilterCondition.GreaterOrEqual,
				value: start,
				quickOption: I.FilterQuickOption.ExactDate,
				format: I.RelationType.Date,
			},
			{
				relationKey,
				condition: I.FilterCondition.LessOrEqual,
				value: end,
				quickOption: I.FilterQuickOption.ExactDate,
				format: I.RelationType.Date,
			}
		];
	};

	getDotMap = (start: number, end: number, callBack: (res: Map<string, boolean>) => void): void => {
		const { relationKey } = this.state;
		const res = new Map();

		if (!relationKey) {
			callBack(res);
			return;
		};

		U.Data.search({
			filters: this.getFilters(start, end),
			keys: [ relationKey ],
		}, (message: any) => {
			eachDayOfInterval({
				start: fromUnixTime(start),
				end: fromUnixTime(end)
			}).forEach(date => {
				if (message.records.find(rec => isEqual(date, fromUnixTime(rec[relationKey]).setHours(0, 0, 0, 0)))) {
					res.set(format(date, 'dd-MM-yyyy'), true);
				};
			});

			callBack(res);
		});
	};

});

export default PageMainDate;