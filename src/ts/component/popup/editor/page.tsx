import * as React from 'react';
import { I } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { HeaderMainEditPopup as Header, DragProvider, SelectionProvider, EditorPage } from 'ts/component';
import { commonStore, blockStore } from 'ts/store';

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
		const { history, location, match, param } = this.props;
		const { data } = param;
		const { id } = data;
		
		return (
			<SelectionProvider rootId={id} container=".popupEditorPage .content">
				<DragProvider {...this.props} rootId={id}>
					<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={id} />
							
					<EditorPage history={history} location={location} match={match} rootId={id} onOpen={this.onOpen} />
				</DragProvider>
			</SelectionProvider>
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
		win.unbind('resize.navigation').on('resize.navigation', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('keydown.navigation resize.navigation');
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