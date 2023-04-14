# Mp4Maker

Based on [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) , this class allow you to encode a MP4 file , frame by frame, 
directly in the browser on the client-side using WebCodecs. 

The project contains only 2 classes : Mp4Maker and Mp4Config. 

Mp4Config is an object that describe the properties of the output mp4.

```
    public width: number;
    public height: number;
    public fps: number = 30;
    public audio: boolean = false;
    public audioSamplerate: number = 44100;
    public nbAudioChannel: number = 1;
    public videoBitrate: number = 1e6;
    public audioBitrate: number = 128000;
    public fileName: string = "output.mp4";
    
    public get audioFrameBufferLength(): number {
        return this.audioSamplerate / this.fps;
    }  
```

Mp4Maker contains only 3 methods : 

```
public init(config: Mp4Config) {
   //setup and initialize Muxer, VideoEncoder and AudioEncoder (if requird)
}

public encodeFrame(frame: { video: ImageBitmap , audio?: Float32Array[] }){
    
     //frame.video : the current video-frame shaped as ImageBitmap 
     //frame.audio : an array of Float32Array. Each Float32Array represents an audio channel.
     //              the length of each Float32Array must equal mp4config.audioFrameBufferLength

}

public finish(){
    //stop the encoder and save the video as an MP4 file
}

```

check main.ts to see a complete example that expose how to encode a canvas-movie frame by frame with an audiotrack containing a basic generated sin wave 


