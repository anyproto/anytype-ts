import * as React from 'react';
import { I, analytics, Util } from 'ts/lib';
import { Loader } from 'ts/component';

interface Props extends I.Popup {};

class PopupVideo extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { type } = data;

		let content = null;

		switch (type) {
			default:
			case 'onboarding':
				let src = `
					<style>
						body { margin: 0px; }
					</style>
					<script src="https://fast.wistia.com/embed/medias/tyvt7eszda.jsonp" async></script>
					<script src="https://fast.wistia.com/assets/external/E-v1.js" async></script>

					<div class="wistia_responsive_padding">
						<div class="wistia_responsive_wrapper">
							<div class="wistia_embed wistia_async_tyvt7eszda videoFoam=true">
								<div class="wistia_swatch">
								</div>
							</div>
						</div>
					</div>
				`;

				content = <iframe srcDoc={src} frameBorder={0} scrolling="no"></iframe>;
				break;
		};
		
		return (
			<div className="wrapper">
				{content}
				<Loader />
			</div>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { type } = data;

		this._isMounted = true;

		analytics.event(Util.toUpperCamelCase(`screen-${type}-video`));
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	
};

export default PopupVideo;