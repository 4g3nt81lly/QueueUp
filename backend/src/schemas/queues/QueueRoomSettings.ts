import { Schema } from 'mongoose';

export default new Schema(
	{
		queueVisible: {
			type: Boolean,
			required: true,
			default: true,
		},
		currentGuestVisible: {
			type: Boolean,
			required: true,
			default: true,
		},
		activityLogVisible: {
			type: Boolean,
			required: true,
			default: true,
		},
		requiresJoinPermission: {
			type: Boolean,
			required: true,
			default: false,
		},
		notifyGuestsOverride: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	{ _id: false, versionKey: false }
);
