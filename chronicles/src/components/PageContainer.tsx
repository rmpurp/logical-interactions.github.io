import * as React from "react";

import MergedContainer from "./MergedContainer";
import SingleBufferContainer from "./SingleBufferContainer";
import Scatterplot from "./Scatterplot";
import ZoomContainer from "./ZoomContainer";
import CrossfilterContainer from "./CrossfilterContainer";
import { getScatterData, getFlightData } from "../lib/data";

interface PageContainerState {
  bufferSize: number;
  avgDelay: number;
  varDelay: number;
  encoding: string;
  ordered: boolean;
  color: string;
  disabled: boolean;
  policy: string;
  invalidate: boolean;
}

export default class PageContainer extends React.Component<undefined, PageContainerState> {
  m1: MergedContainer;
  m2: MergedContainer;
  m3: MergedContainer;
  m4: MergedContainer;
  mergedContainer: MergedContainer;
  s1: SingleBufferContainer;
  s2: SingleBufferContainer;
  s3: SingleBufferContainer;
  s: SingleBufferContainer;

  constructor() {
    super(undefined);
    this.onChange = this.onChange.bind(this);
    this.state = {
      bufferSize: 4,
      encoding: "COLOR", // "POSITION", //
      avgDelay: 2000,
      varDelay: 1000,
      ordered: true,
      disabled: false,
      color: "MULTI", // "BLUE"
      policy: "blocking",
      invalidate: false,
    };
  }

  onChange(event: any) {
    // hack, if can be coerced into number, coerce into number
    let value = parseInt(event.target.value, 10);
    value = isNaN(value) ? event.target.value : value;
    // should also reset state
    this.setState({ [event.target.name]: value });
  }
  componentDidMount() {
    // FIXME: this is kinda tedious...
    this.m1.updateSelection("Jan");
    this.m2.updateSelection("Jan");
    this.m3.updateSelection("Jan");
    this.m4.updateSelection("Jan");
    this.s1.updateSelection("Jan");
    this.s2.updateSelection("Jan");
    this.s3.updateSelection("Jan");
    this.s.updateSelection("Jan");
    this.mergedContainer.updateSelection("Jan");
  }

  // onChange(event: any) {
  //   this.setState({event.target.id, event.target.value});
  // }
  render() {
    let intro = (<>
      <h1>Designing with Asynchrony: Chronicles of Interaction</h1>
      <p>
        Often designers of visual analytic tools (or authoring tools like Tableau) assume that latency is low, and much effort has been put into making computation more efficient.  However it's not always possible to have guaranteed "interactive latency", of less than 500ms.
      </p>
      <p>
        In practice, these interactive speeds are quite challenging to deliver reliably, as the 95th percentile network latency exceeds 300ms for WiFi networks even if data processing time is ignored. This requirement poses a challenge for traditional visualization tools when applied in Cloud and Big Data environments
      </p>
      <p>
        Assuming short latencies causes visualizations to be not only unpleasant to use but often lead to wrong results. Visualizations break under long latency in different and often opaque ways.
      </p>
      <p>
        Hopefully, by the end of this post you will be convinced that one ought to <strong>design with latency in mind</strong>, that there is a simple, clean model to capture these asynchronous behaviors, and that there are a rich design space and many benefits!
      </p>
    </>);

    let singleBufferControl = (
      <>
        <p>You can play with different settings here:</p>
        <div className="controls">
          <label htmlFor="policy">Design:  </label>
          <select id="policy" name="policy" className="select" value={this.state.policy} onChange={this.onChange}>
            <option value="blocking">blocking</option>
            <option value="async">async</option>
            <option value="newest">newest</option>
          </select>
          <label htmlFor="invalidate">  invalidate:  </label>
          <select id="invalidate" name="invalidate" className="select" value={this.state.invalidate.toString()} onChange={this.onChange}>
          <option value="true">true</option>
          <option value="false">false</option>
          </select>
        </div>
      </>
    );
    let singleBufferVis = (<SingleBufferContainer
      ref={c => this.s = c}
      policy={this.state.policy}
      invalidate={this.state.invalidate}
    />);
    let singleBuffer = (<>
      <p>
        To start getting a sense of what it means to design with latency in mind.  Let's first take a look at a simple, <strong>blocking</strong> design that's often used in practice, for instance, in Tableau. The blocking interface prevents you from performing another interaction if the previous interaction has not loaded.
      </p>
      <p>
        To give you a better sense of what is going on with regards to the interaction requests and responses, we illustrate an "interaction timeline" to the right, where on the top row you will see the "accepted" interactions in blue, and "rejected" interactions in red cross. Your interactions may be rejected because the interface is busy processing your last response. And on the bottom row, the received responses of your interaction.
      </p>
      <p>This is an example without any latency</p>
      <SingleBufferContainer
        ref={c => this.s1 = c}
        policy={"blocking"}
        invalidate={false}
        avgDelay={0}
        varDelay={0}
      />
      <p>
        To make the set up more realistic, assign yourself a task of finding the maximum value of the year 2010 across the months, or see if it ever crosses 80, or maybe even try to grasp the basic trend across the months in the year 2010.
      </p>
    <SingleBufferContainer
      ref={c => this.s1 = c}
      policy={"blocking"}
      invalidate={false}
    />
    <p>
      This blocking design could be annoying if you no longer want to see the result that is being requested.  The following design allows you to intervene, and see only the most recent result.  You will see in the lower rows that your previously requested response is rejected, in red cross.
    </p>
    <SingleBufferContainer
      ref={c => this.s2 = c}
      policy={"newest"}
      invalidate={false}
    />
      <p>
      So this "non-blocking" interface is perhaps a bit better as it allows you to intervene whenever you please.  However, it still is subpar because you can only see one result at a time.  What if I just want to see all of the results as fast as possible?
    </p>
    <p>
      Our initial hypothesis is that perhaps people can still make sense of results out of order, if the task is simple enough, such as seeing if a month's value crossed a line. Perhaps you can give it a try.
    </p>
    <SingleBufferContainer
      ref={c => this.s3 = c}
      policy={"async"}
      invalidate={false}
    />
    <p>
      We found, through an experiment on Mechanical Turk, that people were very reluctant to experience the results arriving randomly---they just waited for the previous result to arrive.  Which got us thinking... Can there be anything that helps?  We know that websites load asynchronously all the time (think Facebook, Twitter, Gmail), and often we can make progress using the application without waiting for the whole thing to have loaded. Are there any ideas we can borrow from there?
    </p>
    {singleBufferControl}
    {singleBufferVis}
    </>
    );
    let control = (
      <div className="controls">
        <label htmlFor="encoding">Design:  </label>
        <select id="encoding" name="encoding" className="select" value={this.state.encoding} onChange={this.onChange}>
          <option value="POSITION">Multiples</option>
          <option value="COLOR">Overlay</option>
        </select>
        <label htmlFor="encoding">  Buffer Size:  </label>
        <select id="bufferSize" name="bufferSize" className="select" value={this.state.bufferSize.toString()} onChange={this.onChange}>
          <option value="1">1</option>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="12">12</option>
        </select>
        <label htmlFor="color">  Encoding of history:  </label>
        <select id="color" name="color" className="select" value={this.state.color.toString()} onChange={this.onChange}>
        <option value="BLUE">shades of blue</option>
        <option value="MULTI">multiple colors</option>
        </select>
      </div>
    );
    let vis = (
      <MergedContainer
        ref={c => this.mergedContainer = c}
        bufferSize={this.state.bufferSize}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={this.state.encoding}
        ordered={this.state.ordered}
        color={this.state.color}
        disabled={this.state.disabled}
      />);

    let chronicles = (<>
      <h2>
        What if all the results will always be on the screen?
      </h2>
      <p>For multiple results to be meaningful, we added some annotation to the charts, which brings the following design you see, go ahead and play with the visualization.
      </p>
      <MergedContainer
        ref={c => this.m1 = c}
        bufferSize={100}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={"POSITION"}
        ordered={this.state.ordered}
        color={"BLUE"}
        disabled={this.state.disabled}
        naiveImplementation={true}
        label={true}
      />
      <p>
        Hopefully, you have discovered that you can interact in parallel and make sense of the results.  We hypothesize that this effect is because the history of all the interactions creates a  <strong>stable</strong> interface that will not change randomly due to latency, as is seen in previous cases.
      </p>
      <p>
        If the key here is to use history to transform transient interactions into something stable, we probably do not need to show <i>all</i> of history---see below for an example with a limited buffer.  In fact, there are generic, well-established visualization mechanisms that support these goals--- below is a quote from Tufte that grounds our proposed design.
      </p>
      <div className="quote">
        <p>
          Spatial parallelism takes advantage of our notable capacity to compare and reason about multiple images that appear simultaneously within our eyespan. We are able to canvass, sort, identify, reconnoiter, select, contrast, review -- ways of seeing all quickened and sharpened by the direct spatial adjacency of parallel elements.
          </p><p>
          Parallel images can also be distributed temporally, with one like image following another, parallel in time.</p>
      </div>
      <MergedContainer
        ref={c => this.m2 = c}
        bufferSize={4}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={"POSITION"}
        ordered={this.state.ordered}
        color={"BLUE"}
        disabled={this.state.disabled}
      />
      <p>
        We also started thinking, if this is just visualizing history, time is essentially just another dimension to be visualized, we are not limited to using small multiples. We can overlay the charts, as follows.
        {/* Besides the "buffer" size, It turns out that there is a lot you can play around with, like how to compose the multiple resulting charts, how many past results to show, whether to order the color encodings and so on.  For a different example in the design space, see below.  You can also play with the settings in the control bar. */}
      </p>
      <MergedContainer
        ref={c => this.m3 = c}
        bufferSize={4}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={"COLOR"}
        ordered={this.state.ordered}
        color={"BLUE"}
        disabled={this.state.disabled}
      />
      <p>
        Furthermore, if we just need to show correspondence between the interaction and the result, we can change how we encode interaction history --- doesn't have to be shades of the same color.
      </p>
      <MergedContainer
        ref={c => this.m4 = c}
        bufferSize={8}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={"COLOR"}
        ordered={this.state.ordered}
        color={"MULTI"}
        disabled={this.state.disabled}
      />
      <h2>
        Our design for supporting asynchrony has three parts: visualizing interaction history, displaying multiple visualization states corresponding to multiple interactions, and visualizing the <i>correspondence</i> between interaction requests and visualization responses, so that users can pair them up intuitively.
      </h2>
      <p>
        Play around with the parameters of this design, which we are calling "chronicles" (as in chronicling your interactions).  If you change the buffer size to 1, it reduces to the original designs we talked about earlier.
      </p>
      {control}
      {vis}
      <p>
        We speculate that different corners in the design space will have different tradeoffs and should be adapted to different kinds of visualizations and tasks.  However, a more pressing question on your mind at this point is probably... </p>
      <h2>
        How to generalize chronicles?
      </h2>
    </>);
    let moreDesignsScatter = (<>
      <p>
        Asynchronous designs could be applied to other scenarios that don't seem "parallelizable" immediately.
        We hope the following examples could illustrate ways to generalize asynchronous designs with <i>chronicles</i>---just visualize short-term history and the correspondence between interaction and the corresponding results!
      </p>
      <p>
        See the following example of zooming on a scatter plot.  Everytime you interact, the corresponding interaction shows up immediately, with a small legend that is your actual interaction, so you know that your interaction is acknowledged and remind you of what the result is actually for.
      </p>
    </>);
    let scatterData = getScatterData(800);
    let scatter = (
      <ZoomContainer
        bufferSize={this.state.bufferSize}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        encoding={this.state.encoding}
        ordered={this.state.ordered}
        color={this.state.color}
        dataset={scatterData}
      />
    );
    let moreDesignsCrossfilter = (<p>
      Here is an example of cross-filter using chronicles.  Use the top row, light green colored visualizations to interact (the generated charts cannot be interacted with).  The small black bar on the bottom indicates the specification of the brush that was used to filter the value.  As you interact, new data will be appended, in reverse order.  Cross-filter is a fairly complex interaction, and you can still apply <i>Chronicles</i>.  The key here is to ensure that the controls are <b>data independent</b>, which means that you are free to specify your interactions regardless of the loading situation. It also helps to stabilize your navigation as well.
    </p>);
    let crossfilterData = getFlightData();
    let crossfilter = (<>
      <CrossfilterContainer
        dataset={crossfilterData}
        avgDelay={this.state.avgDelay}
        varDelay={this.state.varDelay}
        multipleHeight={150}
        multipleWidth={200}
      />
      <p>
        In fact, having a notebook style persistence of visualizations results can be pretty handy for comparisons.  For the future, we plan to support "clipping" interesting interaction results, so that they will not be buffered out.
      </p>
      </>
    );
    let conclusion = (<>
      <h2>
        For generic user interfaces.
      </h2>
      <p>This technique could apply pretty generally to all UIs---most user interface can be thought of as a visualization of some information (see Bret Victor's <a href="http://worrydream.com/MagicInk/">magic ink</a>).  For instance, sometimes entering a value in a form may bring up a different popup window that takes forever to load; it would be great to have <i>Chronicles</i>.
      </p>
      <p>
        We don't think that this is the only solution for what we call <i>slow interactions</i>, there are other techniques like progressively showing results as they update. It would look something like the following:
      </p>
      <MergedContainer
        bufferSize={1}
        avgDelay={this.state.avgDelay * 0.3}
        varDelay={this.state.varDelay * 0.3}
        encoding={"POSITION"}
        ordered={true}
        color={"BLUE"}
        disabled={false}
        naiveImplementation={false}
        label={true}
        progressive={true}
      />
      <p>
      In fact, you can compose the two techniques together. <i>Chronicles</i> is probably not going to help if the latency is longer than 30 seconds, which can happen with larger data/more complex computation, and progressive visualizations could also potentially take a while, especially if the user wants to have some threshold of the error bound. Below is an example composing the views.
      </p>
      <MergedContainer
        bufferSize={4}
        avgDelay={this.state.avgDelay * 0.3}
        varDelay={this.state.varDelay * 0.3}
        encoding={"POSITION"}
        ordered={true}
        color={"BLUE"}
        disabled={false}
        naiveImplementation={false}
        label={true}
        progressive={true}
      />
      {/* <p>
        Of course, these techniques together may make the visualization complicated --- with animations that are external to the data itself, but an artifact of the system.  However, we are not new to working with software/hardware limits --- almost all of HCI design <i>is</i> working with some constraints. It's just that we have one more complication here.
      </p> */}
      <p>
      Lastly, chronicles designs are none trivial to implement and require a "time-centric" way to treat the application. We will talk about that in another article.
      </p>
      </>);
    return (
      <>
        {intro}
        {singleBuffer}
        {chronicles}
        {moreDesignsScatter}
        {scatter}
        {moreDesignsCrossfilter}
        {crossfilter}
        {conclusion}
      </>
    );
  }
}