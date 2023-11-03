import * as React from 'react';
import { Title, Label, Button, Tag } from 'Component';
import { I, UtilCommon, UtilFile, UtilDate, translate } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';

class PopupUsecase extends React.Component<I.Popup> {
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const object: any = data.object || {};
		const screenshots = object.screenshots || [];
		const categories = object.categories || [];

		return (
			<div>
				<div className="titleWrap">
					<div className="side left">
						<Title text={object.title} />
						<Label text={UtilCommon.sprintf('Made by @%s', object.author)} />
					</div>
					<div className="side right">
						<Button text="Install" arrow={true} />
					</div>
				</div>

				<div className="screenWrap">
					<Swiper spaceBetween={56} slidesPerView={1}>
						{screenshots.map((url: string, i: number) => (
							<SwiperSlide key={i}>
								<div className="screen" style={{ backgroundImage: `url('${url}')` }} />
							</SwiperSlide>
						))}
    				</Swiper>
				</div>

				<div className="footerWrap">
					<div className="side left">
						<Label text={object.description} />
					</div>
					<div className="side right">
						<div className="tags">
							{categories.map((name: string, i: number) => (
								<Tag key={i} text={name} />
							))}
						</div>
						<Label text={UtilCommon.sprintf(`Updated: %s`, UtilDate.date(UtilDate.dateFormat(I.DateFormat.MonthAbbrBeforeDay), UtilDate.now()))} />
						<Label text={UtilFile.size(object.size)} />
					</div>
				</div>
			</div>
		);
	};

};

export default PopupUsecase;