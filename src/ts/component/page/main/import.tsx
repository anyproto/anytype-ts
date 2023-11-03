import * as React from 'react';
import { Frame } from 'Component';
import { I, UtilRouter, UtilCommon } from 'Lib';

class PageMainImport extends React.Component<I.PageComponent> {

	render () {
		const history = UtilRouter.history;
		const search = UtilCommon.searchParam(history.location.search);
		const source = decodeURIComponent(String(search.source || ''));

		return (
			<div className="wrapper">
				<Frame>
					{source}
				</Frame>
			</div>
		);
	};

};

export default PageMainImport;