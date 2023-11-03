import * as React from 'react';
import { Frame, Label } from 'Component';
import { I, C, UtilRouter, UtilCommon } from 'Lib';

class PageMainImport extends React.Component<I.PageComponent> {

	render () {
		const search = this.getSearch();

		return (
			<div className="wrapper">
				<Frame>
					<Label text={`Type: ${search.type}`} />
					<Label text={`Source: ${search.source}`} />
				</Frame>
			</div>
		);
	};

	componentDidMount(): void {
		const search = this.getSearch();

		C.DownloadManifest(search.source, (message: any) => {
		});
	};

	getSearch () {
		return UtilCommon.searchParam(UtilRouter.history.location.search);
	};

};

export default PageMainImport;