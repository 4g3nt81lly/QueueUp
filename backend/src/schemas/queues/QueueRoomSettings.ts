import { Schema } from 'mongoose';

export interface IQueueRoomSettings {
	queueVisible?: boolean;
	currentGuestVisible?: boolean;
	activityLogVisible?: boolean;
	requiresJoinPermission?: boolean;
	notifyGuestsOverride?: boolean;
}

export const editableQueueRoomSettingsPaths: (keyof IQueueRoomSettings)[] = [
	'queueVisible',
	'currentGuestVisible',
	'activityLogVisible',
	'requiresJoinPermission',
	'notifyGuestsOverride',
];

export default new Schema<IQueueRoomSettings>(
	{
		queueVisible: {
			type: Boolean,
			cast: 'Invalid type: key "settings.queueVisible"',
			get(value: any) {
				return value === undefined ? true : value;
			},
		},
		currentGuestVisible: {
			type: Boolean,
			cast: 'Invalid type: key "settings.currentGuestVisible"',
			get(value: any) {
				return value === undefined ? true : value;
			},
		},
		activityLogVisible: {
			type: Boolean,
			cast: 'Invalid type: key "settings.activityLogVisible"',
			get(value: any) {
				return value === undefined ? true : value;
			},
		},
		requiresJoinPermission: {
			type: Boolean,
			cast: 'Invalid type: key "settings.requiresJoinPermission"',
			get(value: any) {
				return value === undefined ? false : value;
			},
		},
		notifyGuestsOverride: {
			type: Boolean,
			cast: 'Invalid type: key "settings.notifyGuestsOverride"',
			get(value: any) {
				return value === undefined ? false : value;
			},
		},
	},
	{ _id: false, versionKey: false }
);
