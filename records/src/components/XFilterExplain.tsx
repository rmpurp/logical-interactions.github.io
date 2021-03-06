import * as React from "react";

import QueryDb from "./QueryDb";

import XFilterContainer from "./XFilterContainer";

import { getXFilterChroniclesSQL } from "../records/XFilter/setup";

interface XFilterExplainState {

}

export default class XFilterExplain extends React.Component<undefined, XFilterExplainState> {

  render() {
    return (<div>
      <h2 style={{style: "sticky", top: 0}}>
        Crossfilter Example
      </h2>
      <XFilterContainer />
      <p>
        This is one implementation of a cross-filter visualization. Crossfilers may have originated from a paper called <a href="http://ieeexplore.ieee.org/abstract/document/5204083/">Cross-Filtered Views for Multidimensional Visual Analysis</a> by Chris Weaver. The more popular, modern implementation is with Square <a href="http://square.github.io/crossfilter/">here</a>. This visualization is meant to help with identifying patterns in multi-dimensional data.  The design we have is slightly different from the Square one and closer to the original Weaver designs.  As you can see, the original distributions are fixed, and the filtered values are plotted on top.  While this gives context to the filtered versus original data, it can be difficult to read when the values differ too much.  So we added the zoom in option via scrolling on the chart. The Square implementation destructively updates the other views, denormalizing the scales based on the filtered data.
      </p>
      <p>
        While the map example is focused on demonstrating how the relational model of interactions help with managing state in the face of concurrency, the crossfilter example is to show case the power of using queries to express interactions. Below is a figure from the paper mentioned earlier, which would involve filters with many more types of data, and potentially other data filtering mechanisms as well.  How do we cope with the complexity?
      </p>
      <img src="media/weaver_xfilter.png" style={{maxWidth: "100%"}}/>
      <p>
        This simple visualization you see here actually has a lot of rather complicated implementations. Take the original <a href="https://github.com/square/crossfilter">crossfilter.js</a>, which has great engineering, and all the data operators are custom-built, running at around 1400 lines of code.  While we do not have a library, the way that crossfilter is offered as, we implicitly use a relational algebra engine (in this case, <a href="https://github.com/kripken/sql.js/">sql.js</a>), and we want to show that this general purpose data processing engine is enough for most of our needs. Our implementation is about 250 lines (though based on a database implementation that's many many lines more, so definitely not a fair direct comparison to the two crossfilter libraries, but just giving a sense of proportions)!
      </p>
      <p>
        We actually have the asynchronous version that talks to a SQL backend (or worker, both can be considered  remotes so far as asynchrony is concerned), and compared with <a href="https://github.com/mapd/mapd-crossfilter">the source code of MapD's asynchronous crossfilter</a>, (we think) ours offer a much simpler way to model the interaction and associated processes. Now let's take a look at how it's implemented.
      </p>
      <p>
        On top of the asynchronous version, we also implemented what we call "Chronicles", a design patterns that shouls the most recent interactions, to help you see more things when there is high latency (we have a post <a href="http://logical-interactions.github.io/chronicles">here</a>). Since the idea is to show some recent past, we can do this simply by extending the number of past interactions allowed. The code is below, where the LIMIT specifies the "buffer size".
      </p>
      <code>
        {getXFilterChroniclesSQL(3)}
      </code>
      <p>
        Through experience, we found that handing none data-centric transformations, such as layout and imperative manipulation, are not intuitive or simple with vanilla relational algebra.  However, the relational engine could work with imperative functions as well. Take the example of the zoom implementation --- since the transformation does not really require any new data and is just changing the scale.
      </p>
    </div>);
  }
}