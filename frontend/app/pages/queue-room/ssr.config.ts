import type { PageRenderConfig } from '$/types';

export default {
	path: '/queue/:queueId',
	render({ render }) {
		return render.renderQueueRoomPage();
	},
	postprocess({ request, templateHTML, renderResult }) {
		const { queueId } = request.params;
		const { head = '', body } = renderResult;
		return templateHTML
			.replace('<!--queue-room-id-->', ` ${queueId}`)
			.replace('<!--queue-room-head-->', head)
			.replace('<!--queue-room-root-->', body);
	},
} satisfies PageRenderConfig;
