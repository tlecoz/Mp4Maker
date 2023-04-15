# Mp4Maker

Based on [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) , this project provide a straight forward way to encode a MP4 file , frame by frame, directly in the browser on the client-side using WebCodecs. 

You can install de dependancies with this command :
```
npm install mp4maker
```


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

Mp4Maker contains only 4 methods : 

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


public fastEncode(nbFrame: number, createFrame: (frameId: number) => Promise<{ video: ImageBitmap, audio?: Float32Array[] }>) {
    //use this method if you want to update the encoding process faster than requestAnimationFrame
    //
    //nbFrame : the duration , in frame, of the video. 
    //createFrame: a function that return an object {video:ImageBitmap,audio?:Float32Array[]} that represent the current frame to encode
    //
    //the process will call createFrame(frameId) then call encodeFrame until frameId != nbFrame
    //when frameId === nbFrame, call finish 
    //
    //it also ensure that VideoEncoder cannot be saturated by data during the process and create some "breathing" to let VideoEncoder 
    //the time to work efficiently 

}

```

check Example1.ts to see a complete example that expose how to encode a canvas-movie frame by frame with an audiotrack containing a basic generated sin wave 

Here is a working demo : https://mp4maker.netlify.app/

(well, it's a working demo on a computer. AAC encoding (and maybe VideoEncoding, not sure) is not supported on mobile browser yet ; WebCodec is still a very recent feature, we have tp be a bit patient... )

-----

I added a second example that show how to use Mp4Maker.fastEncode 
Demo : https://mp4maker-fastencode.netlify.app/




