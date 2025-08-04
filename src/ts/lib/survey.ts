import { I, S, U, J, Storage, analytics, Action, translate } from 'Lib';

class Survey {

	/**
	 * Checks and triggers the appropriate survey check function for the given type.
	 * @param {I.SurveyType} type - The survey type.
	 */
	check (type: I.SurveyType) {
		const fn = `check${I.SurveyType[type]}`;

		if (this[fn]) {
			this[fn](type);
		};
	};

	/**
	 * Shows a survey popup for the given type.
	 * @param {I.SurveyType} type - The survey type.
	 */
	show (type: I.SurveyType) {
		const prefix = `survey${type}`;

		S.Popup.open('confirm', {
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

	/**
	 * Handles survey confirmation, sets completion, and opens the survey URL.
	 * @param {I.SurveyType} type - The survey type.
	 */
	onConfirm (type: I.SurveyType) {
		const { account } = S.Auth;
		const t = I.SurveyType[type].toLowerCase();
		const param: any = {};

		switch (type) {
			default:
				param.complete = true;
				break;

			case I.SurveyType.Pmf:
				param.complete = true;
				param.time = U.Date.now();
				break;
		};

		Storage.setSurvey(type, param);
		Action.openUrl(U.Common.sprintf(J.Url.survey[t], account.id));
		analytics.event('SurveyOpen', { type });
	};

	/**
	 * Handles survey skip, sets completion or cancel state.
	 * @param {I.SurveyType} type - The survey type.
	 */
	onSkip (type: I.SurveyType) {
		const param: any = {};

		switch (type) {
			default:
				param.complete = true;
				break;

			case I.SurveyType.Pmf:
				param.cancel = true;
				param.time = U.Date.now();
				break;
		};

		Storage.setSurvey(type, param);
		analytics.event('SurveySkip', { type });
	};

	/**
	 * Checks if a survey is complete for the given type.
	 * @param {I.SurveyType} type - The survey type.
	 * @returns {boolean} True if the survey is complete.
	 */
	isComplete (type: I.SurveyType) {
		return Storage.getSurvey(type).complete;
	};

	/**
	 * Gets the registration time for the current profile.
	 * @returns {number} The registration timestamp.
	 */
	getTimeRegister (): number {
		const profile = U.Space.getProfile();
		return Number(profile?.createdDate) || 0;
	};

	/**
	 * Checks if the PMF survey should be shown, based on registration and last survey time.
	 * @param {I.SurveyType} type - The survey type.
	 */
	checkPmf (type: I.SurveyType) {
		const time = U.Date.now();
		const obj = Storage.getSurvey(type);
		const timeRegister = this.getTimeRegister();
		const lastTime = Number(obj.time) || 0;
		const month = 86400 * 30;
		const registerTime = timeRegister <= time - month;
		const cancelTime = obj.cancel && registerTime && (lastTime <= time - month * 2);

		if (obj.complete) {
			return;
		};

		// Show this survey to 7% of users
		if (!this.checkRandSeed(7)) {
			Storage.setSurvey(type, { time });
			return;
		};

		if (!S.Popup.isOpen() && (cancelTime || !lastTime)) {
			this.show(type);
		};
	};

	/**
	 * Checks if the Register survey should be shown, based on registration time.
	 * @param {I.SurveyType} type - The survey type.
	 */
	checkRegister (type: I.SurveyType) {
		const timeRegister = this.getTimeRegister();
		const isComplete = this.isComplete(type);
		const surveyTime = timeRegister && ((U.Date.now() - 86400 * 7 - timeRegister) > 0);

		if (!isComplete && surveyTime && !S.Popup.isOpen()) {
			this.show(type);
		};
	};

	/**
	 * Checks if the Delete survey should be shown, based on completion state.
	 * @param {I.SurveyType} type - The survey type.
	 */
	checkDelete (type: I.SurveyType) {
		const isComplete = this.isComplete(type);

		if (!isComplete) {
			this.show(type);
		};
	};

	/**
	 * Checks if the Object survey should be shown, based on created objects after registration.
	 * @param {I.SurveyType} type - The survey type.
	 */
	checkObject (type: I.SurveyType) {
		const { space } = S.Common;
		const timeRegister = this.getTimeRegister();
		const isComplete = this.isComplete(type);

		if (isComplete || !timeRegister) {
			return;
		};

		U.Subscription.search({
			spaceId: space,
			filters: [
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
				{ relationKey: 'createdDate', condition: I.FilterCondition.Greater, value: timeRegister + 86400 * 3 }
			],
			limit: 50,
		}, (message: any) => {
			if (!message.error.code && (message.records.length >= 50)) {
				this.show(type);
			};
		});
	};

	/**
	 * Checks if the Shared survey should be shown, based on shared spaces.
	 * @param {I.SurveyType} type - The survey type.
	 */
	checkShared (type: I.SurveyType) {
		const isComplete = this.isComplete(type);
		if (isComplete || this.isComplete(I.SurveyType.Multiplayer)) {
			return;
		};

		const { account } = S.Auth;
		const check = U.Space.getList().filter(it => it.isShared && (it.creator == U.Space.getParticipantId(it.targetSpaceId, account.id)));
		if (!check.length) {
			return;
		};

		this.show(type);
	};

	/**
	 * Checks if the Multiplayer survey should be shown, based on registration and shared survey state.
	 * @param {I.SurveyType} type - The survey type.
	 */
	checkMultiplayer (type: I.SurveyType) {
		const isComplete = this.isComplete(type);
		const timeRegister = this.getTimeRegister();
		const surveyTime = timeRegister && (timeRegister <= U.Date.now() - 86400 * 7);

		if (isComplete || this.isComplete(I.SurveyType.Shared) || !surveyTime) {
			return;
		};

		if (this.checkRandSeed(30)) {
			this.show(type);
		};
	};

	/**
	 * Returns true with the given percent probability, using a random seed.
	 * @param {number} percent - The percent chance (0-100).
	 * @returns {boolean} True if the random check passes.
	 */
	checkRandSeed (percent: number) {
		const randSeed = 10000000;
		const rand = U.Common.rand(0, randSeed);

		return rand < randSeed * percent / 100;
	};

};

export default new Survey();
