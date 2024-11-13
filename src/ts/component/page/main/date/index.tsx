import * as React from 'react';
import { observer } from 'mobx-react';
import { Action, C, I, J, Renderer, S, translate, U } from 'Lib';
import { Header, Footer, ListObject, Button } from 'Component';
import HeadSimple from 'Component/page/elements/head/simple';
import RelationsSelector from './relations';
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { set } from 'lodash';
import { number, unknown } from '@rspack/core/compiled/zod';
import { then } from 'Lib/util/then';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
	relationKeyWithCounterList: { relationKey: string, counter: number }[];
};

// const PageMainDate = observer(class PageMainDate extends React.Component<I.PageComponent, State> {

// 	_isMounted = false;
// 	node: any = null;
// 	id = '';
// 	refHeader: any = null;
// 	refHead: any = null;

// 	state = {
// 		isLoading: false,
// 		isDeleted: false,
// 		relationKeyWithCounterList: [],
// 	};

// 	render() {
// 		const rootId = this.getRootId();
// 		const object = S.Detail.get(rootId, rootId, ['backlinks']);

// 		const subId = this.getSubId();
// 		const total = S.Record.getMeta(subId, '').total;

// 		const filters: I.Filter[] = [{ relationKey: 'id', condition: I.FilterCondition.In, value: object.backlinks || [] }];

// 		const columns: any[] = [
// 			{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
// 			{ relationKey: 'creator', name: translate('commonOwner'), isObject: true },
// 		];

// 		return (
// 			<div ref={node => this.node = node}>
// 				<div className="blocks wrapper">
// 					<HeadSimple
// 						{...this.props}
// 						ref={ref => this.refHead = ref}
// 						placeholder={translate('defaultNameTag')}
// 						rootId={rootId}
// 						isContextMenuDisabled={true}
// 						noIcon={true}
// 						withColorPicker={false}
// 					/>
// 					<RelationsSelector
// 						{...this.props}
// 					/>
// 					{!object._empty_ ? (
// 						<div className="section set">
// 							<div className="title">{total} {U.Common.plural(total, translate('pluralObject'))}</div>
// 							<div className="content">
// 								<ListObject
// 									{...this.props}
// 									spaceId={this.getSpaceId()}
// 									subId={subId}
// 									rootId={rootId}
// 									columns={columns}
// 									relationKeys={['creator', 'createdDate']}
// 									filters={filters}
// 								/>
// 							</div>
// 						</div>
// 					) : ''}
// 				</div>

// 				<Footer component="mainObject" {...this.props} />
// 			</div>
// 		);
// 	};

// 	componentDidMount() {
// 		this._isMounted = true;
// 		this.open();
// 	};

// 	componentDidUpdate() {
// 		this.open();
// 	};

// 	componentWillUnmount() {
// 		this._isMounted = false;
// 		this.close();
// 	};

// 	open() {
// 		const rootId = this.getRootId();

// 		if (this.id == rootId) {
// 			return;
// 		};

// 		this.close();
// 		this.id = rootId;
// 		this.setState({ isDeleted: false, isLoading: true });

// 		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
// 			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
// 				return;
// 			};

// 			const object = S.Detail.get(rootId, rootId, []);
// 			if (object.isDeleted) {
// 				this.setState({ isDeleted: true, isLoading: false });
// 				return;
// 			};

// 			this.refHeader?.forceUpdate();
// 			this.refHead?.forceUpdate();
// 			this.setState({ isLoading: false });
// 		});
// 	};

// 	close() {
// 		if (!this.id) {
// 			return;
// 		};

// 		const { isPopup, match } = this.props;

// 		let close = true;
// 		if (isPopup && (match.params.id == this.id)) {
// 			close = false;
// 		};

// 		if (close) {
// 			Action.pageClose(this.id, true);
// 		};
// 	};

// 	getSpaceId() {
// 		const rootId = this.getRootId();
// 		const object = S.Detail.get(rootId, rootId, ['spaceId'], true);

// 		return object.spaceId;
// 	};

// 	getRootId() {
// 		const { rootId, match } = this.props;
// 		return rootId ? rootId : match.params.id;
// 	};

// 	getSubId() {
// 		return S.Record.getSubId(this.getRootId(), 'backlinks');
// 	};
// });

// export default PageMainDate;

function getRootId({ rootId, match }) {
	return rootId ? rootId : match.params.id;
};

const PageMainDate = observer((props: { rootId: string, isPopup: boolean }) => {
	const { id } = useParams<{ id: string }>();
	const { rootId = id } = props;

	const [lastId, setLastId] = useState(rootId);
	const [isDeleted, setIsDeleted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const object = S.Detail.get(rootId, rootId, ['backlinks']);

	const subId = S.Record.getSubId(rootId, 'backlinks');

	const spaceId = S.Detail.get(rootId, rootId, ['spaceId'], true).spaceId;

	const total = S.Record.getMeta(subId, '').total;

	const filters: I.Filter[] = [{ relationKey: 'id', condition: I.FilterCondition.In, value: object.backlinks || [] }];

	const columns: any[] = [
		{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
		{ relationKey: 'creator', name: translate('commonOwner'), isObject: true },
	];

	const mounted = useRef(false);


	const close = () => {
		if (!mounted.current) {
			return;
		}
		if (!lastId) {
			return;
		};

		const { isPopup } = props;

		const { id } = useParams<{ id: string }>();

		let close = true;
		if (isPopup && (id == lastId)) {
			close = false;
		};

		if (close) {
			Action.pageClose(lastId, true);
		};
	};

	const open = async () => {

		if (!mounted.current) {
			return;
		}

		if (lastId == rootId) {
			return;
		};

		close();
		setLastId(rootId);
		setIsDeleted(false);
		setIsLoading(true);

		const message: { error?: { code?: number } } = await then(C.ObjectOpen)(rootId, '', U.Router.getRouteSpaceId());

		if (!rootId) return;

		const errorCode = message?.error?.code;

		if (errorCode) return;

		setIsLoading(false);

		let hasError = false;

		if (!U.Common.checkErrorCommon(errorCode)) {
			hasError = false;
		};

		if ([J.Error.Code.NOT_FOUND, J.Error.Code.OBJECT_DELETED].includes(errorCode)) {
			setIsDeleted(true);
		} else {
			const logPath = U.Common.getElectron().logPath();

			S.Popup.open('confirm', {
				data: {
					icon: 'error',
					bgColor: 'red',
					title: translate('commonError'),
					text: translate('popupConfirmObjectOpenErrorText'),
					textConfirm: translate('popupConfirmObjectOpenErrorButton'),
					onConfirm: () => {
						C.DebugTree(rootId, logPath, (message: any) => {
							if (!errorCode) {
								Renderer.send('openPath', logPath);
							};
						});

						U.Space.openDashboard('route', { replace: true });
					},
				},
			});
		};

		hasError = false;

		if (!hasError) {
			return;
		};

		const object = S.Detail.get(rootId, rootId, []);
		setIsLoading(false);

		if (object.isDeleted) {
			setIsDeleted(true);
			return;
		};
	};

	useEffect(() => {
		if (!mounted.current) {
			// did mount
			mounted.current = true;
		}
		open();
		return () => {
			// will unmount
			close();
			mounted.current = false;
		};
	}, [rootId]);

	return (
		<div>
			<div className="blocks wrapper">
				<HeadSimple
					{...props}
					placeholder={translate('defaultNameTag')}
					rootId={rootId}
					isContextMenuDisabled={true}
					noIcon={true}
					withColorPicker={false} />
				<RelationsSelector
					{...props} />
				{!object._empty_ ? (
					<div className="section set">
						<div className="title">{total} {U.Common.plural(total, translate('pluralObject'))}</div>
						<div className="content">
							<ListObject
								{...props}
								spaceId={spaceId}
								subId={subId}
								rootId={rootId}
								columns={columns}
								relationKeys={['creator', 'createdDate']}
								filters={filters} />
						</div>
					</div>
				) : ''}
			</div>

			<Footer component="mainObject" {...props} />
		</div>
	);
});

export default PageMainDate;