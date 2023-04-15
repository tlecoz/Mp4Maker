export class Mp4Config {

    public width: number;
    public height: number;
    public fps: number = 30;
    public audio: boolean = false;
    public audioSamplerate: number = 44100;
    public nbAudioChannel: number = 1;
    public videoBitrate: number = 1e6;
    public audioBitrate: number = 128000;
    public fileName: string = "output.mp4";

    public fastEncodingBufferLimit: number = 50; //the maximum difference between the frame sent to VideoEncoder and the frame really encoded
    //you may use a lower value if you encode with a very high resolution like 4k

    constructor(descriptor: {
        width: number,
        height: number,
        fps?: number,
        audio?: boolean,
        fileName?: string,
        audioSamplerate?: number,
        nbAudioChannel?: number,
        audioBitrate?: number,
        videoBitrate?: number,
    }) {

        this.width = descriptor.width;
        this.height = descriptor.height;
        if (descriptor.fps) this.fps = descriptor.fps;
        if (descriptor.audio) this.audio = descriptor.audio;
        if (descriptor.fileName) this.fileName = descriptor.fileName;
        if (descriptor.audioSamplerate) this.audioSamplerate = descriptor.audioSamplerate;
        if (descriptor.videoBitrate) this.videoBitrate = descriptor.videoBitrate;
        if (descriptor.nbAudioChannel) this.nbAudioChannel = descriptor.nbAudioChannel;
        if (descriptor.audioBitrate) this.audioBitrate = descriptor.audioBitrate;
    }

    public get audioFrameBufferLength(): number {
        return Math.floor(this.audioSamplerate / this.fps);
    }
}