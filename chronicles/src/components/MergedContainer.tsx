import * as React from "react";

import Chart from "./Chart";
import WidgetFacet from "./WidgetFacet";
import MultiplesChart from "./MultiplesChart";

import { ColorScales } from "../lib/chronicles";
import { Events } from "../lib/illustration";
import { Datum, getData } from "../lib/data";

interface MergedContainerProps {
  avgDelay: number;
  varDelay: number;
  encoding: string;
  bufferSize: number;
  color: string;
  ordered: boolean;
  disabled: boolean;
  naiveImplementation?: boolean;
  label?: boolean;
  progressive?: boolean;
  maxProgressive?: number;
}

interface MergedContainerState {
  datasets: { [index: string]: Datum[] };
  selected: string[];
  currentItxId: number;
  evictedIdx: number;
  // below are optional for multiples
  multipleHeight?: number;
  multipleWidth?: number;
  // hack
  progressiveCount?: { [index: string]: number };
}

/**
 * Stateful container for all the interaction elements.
 */
export default class MergedContainer extends React.Component<MergedContainerProps, MergedContainerState> {
  _isMounted: boolean;
  static defaultProps = {
    naiveImplementation: false,
    label: false,
    progressive: false,
    maxProgressive: 10,
  };

  constructor(props: MergedContainerProps) {
    super(props);
    this.updateSelection = this.updateSelection.bind(this);
    this.processResponse = this.processResponse.bind(this);
    this.registerProgressive = this.registerProgressive.bind(this);
    let progressiveCount = {};
    this.state = {
      datasets: {},
      // to make it less awkward, always select janualary as selected
      selected: [],
      currentItxId: 0,
      evictedIdx: -1,
      progressiveCount
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Updates state when a new interaction occurs by maintaining an LRU cache
   * of recently selected items. The most recent item is positioned at the
   * end of the array.
   * @param {string} selection
   */
  updateSelectedState(selection: string) {
    this.setState((prevState, props) => {
      let selected;
      const idx = prevState.selected.indexOf(selection);
      if (idx > -1) {
        // item exists in cache, remove it for re-insertion at the end
        selected = prevState.selected.slice();
        selected.splice(idx, 1);
      } else {
        if (prevState.selected.length < this.props.bufferSize) {
          selected = prevState.selected.slice();
        } else {
          // cache is full, evict least recently used item from cache
          delete prevState.datasets[prevState.selected[0]];
          selected = prevState.selected.slice(1);
        }
      }
      selected.push(selection);
      return {
        datasets: prevState.datasets,
        selected: selected,
        currentItxId: 0,
        evictedIdx: (prevState.evictedIdx + 1) % props.bufferSize,
      };
    });
  }

  /**
   * Processes the response received by adding the dataset to the cache if
   * it has been selected.
   * @param {number} taskNum
   * @param {string} selection
   * @param {Datum[]} data
   */
  processResponse(response: any) {
    if (this._isMounted) {
      const {selection, data, itxid} = response;
      this.setState(prevState => {
        if (prevState.selected.indexOf(selection) > -1) {
          const datasets = Object.assign({}, prevState.datasets);
          datasets[selection] = data;
          // since it's still in selected, as again
          if ((this.props.progressive) && (this.state.progressiveCount[selection] < this.props.maxProgressive)) {
            this.registerProgressive(selection);
            // hack, react async issue
            let count = this.state.progressiveCount[selection];
            // console.log("COUNT", count);
            getData(selection, this.props.avgDelay, this.props.varDelay, itxid, count)
            .then(this.processResponse);
          }
          return { datasets };
        }
      });
    }
  }

  registerProgressive(selection: string) {
    this.setState(prevState => {
      if (selection in this.state.progressiveCount) {
        prevState.progressiveCount[selection] += 1;
      } else {
        prevState.progressiveCount[selection] = 1;
      }
      return prevState;
    });
  }

  /**
   * Handles updates from widget. Updates selected cache state, sends
   * server request for data, and processes the results.
   * We should be using id for any complex data vis but for now do not
   *   use id and hack with taskNum.
   * @param {string} selection
   */
  updateSelection(selection: string) {
    const { currentItxId, datasets, selected, progressiveCount } = this.state;
    if (this.props.disabled) {
      // no-op
      return;
    }

    const isSelected = (selected.indexOf(selection) > -1);
    const isRequesting = datasets[selection] == null;
    this.updateSelectedState(selection);
    const itxid = currentItxId + 1;
    this.appendNewInteraction(selection, isSelected, isRequesting);
    if (!isSelected) {
      if (this.props.progressive) {
        this.registerProgressive(selection);
        let count = this.state.progressiveCount[selection] ?  this.state.progressiveCount[selection] : 1;
        // console.log("COUNT", count);
        getData(selection, this.props.avgDelay, this.props.varDelay, itxid, count)
        .then(this.processResponse);
      } else {
        getData(selection, this.props.avgDelay, this.props.varDelay, itxid, -1)
        .then(this.processResponse);
      }
    }
  }

  /**
   * Generates a unique ixn ID for this widget that's monotonically increasing,
   * and appends a new log record to the event log
   */
  appendNewInteraction(selection: string, isSelected: boolean, isRequesting: boolean) {
    this.setState(prevState => {
      const currentItxId = prevState.currentItxId + 1;
      let event;
      if (isSelected) {
        if (isRequesting) {
          event = Events[Events.requesting];
        } else {
          event = Events[Events.cached];
        }
      } else {
        event = Events[Events.interaction];
      }
      return { currentItxId };
    });
  }

  render() {
    const { bufferSize, ordered, color, naiveImplementation, label } = this.props;
    const { multipleHeight, datasets, multipleWidth, selected, evictedIdx } = this.state;

    let colorScale;
    if (ordered) {
      colorScale = ColorScales[color](bufferSize);
    } else {
      colorScale = ColorScales[color](bufferSize, evictedIdx);
    }
    let chart;
    let widgetBufferSize = bufferSize;
    if (naiveImplementation) {
      widgetBufferSize = 1;
    }
    let widget = <WidgetFacet
    // id={widgetId}
    bufferSize={widgetBufferSize}
    facets={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
    datasets={datasets}
    selected={selected}
    updateSelection={this.updateSelection}
    colorScale={colorScale}
  />;
    if (this.props.encoding === "COLOR") {
      chart = <Chart
        bufferSize={this.props.bufferSize}
        datasets={datasets}
        selected={selected}
        xDomain={[2008, 2012] /* hardcoded */}
        yDomain={[0, 100] /* hardcoded */}
        colorScale={colorScale}
      />;

    } else {
      chart = <MultiplesChart
        bufferSize={bufferSize}
        datasets={datasets}
        multipleHeight={multipleHeight}
        multipleWidth={multipleWidth}
        selected={selected}
        setDomain={false}
        ordered={ordered}
        evictedIdx={evictedIdx}
        colorScale={colorScale}
        label={label}
      />;
    }
    return (
      <div>
        {widget}
        {chart}
      </div>
    );
  }
}
