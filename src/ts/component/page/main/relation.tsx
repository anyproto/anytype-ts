import * as React from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, ListObject, Deleted } from 'Component';
import { I, C, Action, UtilCommon, UtilObject, UtilRouter, translate, UtilDate, UtilSpace } from 'Lib';
import { detailStore, dbStore, commonStore } from 'Store';
const Errors = require('json/error.json');
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isDeleted: boolean;
	isLoading: boolean;
};

const PageMainRelation = observer(class PageMainRelation extends React.Component<I.PageComponent, State> {

	id = '';
	refHeader: any = null;
	refHead: any = null;

	state = {
		isDeleted: false,
		isLoading: false
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onCreate = this.onCreate.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		const subIdType = dbStore.getSubId(rootId, 'type');
		const totalType = dbStore.getMeta(subIdType, '').total;
		const subIdObject = dbStore.getSubId(rootId, 'object');
		const totalObject = dbStore.getMeta(subIdObject, '').total;
		const columnsObject: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: (v: any) => UtilDate.date(UtilDate.dateFormat(I.DateFormat.MonthAbbrBeforeDay), v),
			},
			{ relationKey: object.relationKey, name: object.name, isCell: true }
		];

		const filtersType: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: object.spaceId },
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
			{ operator: I.FilterOperator.And, relationKey: 'recommendedRelations', condition: I.FilterCondition.In, value: [ rootId ] },
		];
		const filtersObject: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: object.spaceId },
		];

		return (
			<div>
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={rootId} 
				/>

				{isLoading ? <Loader id="loader" /> : ''}

				<div className="blocks wrapper">
					<HeadSimple 
						{...this.props} 
						ref={ref => this.refHead = ref} 
						placeholder={translate('defaultNameRelation')} 
						rootId={rootId} onCreate={this.onCreate} 
					/>

					<div className="section set">
						<div className="title">{totalType} {UtilCommon.plural(totalType, translate('pluralObjectType'))}</div>
						<div className="content">
							<ListObject 
								{...this.props}
								subId={subIdType} 
								rootId={rootId} 
								columns={[]} 
								filters={filtersType} 
							/>
						</div>
					</div>

					{object.isInstalled ? (
						<div className="section set">
							<div className="title">{totalObject} {UtilCommon.sprintf(translate('pageMainRelationObjectsCreated'), UtilCommon.plural(totalObject, translate('pluralObject')))}</div>
							<div className="content">
								<ListObject 
									{...this.props} 
									sources={[ rootId ]} 
									subId={subIdObject} 
									rootId={rootId} 
									columns={columnsObject} 
									filters={filtersObject} 
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

		this.close();
		this.id = rootId;
		this.setState({ isLoading: true });
		
		C.ObjectOpen(rootId, '', UtilRouter.getRouteSpaceId(), (message: any) => {
			if (!UtilCommon.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();
			this.setState({ isLoading: false });
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

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	onCreate () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);

		C.ObjectCreateSet([ rootId ], { name: object.name + ' set' }, '', commonStore.space, (message: any) => {
			if (!message.error.code) {
				UtilObject.openPopup(message.details);
			};
		});
	};

});

export default PageMainRelation;
