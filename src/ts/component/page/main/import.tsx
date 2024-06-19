import * as React from 'react';
import { Loader, Title, Error, Frame, Button } from 'Component';
import { I, C, S, U, translate } from 'Lib';

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
								onClick={() => U.Space.openDashboard('route')} 
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
				U.Space.openDashboard('route');
				window.setTimeout(() => {
					S.Popup.open('usecase', { data: { page: 'item', object: message.info } });
				}, S.Popup.getTimeout());
			};
		});

		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();
	};

	getSearch () {
		return U.Common.searchParam(U.Router.history.location.search);
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = U.Common.getPageContainer(isPopup);
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