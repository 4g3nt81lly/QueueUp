import Constants from '~/shared/constants';
import Patterns from '~/shared/patterns';

export function isPlainObject(object: any) {
	return object?.constructor === Object;
}

export function validateQueueRoomCapacity(value: any) {
	if (!Number.isInteger(value)) {
		return false;
	}
	return value === -1 || (value > 0 && value <= Constants.QROOM_MAX_CAPACITY);
}

export function validateQueueRoomEmoji(value: any) {
	if (typeof value !== 'string') {
		return false;
	}
	const matches = [...value.matchAll(Patterns.QROOM_EMOJI)];
	if (matches.length !== 1) {
		return false;
	}
	const emoji = matches[0][0];
	return [...emoji].length === [...value].length;
}
