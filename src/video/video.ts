import ffmpeg from 'fluent-ffmpeg';
import logging from '../logging/logging';
import is_linux from '../utils/is_linux';


if (is_linux()) {
    ffmpeg.setFfmpegPath("./ffmpeg/bin/ffmpeg.exe");
    ffmpeg.setFfprobePath("./ffmpeg/bin/ffprobe.exe");
}

export namespace video {

    let logger = logging.get_logger().withContext("video");



    export async function images_to_video(path: string, output: string, framerate: string = "25"): Promise<string> {

        return new Promise(async (resolve, reject) => {
            logger.info("Converting images to video");

            ffmpeg()
                .addOptions([
                    "-r", framerate,
                    "-framerate", framerate,
                    "-i", path,
                    "-c:v", path.split('.').pop(),
                    "-pix_fmt", "rgba",
                ])
                .output(output)
                .on('start', (commandLine) => {
                    logger.debug(commandLine);
                })
                .on('end', async () => {
                    logger.info("Converted images to video")
                    resolve(output);
                })
                .on('error', (err) => {
                    logger.error(err);
                    reject(err);
                }).run();

        });
    }

    export function combine_videos(input_one: string, input_two: string, output: string): Promise<string> {
        return new Promise((resolve, reject) => {
            logger.info("Combining videos");

            ffmpeg()
                .addOptions([
                    "-i", input_two,
                    "-i", input_one,
                    "-filter_complex", "overlay=W-w-10:10",
                    "-codec:a", "copy",
                    "-preset", "ultrafast",
                    "-threads", "0",

                ]).output(output)
                .on('start', (commandLine) => {
                    logger.debug(commandLine);
                })
                .on('end', async () => {
                    logger.info("Combined videos")
                    resolve(output);
                })
                .on('error', (err) => {
                    logger.error(err);
                    reject(err);
                }).run();
        })
    }

}