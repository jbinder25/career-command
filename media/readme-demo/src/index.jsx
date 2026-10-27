import {registerRoot,Composition} from 'remotion';
import {Story,TOTAL} from './Story.jsx';
import {Teaser,TEASER_TOTAL} from './Teaser.jsx';
import {TeaserV2,TEASER_V2_TOTAL} from './TeaserV2.jsx';
import {TeaserV2Landscape} from './TeaserV2Landscape.jsx';
registerRoot(()=> <><Composition id="Story" component={Story} durationInFrames={TOTAL} fps={15} width={1200} height={675}/>
<Composition id="Teaser" component={Teaser} durationInFrames={TEASER_TOTAL} fps={30} width={1080} height={1920}/>
<Composition id="TeaserV2" component={TeaserV2} durationInFrames={TEASER_V2_TOTAL} fps={30} width={1080} height={1920}/>
<Composition id="TeaserV2Landscape" component={TeaserV2Landscape} durationInFrames={TEASER_V2_TOTAL} fps={30} width={1920} height={1080}/></>);
