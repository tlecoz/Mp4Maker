import { Mp4Config } from "./Mp4Config";
import { Mp4Maker } from "./Mp4Maker";

const scale = 0.5;
const config = new Mp4Config({
    width: 1920 * scale,
    height: 1080 * scale,
    fps: 60,
    audio: true,
    nbAudioChannel: 2
})


const mp4Maker = new Mp4Maker();
mp4Maker.init(config);







const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = config.width;
canvas.height = config.height;
document.body.appendChild(canvas);

const durationInSecond = 10;
const nbFrame = config.fps * durationInSecond;


const createVideoFrame = async (frameId: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "120px verdana";
    ctx.fillText("frame : " + frameId, 30, 300);
    ctx.fill();


    return await createImageBitmap(canvas)
}

let speed = 0.1;
let sinWaveProgress = 0;

const createAudioFrame = (frameId: number) => {

    const nbAudioChannel = config.nbAudioChannel;
    const bufferLen = config.audioFrameBufferLength;
    const audioFrame = [];
    let buffer: Float32Array;
    for (let i = 0; i < nbAudioChannel; i++) {
        audioFrame[i] = buffer = new Float32Array(bufferLen);
        for (let j = 0; j < bufferLen; j++) buffer[j] = Math.sin(i + (sinWaveProgress + j) * speed / (i + 1));
    }
    sinWaveProgress = frameId * bufferLen;

    return audioFrame;
}

const createFrame = async (frameId: number) => {
    return new Promise(async (onResolve: (o: { video: ImageBitmap, audio?: Float32Array[] }) => void, onError: (e: any) => void) => {
        //console.log("f ", frameId)

        try {
            const video = await createVideoFrame(frameId);
            const audio = config.audio ? createAudioFrame(frameId) : undefined;

            onResolve({
                video,
                audio
            });
        } catch (e) {
            onError(e);
        }

    })

}

mp4Maker.fastEncode(nbFrame, createFrame)





