// VideoPlayerComponent.ts
import { _decorator, Component, VideoPlayer, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('VideoPlayerComponent')
export class VideoPlayerComponent extends Component {
  @property(VideoPlayer)
  videoPlayer: VideoPlayer = null;

  start() {
    this.videoPlayer.resourceType = VideoPlayer.ResourceType.REMOTE;
    this.videoPlayer.remoteURL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    this.videoPlayer.play();
  }
}