import * as React from 'react';
import $ from 'jquery';
import { Icon, Loader } from 'Component';
import { C, Util } from 'Lib';
import { observer } from 'mobx-react';

interface Props {
	url: string;
	position?: () => void;
};

interface State {
	loading: boolean;
	title: string;
	description: string;
	faviconUrl: string;
	imageUrl: string;
};

const ALLOWED_SCHEME = [ 'http', 'https' ];

const PreviewLink = observer(class PreviewLink extends React.Component<Props, State> {
	
	_isMounted = false;
	node: any = null;
	state = {
		loading: false,
		title: '',
		description: '',
		faviconUrl: '',
		imageUrl: '',
	};
	url: string;
	
	render () {
		const { url } = this.props;
		const { loading, title, description, faviconUrl, imageUrl } = this.state;
		
		return (
			<div ref={node => this.node = node} className="previewLink">
				{loading ? <Loader /> : (
					<React.Fragment>
						{imageUrl ? <div className="img" style={{ backgroundImage: `url("${imageUrl}")` }} /> : ''}
						<div className="info">
							{title ? <div className="name">{title}</div> : ''}
							{description ? <div className="descr">{description}</div> : ''}
							<div className="link">
								{faviconUrl ? <Icon icon={faviconUrl} className="fav" /> : ''}
								{url}
							</div> 
						</div>
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.load();
	};

	componentDidUpdate () {
		const { position } = this.props;
		const { imageUrl } = this.state;
		const node = $(this.node);

		imageUrl ? node.addClass('withImage') : node.removeClass('withImage');

		this.load();

		if (position) {
			position();
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	load () {
		const { url } = this.props;

		if (this.url == url) {
			return;
		};
		
		this.url = url;
		this.setState({ loading: true });

		const scheme = Util.getScheme(url);
		if (scheme && !ALLOWED_SCHEME.includes(scheme)) {
			return;
		};

		C.LinkPreview(url, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			let state: any = { loading: false };

			if (!message.error.code) {
				state = Object.assign(state, message.previewLink);
			};

			this.setState(state);

			if (message.error.code) {
				this.url = '';
			};
		});
	};

});

export default PreviewLink;