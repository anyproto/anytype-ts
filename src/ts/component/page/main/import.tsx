import * as React from 'react';
import { Loader, Title, Error, Frame, Button } from 'Component';
import { I, C, UtilCommon, UtilRouter, UtilSpace, translate } from 'Lib';
import { popupStore } from 'Store';

interface State {
	error: string;
};

class PageMainImport extends React.Component<I.PageComponent, State> {

	state = {
		error: '',
	};
	node = null;

	render () {
		const { error } = this.state;

		return (
			<div 
				ref={ref => this.node = ref}
				className="wrapper"
			>
				<Frame>
					<Title text={error ? translate('commonError') : translate('pageMainImportTitle')} />
					<Error text={error} />

					{error ? (
						<div className="buttons">
							<Button 
								text={translate('commonBack')} 
								color="blank" 
								className="c36" 
								onClick={() => UtilSpace.openDashboard('route')} 
							/>
						</div>
					) : <Loader />}
				</Frame>
			</div>
		);
	};

	componentDidMount (): void {
		const search = this.getSearch();

		C.GalleryDownloadManifest(search.source, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			} else {
				UtilSpace.openDashboard('route');
				window.setTimeout(() => {
					popupStore.open('usecase', { data: { page: 'item', object: message.info } });
				}, popupStore.getTimeout());
			};
		});

		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();
	};

	getSearch () {
		return UtilCommon.searchParam(UtilRouter.history.location.search);
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = UtilCommon.getPageContainer(isPopup);
		const node = $(this.node);
		const wrapper = obj.find('.wrapper');
		const oh = obj.height();
		const header = node.find('#header');
		const hh = header.height();
		const wh = isPopup ? oh - hh : win.height();

		wrapper.css({ height: wh, paddingTop: isPopup ? 0 : hh });
	};

};

export default PageMainImport;