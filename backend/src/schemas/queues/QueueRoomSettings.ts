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
			get(value: any) {
				return value === undefined ? true : value;
			},
		},
		currentGuestVisible: {
			type: Boolean,
			get(value: any) {
				return value === undefined ? true : value;
			},
		},
		activityLogVisible: {
			type: Boolean,
			get(value: any) {
				return value === undefined ? true : value;
			},
		},
		requiresJoinPermission: {
			type: Boolean,
			get(value: any) {
				return value === undefined ? false : value;
			},
		},
		notifyGuestsOverride: {
			type: Boolean,
			get(value: any) {
				return value === undefined ? false : value;
			},
		},
	},
	{ _id: false, versionKey: false }
);
