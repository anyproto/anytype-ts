import * as React from 'react';
import { Title, Button, Icon } from 'Component';
import { I, translate } from 'Lib';

class HeaderMainStore extends React.Component<I.HeaderComponent> {

	render () {
		const { renderLeftIcons, renderTabs, withBanner, onBanner, onBannerClose } = this.props;

		let banner = null;
		if (withBanner) {
			banner = (
				<div className="bannerWrapper">
					<div className="banner" onClick={onBanner}>
						<Icon className="close" onClick={onBannerClose} />

						<div className="side left">
							<Title text={translate('pageMainStoreBannerTitle')} />
							<Button text={translate('pageMainStoreBannerButton')} className="c28" />
						</div>

						<div className="side right">
							<div className="pic" />
						</div>
					</div>
				</div>
			);
		};
		
		return (
			<React.Fragment>
				{banner}

				<div className="sides">
					<div className="side left">{renderLeftIcons()}</div>
					<div className="side center">{renderTabs()}</div>
					<div className="side right" />
				</div>
			</React.Fragment>
		);
	};

};

export default HeaderMainStore;