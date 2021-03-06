import * as React from "react";
import * as d3 from "d3";

import { db } from "../sql/setup";
import { brushItx, removeBrush, brushStartItx, brushEndItx } from "../sql/streaming/customSetup";
import { Datum } from "../lib/data";
import { getFormattedTime, SelectionDesign } from "../lib/helper";
import { SvgSpinner } from "./SvgSpinner";


interface LineChartProps {
  design: SelectionDesign;
  label: string;
  height?: number;
  spinnerRadius?: number;
  width?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  yDomain?: [number, number];
}

interface LineChartState {
  data: Datum[];
  low: number;
  high: number;
}

export default class LineChart extends React.Component<LineChartProps, LineChartState> {
  // these brushing pattern is really ugly
  // think about better abstractions around these
  brushG: SVGGElement;
  brush: d3.BrushBehavior<{}>;
  x: d3.ScaleLinear<number, number>;
  static defaultProps = {
    colorOverride: false,
    height: 200,
    spinnerRadius: 20,
    marginBottom: 40,
    marginLeft: 50,
    marginRight: 50,
    marginTop: 20,
    width: 600,
  };
  constructor(props: LineChartProps) {
    super(props);
    this.removeBrushPixels = this.removeBrushPixels.bind(this);
    this.state = {
      data: null,
      low: null,
      high: null
    };
  }
  componentDidMount() {
    db.create_function("removeBrushPixels", this.removeBrushPixels);
  }

  setLineChartDataState(data: Datum[]) {
    // console.log("setting line chart state", data);
    this.setState({data});
  }

  setLineChartFilter(low: number, high: number) {
    // console.log(`Setting the filter low and highs`, low, high);
    this.setState({low, high});
  }

  removeBrushPixels() {
    // if the last interaction was a fixed one, do NOT remove
    // let r = db.exec(`select itxFixType from currentUserBrush`);
    // if ((r.length > 0) && r[0].values && (r[0].values[0][0] === "data")) {
    d3.select(this.brushG).call(this.brush.move, null);
    // }
  }


  render() {
    let { width, height, marginLeft, marginRight, marginTop, marginBottom, spinnerRadius } = this.props;
    let { data } = this.state;
    let spinner: JSX.Element = null;
    let vis: JSX.Element = null;

    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;

    if (data) {
      let y = d3.scaleLinear()
                .rangeRound([innerHeight, 0])
                .domain(d3.extent(data, (d) => d.y));
      let x = d3.scaleLinear()
                .rangeRound([0, innerWidth])
                .domain(d3.extent(data, (d) => d.x));
      this.x = x;
      let lineMapping = d3.line<Datum>().x((d) => x(d.x)).y((d) => y(d.y));
      let line = lineMapping(data);
      let brushedLine = null;
      if (this.state.low && this.state.high) {
        brushedLine = lineMapping(data.filter((d) => ((d.x < this.state.high) && (d.x > this.state.low))));
      }
      let removeBrushPixelsAlias = this.removeBrushPixels;
      // let update = this.updateBrushState;
      // let clearLockInterval = this.props.clearLockInterval;
      let brush = d3.brushX()
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("start", function() {
          // say that the brush has started, and the data should NOT render
          if ((d3.event.sourceEvent) && (d3.event.sourceEvent.type === "mousedown")) {
            brushStartItx();
          }
        })
        .on("end", function() {
          let itxFixType = "data";
          if ((d3.event.sourceEvent) && (d3.event.sourceEvent.type === "mouseup")) {
            if ((window.event as KeyboardEvent).shiftKey) {
              itxFixType = "scale";
            }
            brushEndItx();
          }
          // [[x0, y0]
          const s = d3.brushSelection(this) as [number, number];
          console.log("source event", d3.event.sourceEvent);
          if (s === null) {
            // only reset if it's user initated
            if ((d3.event.sourceEvent) && (d3.event.sourceEvent.type === "mouseup")) {
              removeBrush();
            }
          } else {
            let sx = s.map(x.invert);
            console.log("brushed", d3.brushSelection(this), "mapped", sx);
            brushItx(sx[0], sx[1], s[0] / innerWidth, s[1] / innerWidth, itxFixType);
          }
        });

      this.brush = brush;

      vis = <g>
        <path stroke="steelblue" fill="none" stroke-wdith="1.5" d={line}></path>
        <path stroke="red" fill="none" stroke-wdith="1.5" d={brushedLine}></path>
        <g ref={ g => {
            this.brushG = g;
            // (window as any).brushG = g;
            // (window as any).brush = brush;
            d3.select(g).call(brush);
          } }></g>
        <g ref={(g) => d3.select(g).call(d3.axisLeft(y).ticks(5))}></g>
        <g ref={(g) => d3.select(g).call(
                           d3.axisBottom(x)
                             .ticks(4)
                             .tickFormat(getFormattedTime))
                             .selectAll("text")
                               .attr("transform", "rotate(-35)")
                               .style("text-anchor", "end")
                               .attr("dx", "-.8em")
                               .attr("dy", ".15em")
                } transform={"translate(0," + innerHeight + ")"}></g>
        {spinner}
      </g>;
    }

    return (<svg  width={width} height={height + spinnerRadius * 3}>
      <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
        {vis}
      </g>
    </svg>);
  }
}