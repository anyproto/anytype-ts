import * as React from 'react';
import { I, C, U, Storage } from 'Lib';

class PageMainObject extends React.Component<I.PageComponent> {

	render () {
		return <div />;
	};

	componentDidMount (): void {
		const { match } = this.props;
		const { id, spaceId, cid, key } = match.params || {};
		const space = U.Space.getSpaceviewBySpaceId(spaceId);

		// Redirect to invite page when invite parameters are present
		if (!space && cid && key) {
			U.Router.go(`/main/invite/?cid=${cid}&key=${key}`, { replace: true });
			return;
		};

		C.ObjectShow(id, '', spaceId, (message: any) => {
			if (message.error.code) {
				U.Space.openDashboard('route');
				return;
			};

			const details = message.objectView?.details || [];
			const item = details.find(it => it.id == id);

			if (!item) {
				console.error('Object not found');
				return;
			};

			U.Object.openRoute(item.details);
		});
	};

};

export default PageMainObject;