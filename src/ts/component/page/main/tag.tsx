import * as React from 'react';
import { observer } from 'mobx-react';
import { Action, C, I, S, translate, U } from 'Lib';
import { Header, Footer, ListObject } from 'Component';
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const PageMainTag = observer(class PageMainTag extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;

	state = {
		isLoading: false,
		isDeleted: false,
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.setColor = this.setColor.bind(this);
	};

	render () {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, [ 'backlinks', 'relationOptionColor' ]);

		const subId = this.getSubId();
		const total = S.Record.getMeta(subId, '').total;

		const filters: I.Filter[] = [ { relationKey: 'id', condition: I.FilterCondition.In, value: object.backlinks || [] } ];

		const columns: any[] = [
			{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
			{
				relationKey: 'createdDate', name: translate('commonDateCreated'),
				mapper: v => v ? U.Date.dateWithFormat(I.DateFormat.MonthAbbrBeforeDay, v) : '',
			},
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

				<div className="blocks wrapper">
					<HeadSimple
						{...this.props}
						ref={ref => this.refHead = ref}
						placeholder={translate('defaultNameTag')}
						rootId={rootId}
						isContextMenuDisabled={true}
						noIcon={true}
						withColorPicker={true}
						onColorChange={this.setColor}
						colorPickerTitle={translate('pageMainTagTagColor')}
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
		this.setState({ isLoading: true});

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

	setColor (color: string) {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId);

		C.ObjectListSetDetails([ object.id ], [
			{ key: 'relationOptionColor', value: color },
		], (message) => {
			console.log('MESSAGE: ', message)
			S.Detail.update(rootId, { id: object.id, details: { relationOptionColor: color } }, false);
			this.forceUpdate();
		});
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

export default PageMainTag;
