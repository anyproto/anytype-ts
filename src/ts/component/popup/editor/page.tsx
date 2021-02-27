import * as React from 'react';
import { I } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { HeaderMainEdit as Header, DragProvider, SelectionProvider, EditorPage } from 'ts/component';
import { commonStore } from 'ts/store';

interface Props extends I.Popup, RouteComponentProps<any> {};

const $ = require('jquery');
const raf = require('raf');

class PopupEditorPage extends React.Component<Props, {}> {

	refHeader: any = null;
	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
	};
	
	render () {
		const { history, location, param } = this.props;
		const { data } = param;
		const { id, match } = data;
		
		return (
			<div className="wrap">
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} match={match} isPopup={true} />
				<SelectionProvider rootId={id}>
					<DragProvider {...this.props} rootId={id}>
						<EditorPage key="editorPagePopup" isPopup={true} history={history} location={location} match={match} rootId={id} onOpen={this.onOpen} />
					</DragProvider>
				</SelectionProvider>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	onOpen () {
		if (this.refHeader) {
			this.refHeader.forceUpdate();
		};
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.unbind('resize.popup.editorPage').on('resize.popup.editorPage', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.popup.editorPage');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		raf(() => {
			const win = $(window);
			const obj = $('#popupEditorPage #innerWrap');
			const width = Math.max(732, Math.min(960, win.width() - 128));

			obj.css({ width: width, marginLeft: -width / 2, marginTop: 0 });
		});
	};

};

export default PopupEditorPage;