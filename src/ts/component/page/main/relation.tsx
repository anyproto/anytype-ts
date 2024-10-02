import * as React from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, ListObject, Deleted } from 'Component';
import { I, C, S, U, Action, translate } from 'Lib';
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isDeleted: boolean;
	isLoading: boolean;
};

const PageMainRelation = observer(class PageMainRelation extends React.Component<I.PageComponent, State> {

	id = '';
	refHeader: any = null;
	refHead: any = null;
	refListType: any = null;
	refListObject: any = null;

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
		const object = S.Detail.get(rootId, rootId);
		const subIdType = S.Record.getSubId(rootId, 'type');
		const totalType = S.Record.getMeta(subIdType, '').total;
		const subIdObject = S.Record.getSubId(rootId, 'object');
		const totalObject = S.Record.getMeta(subIdObject, '').total;
		const columnsObject: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: v => U.Date.dateWithFormat(I.DateFormat.MonthAbbrBeforeDay, v),
			},
			{ relationKey: object.relationKey, name: object.name, isCell: true }
		];

		const filtersType: I.Filter[] = [
			{ relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: object.spaceId },
			{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
			{ relationKey: 'recommendedRelations', condition: I.FilterCondition.In, value: [ rootId ] },
		];
		const filtersObject: I.Filter[] = [
			{ relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: object.spaceId },
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

					{!object._empty_ ? (
						<React.Fragment>
							<div className="section set">
								<div className="title">{totalType} {U.Common.plural(totalType, translate('pluralObjectType'))}</div>
								<div className="content">
									<ListObject 
										ref={ref => this.refListType = ref}
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
									<div className="title">{totalObject} {U.Common.sprintf(translate('pageMainRelationObjectsCreated'), U.Common.plural(totalObject, translate('pluralObject')))}</div>
									<div className="content">
										<ListObject 
											ref={ref => this.refListObject = ref}
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
						</React.Fragment>
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
		const object = S.Detail.get(rootId, rootId);

		C.ObjectCreateSet([ rootId ], { name: object.name + ' set' }, '', S.Common.space, (message: any) => {
			if (!message.error.code) {
				U.Object.openConfig(message.details);
			};
		});
	};

});

export default PageMainRelation;