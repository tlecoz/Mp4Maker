import { Mp4Config } from "./Mp4Config";
import Mp4Muxer from "mp4-muxer";

export class Mp4Maker {

    protected config: Mp4Config;

    protected muxer: any;
    protected videoEncoder: VideoEncoder;
    protected audioEncoder: AudioEncoder;
    protected startTime: number;
    protected recording: boolean = false;
    protected audioTrack: any = null;
    protected intervalId: number = null;
    protected lastKeyFrame: number = -Infinity;
    protected frameGenerated: number = 0;




    constructor() {

    }

    public init(config: Mp4Config) {

        this.config = config;

        this.muxer = new Mp4Muxer.Muxer({
            target: new Mp4Muxer.ArrayBufferTarget(),
            video: {
                codec: 'avc',
                width: this.config.width,
                height: this.config.height
            },
            audio: this.config.audio ? {
                codec: 'aac',
                sampleRate: this.config.audioSamplerate,
                numberOfChannels: this.config.nbAudioChannel
            } : undefined,
            firstTimestampBehavior: 'permissive' // Because we're directly pumping a MediaStreamTrack's data into it
        });

        //-------

        this.videoEncoder = new VideoEncoder({
            output: (chunk: EncodedVideoChunk, meta: any) => {

                this.muxer.addVideoChunk(chunk, meta)
            },
            error: e => console.error(e)
        })
        this.videoEncoder.configure({
            codec: 'avc1.640028',
            width: this.config.width,
            height: this.config.height,
            bitrate: this.config.videoBitrate
        })

        //--------

        if (this.config.audio) {

            this.audioEncoder = new AudioEncoder({
                output: (chunk: EncodedAudioChunk, meta: any) => this.muxer.addAudioChunk(chunk, meta),
                error: e => console.error(e)
            });

            this.audioEncoder.configure({
                codec: 'mp4a.40.2',
                numberOfChannels: this.config.nbAudioChannel,
                sampleRate: this.config.audioSamplerate,
                bitrate: this.config.audioBitrate
            })

        }
    }





    public encodeFrame(frame: {
        video: ImageBitmap
        audio?: Float32Array[]
    }) {
        if (!this.muxer) return;

        if (!this.recording) {
            this.recording = true;
            this.startTime = new Date().getTime();
        }

        const videoTimestamp = this.frameGenerated * this.config.videoBitrate / this.config.fps;
        const audioTimestamp = this.frameGenerated * this.config.audioBitrate / this.config.fps;

        let videoFrame: VideoFrame = new VideoFrame(frame.video, {
            timestamp: videoTimestamp
        })

        let audioData: AudioData;
        if (frame.audio) {

            let nbChannel = frame.audio.length;
            let bufferLen = frame.audio[0].length;
            let data = new Float32Array(nbChannel * bufferLen);

            for (let i = 0; i < nbChannel; i++) {
                data.set(frame.audio[i], i * bufferLen);
            }

            audioData = new AudioData({
                format: 'f32-planar',
                sampleRate: this.config.audioSamplerate,
                numberOfFrames: bufferLen,
                numberOfChannels: nbChannel,
                timestamp: audioTimestamp, // When the audio plays, like timestamp on VideoFrame
                data
            });

        }

        this.frameGenerated++;


        //--------
        let time = new Date().getTime() - this.startTime
        let needsKeyFrame = time - this.lastKeyFrame >= 10000;
        if (needsKeyFrame) this.lastKeyFrame = time;



        this.videoEncoder.encode(videoFrame, { keyFrame: needsKeyFrame });
        videoFrame.close();

        if (this.config.audio) {
            this.audioEncoder.encode(audioData);
            audioData.close();
        }

    }


    public async finish() {

        await this.videoEncoder.flush();
        if (this.audioEncoder) await this.audioEncoder.flush();


        this.muxer.finalize();

        let buffer = this.muxer.target.buffer;
        this.downloadBlob(new Blob([buffer]));

        this.videoEncoder = null;
        this.audioEncoder = null;
        this.config = null;
        this.muxer = null;
        this.recording = false;
        this.lastKeyFrame = -Infinity;
        this.frameGenerated = 0;
    }


    protected downloadBlob(blob: Blob) {
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = this.config.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }



}