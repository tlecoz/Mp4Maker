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

const durationInSecond = 5;
const nbFrame = config.fps * durationInSecond;
let frameCount = 0;


const createVideoFrame = async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff0000";
    ctx.fillRect((canvas.width - 100) * frameCount / (nbFrame - 1), (canvas.height - 100) * frameCount / (nbFrame - 1), 100, 100);

    return await createImageBitmap(canvas)
}

let speed = 0.1;
let sinWaveProgress = 0;

const createAudioFrame = () => {

    const nbAudioChannel = config.nbAudioChannel;
    const bufferLen = config.audioFrameBufferLength;
    const audioFrame = [];
    let buffer: Float32Array;
    for (let i = 0; i < config.nbAudioChannel; i++) {
        audioFrame[i] = buffer = new Float32Array(bufferLen);
        for (let j = 0; j < bufferLen; j++) buffer[j] = Math.sin(i + (sinWaveProgress + j) * speed / (i + 1));
    }
    sinWaveProgress += bufferLen;

    return audioFrame;
}

const createFrame = async () => {

    if (frameCount === nbFrame) {
        mp4Maker.finish();
        return;
    }

    const video = await createVideoFrame();
    const audio = config.audio ? createAudioFrame() : undefined;

    mp4Maker.encodeFrame({
        video,
        audio
    })

    frameCount++;
}


const animate = () => {
    createFrame();
    if (frameCount === nbFrame) return;
    requestAnimationFrame(animate);
}
animate();


