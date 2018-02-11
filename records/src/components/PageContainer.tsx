import * as React from "react";

import AsyncContainer from "./AsyncContainer";

export default class PageContainer extends React.Component<undefined, undefined> {
  render() {
    // let applications = (<>
    //   <h2>Throttling and Caching</h2>
    //   <h2>Undo/Redo, Logging</h2>
    //   <h3>Scenting</h3>
    //   <h3>Notebook</h3>
    //   <p>Jupyter Notebooks are wildly popular, and one of the reasons is that just as real notebooks, we tend to save previous results. This can help us think better (see literature in distributed cognition).</p>
    // </>);
    return (<>
      <h1>Stateful UX</h1>
      <h3 style={{textAlign: "right", lineHeight: "70%"}}>Let's Make (UI) History!</h3>
      <AsyncContainer />
    </>);
  }
}