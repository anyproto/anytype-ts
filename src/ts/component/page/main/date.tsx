import * as React from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Deleted, ListObject, Button } from 'Component';
import { I, C, S, U, Action, translate } from 'Lib';
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isDeleted: boolean;
	relations: any[];
	selectedRelation: string;
};

const SUB_ID = 'dateListObject';
const RELATION_KEY_MENTION = 'mentions';

const PageMainDate = observer(class PageMainDate extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	refList: any = null;
	refCalIcon: any = null;
	loading = false;
	timeout = 0;

	state = {
		isDeleted: false,
		relations: [],
		selectedRelation: RELATION_KEY_MENTION,
	};

	render () {
		const { space } = S.Common;
		const { isDeleted, relations, selectedRelation } = this.state;
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, [ 'timestamp' ]);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const columns: any[] = [
			{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
			{ relationKey: 'creator', name: translate('relationCreator'), isObject: true },
		];

		const filters: I.Filter[] = [];

		if (selectedRelation == RELATION_KEY_MENTION) {
			filters.push({ relationKey: RELATION_KEY_MENTION, condition: I.FilterCondition.In, value: [ object.id ] });
		} else {
			filters.push({ relationKey: selectedRelation, condition: I.FilterCondition.Equal, value: object.timestamp, format: I.RelationType.Date });
		};

		return (
			<div ref={node => this.node = node}>
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={object.rootId} 
				/>

				<div className="blocks wrapper">
					<HeadSimple 
						{...this.props} 
						noIcon={true}
						ref={ref => this.refHead = ref} 
						rootId={rootId} 
						readonly={true}
					/>

					<div className="categories">
						{relations.map((item) => {
							const isMention = item.relationKey == RELATION_KEY_MENTION;
							const icon = isMention ? 'mention' : '';
							const separator = isMention ? <div className="separator" /> : '';

							return (
								<React.Fragment key={item.relationKey}>
									<Button
										id={`category-${item.relationKey}`}
										active={selectedRelation === item.relationKey}
										color="blank"
										className="c36"
										onClick={() => {
											this.setState({ selectedRelation: item.relationKey }, () => {
												this.refList?.getData(1);
											});
										}}
										icon={icon}
										text={item.name}
									/>
									{separator}
								</React.Fragment>
							);
						})}
					</div>

					<div className="dateList">
						<ListObject 
							ref={ref => this.refList = ref}
							{...this.props}
							spaceId={space}
							subId={SUB_ID} 
							rootId={rootId}
							columns={columns}
							filters={filters}
						/>
					</div>
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
		this.setState({ isDeleted: false });

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
		
		let close = true;
		if (isPopup && (match.params.id == this.id)) {
			close = false;
		};
		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	loadCategory () {
        const { space, config } = S.Common;
        const rootId = this.getRootId();

        C.RelationListWithValue(space, rootId, (message: any) => {
            const relations = (message.relations || []).map(it => S.Record.getRelationByKey(it.relationKey)).filter(it => {
                if ([ RELATION_KEY_MENTION ].includes(it.relationKey)) {
                    return true;
                };

                if ([ 'links', 'backlinks' ].includes(it.relationKey)) {
                    return false;
                };

                return config.debug.hidden ? true : !it.isHidden;
            });

            relations.sort((c1, c2) => {
                const isMention1 = c1.relationKey == RELATION_KEY_MENTION;
                const isMention2 = c2.relationKey == RELATION_KEY_MENTION;

                if (isMention1 && !isMention2) return -1;
                if (!isMention1 && isMention2) return 1;
                return 0;
            });

			if (relations.length) {
				this.setState({ relations, selectedRelation: relations[0].relationKey });
			};
        });
    };

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

});

export default PageMainDate;
