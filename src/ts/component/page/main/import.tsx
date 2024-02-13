import * as React from 'react';
import { Loader, Title, Error, Frame, Button } from 'Component';
import { I, C, UtilCommon, UtilRouter, UtilObject, keyboard, translate } from 'Lib';
import { popupStore } from 'Store';
import Constant from 'json/constant.json';

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
					<Title text={translate('pageMainImportTitle')} />
					<Loader />

					<Error text={error} />

					{error ? (
						<div className="buttons">
							<Button text={translate('commonBack')} className="c28" onClick={() => keyboard.onBack()} />
						</div>
					) : ''}
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
				UtilObject.openHome('route');
				window.setTimeout(() => popupStore.open('usecase', { data: { object: message.info } }), Constant.delay.popup);
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