import { I, Storage, UtilCommon, analytics, Renderer, translate, UtilObject, UtilSpace, UtilData, UtilDate } from 'Lib';
import { popupStore, authStore } from 'Store';
const Surveys = require('json/survey.json');

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
				param.time = UtilDate.now();
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
				param.time = UtilDate.now();
				break;
		};

		Storage.setSurvey(type, param);
		analytics.event('SurveySkip', { type });
	};

	isComplete (type: I.SurveyType) {
		return Storage.getSurvey(type).complete;
	};

	getTimeRegister (): number {
		const profile = UtilSpace.getProfile();
		return Number(profile?.createdDate) || 0;
	};

	checkPmf () {
		const time = UtilDate.now();
		const obj = Storage.getSurvey(I.SurveyType.Pmf);
		const timeRegister = this.getTimeRegister();
		const lastCompleted = Number(obj.time || Storage.get('lastSurveyTime')) || 0;
		const lastCanceled = Number(obj.time || Storage.get('lastSurveyCanceled')) || 0;
		const week = 86400 * 7;
		const month = 86400 * 30;

		const registerTime = timeRegister <= time - week;
		const completeTime = obj.complete && registerTime && (lastCompleted <= time - month);
		const cancelTime = obj.cancel && registerTime && (lastCanceled <= time - month);
		const randSeed = 10000000;
		const rand = UtilCommon.rand(0, randSeed);

		// Show this survey to 5% of users
		if ((rand > randSeed * 0.05) && !completeTime) {
			Storage.setSurvey(I.SurveyType.Pmf, { time });
			return;
		};

		if (!popupStore.isOpen() && (cancelTime || !lastCompleted) && !completeTime) {
			this.show(I.SurveyType.Pmf);
		};
	};

	checkRegister () {
		const timeRegister = this.getTimeRegister();
		const isComplete = this.isComplete(I.SurveyType.Register);
		const surveyTime = timeRegister && ((UtilDate.now() - 86400 * 7 - timeRegister) > 0);

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
		const timeRegister = this.getTimeRegister();
		const isComplete = this.isComplete(I.SurveyType.Object);

		if (isComplete || !timeRegister) {
			return;
		};

		UtilData.search({
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
				{ operator: I.FilterOperator.And, relationKey: 'createdDate', condition: I.FilterCondition.Greater, value: timeRegister + 86400 * 3 }
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