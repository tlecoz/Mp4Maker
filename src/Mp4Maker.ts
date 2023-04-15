import { Mp4Config } from "./Mp4Config";
import Mp4Muxer from "mp4-muxer";

export class Mp4Maker {

    protected config: Mp4Config;

    protected muxer: any;
    protected videoEncoder: VideoEncoder;
    protected audioEncoder: AudioEncoder;
    protected recording: boolean = false;
    protected audioTrack: any = null;
    protected intervalId: number = null;
    protected lastKeyFrame: number = -Infinity;
    protected frameGenerated: number = 0;

    //---- fast encode properties ------------
    protected nbVideoChunkEncoded: number = 0;
    protected nbAudioChunkEncoded: number = 0;
    protected waiting: boolean = false;
    protected encodeNextFrame: () => void;


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
                this.nbVideoChunkEncoded++;
                this.muxer.addVideoChunk(chunk, meta);


                if (this.waiting) {
                    if (this.canEncode) {
                        this.waiting = false;
                        this.encodeNextFrame();
                    }
                }

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
                output: (chunk: EncodedAudioChunk, meta: any) => {
                    this.nbAudioChunkEncoded++;
                    this.muxer.addAudioChunk(chunk, meta);

                    if (this.waiting) {
                        if (this.canEncode) {
                            this.waiting = false;
                            this.encodeNextFrame();
                        }
                    }
                },
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





    public get canEncode(): boolean {
        return this.frameGenerated - this.nbVideoChunkEncoded < this.config.fastEncodingBufferLimit;
    }


    public encodeFrame(frame: {
        video: ImageBitmap
        audio?: Float32Array[]
    }): boolean {



        if (!this.muxer) return false;



        let needsKeyFrame = this.frameGenerated % 300 === 0;

        if (!this.recording) {
            this.recording = true;
            this.frameGenerated = 1;
            needsKeyFrame = true;
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



        this.videoEncoder.encode(videoFrame, { keyFrame: needsKeyFrame });
        videoFrame.close();

        if (this.config.audio) {
            this.audioEncoder.encode(audioData);
            audioData.close();
        }

        if (!this.canEncode) {
            this.videoEncoder.flush();
            this.waiting = true;
        }

        return true;
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
        this.waiting = false;
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




    public fastEncode(nbFrame: number, createFrame: (frameId: number) => Promise<{ video: ImageBitmap, audio?: Float32Array[] }>) {

        this.recording = true;
        this.frameGenerated = 1;
        let completed: boolean = false;
        this.encodeNextFrame = async () => {
            if (completed || this.waiting) return;

            const frame: { video: ImageBitmap, audio?: Float32Array[] } = await createFrame(this.frameGenerated);

            this.encodeFrame(frame)

            if (this.frameGenerated === nbFrame) {

                completed = true;
                this.finish();
            } else {

                if (!this.waiting) this.encodeNextFrame();
            }






        }
        this.encodeNextFrame();
    }

}