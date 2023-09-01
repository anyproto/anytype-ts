import { I, Storage, UtilCommon, analytics, Renderer, translate, UtilObject, UtilData } from 'Lib';
import { popupStore, authStore } from 'Store';
import Surveys from 'json/survey.json';

class Survey {

	check (type: I.SurveyType) {
		const fn = `check${I.SurveyType[type]}`;

		if (this[fn]) {
			this[fn]();
		};
	};

	show (type: I.SurveyType) {
		const prefix = `survey${type}`;

		popupStore.open('confirm', {
			data: {
				title: translate(`${prefix}Title`),
				text: translate(`${prefix}Text`),
				textConfirm: translate(`${prefix}Confirm`),
				textCancel: translate(`${prefix}Cancel`),
				canConfirm: true,
				canCancel: true,
				onConfirm: () => this.onConfirm(type),
				onCancel: () => this.onSkip(type),
			}
		});

		analytics.event('SurveyShow', { type });
	};

	onConfirm (type: I.SurveyType) {
		const { account } = authStore;
		const survey = Surveys[type];
		const param: any = {};

		switch (type) {
			default:
				param.complete = true;
				break;

			case I.SurveyType.Pmf:
				param.time = UtilCommon.time();
				break;
		};

		Storage.setSurvey(type, param);
		Renderer.send('urlOpen', UtilCommon.sprintf(survey.url, account.id));
		analytics.event('SurveyOpen', { type });
	};

	onSkip (type: I.SurveyType) {
		const param: any = {};

		switch (type) {
			default:
				param.complete = true;
				break;

			case I.SurveyType.Pmf:
				param.cancel = true;
				param.time = UtilCommon.time();
				break;
		};

		Storage.setSurvey(type, param);
		analytics.event('SurveySkip', { type });
	};

	isComplete (type: I.SurveyType) {
		return Storage.getSurvey(type).complete;
	};

	checkPmf () {
		const time = UtilCommon.time();
		const obj = Storage.getSurvey(I.SurveyType.Pmf);
		const timeRegister = Number(Storage.get('timeRegister')) || 0;
		const lastTime = Number(Storage.get('lastSurveyTime')) || Number(obj.time) || 0;
		const lastCanceled = Number(Storage.get('lastSurveyCanceled')) || obj.cancel || false;
		const registerTime = timeRegister <= time - 86400 * 7;
		const cancelTime = registerTime && (lastCanceled <= time - 86400 * 30);
		const randSeed = 10000000;
		const rand = UtilCommon.rand(0, randSeed);

		// Show this survey to 5% of users
		if (rand > randSeed * 0.05) {
			Storage.setSurvey(I.SurveyType.Pmf, { time });
			return;
		};

		if (!popupStore.isOpen() && (cancelTime || !lastTime)) {
			this.show(I.SurveyType.Pmf);
		};
	};

	checkRegister () {
		const timeRegister = Number(Storage.get('timeRegister')) || 0;
		const isComplete = this.isComplete(I.SurveyType.Register);
		const surveyTime = timeRegister && ((UtilCommon.time() - 86400 * 7 - timeRegister) > 0);

		if (!isComplete && surveyTime && !popupStore.isOpen()) {
			this.show(I.SurveyType.Register);
		};
	};

	checkDelete () {
		const isComplete = this.isComplete(I.SurveyType.Delete);

		if (!isComplete) {
			this.show(I.SurveyType.Delete);
		};
	};

	checkObject () {
		const timeRegister = Number(Storage.get('timeRegister')) || 0;
		const isComplete = this.isComplete(I.SurveyType.Object);

		if (isComplete || !timeRegister) {
			return;
		};

		UtilData.search({
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
            	{ operator: I.FilterOperator.And, relationKey: 'createdDate', condition: I.FilterCondition.Greater, value: timeRegister + 30 }
			],
			limit: 50,
		}, (message: any) => {
			if (!message.error.code && (message.records.length >= 50)) {
				this.show(I.SurveyType.Object);
			};
		});
	};

}

export default new Survey();