import * as d3 from "d3";
import * as React from "react";

import Indicator from "./Indicator";

interface XChartProps {
  data: number[];
  bins: number;
  id: number;
  chart: string;
  selectable: boolean;
  updateSelection? (chart: string, min: number, max: number): void;
  selection?: [number, number]; // this is already normalized as percentage
  height?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  width?: number;
  color?: string;
}

export default class XChart extends React.Component<XChartProps, undefined> {
  static defaultProps = {
    color: "blue",
    height: 100,
    width: 200,
    marginBottom: 40,
    marginLeft: 45,
    marginRight: 20,
    marginTop: 20,
  };
  render() {
    const { data, id , height, marginBottom, marginLeft, marginRight, marginTop, width, updateSelection, chart, bins, color } = this.props;
    let shownDiv: JSX.Element = null;
    if (!data) {
      console.log("Error, xfilter data should be present");
      return(<div>Something went wrong here</div>);
    }
    let brushDiv: JSX.Element = null;
    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;
    if (this.props.selectable) {
      let brush = d3.brushX()
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on("end", function() {
        const s = d3.brushSelection(this) as [number, number];
        if (s !== null) {
          let x1 = Math.min(x.invert(s[0]), x.invert(s[1]));
          let x2 = Math.max(x.invert(s[0]), x.invert(s[1]));
          updateSelection(chart, x1, x2);
          console.log("brushed", d3.brushSelection(this), "mapped", x1, x2);
        }
      });
      brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    }
    let annotation: JSX.Element = null;
    if (this.props.selectable) {
    }
    let domain = [d3.min(data), d3.max(data)];
    let x = d3.scaleLinear()
              .domain(domain)
              .range([0, innerWidth]);
    // need to do some binning
    let binCounts = d3.histogram()
                  .domain(domain as any)
                  .thresholds(x.ticks(this.props.bins))(data);
    let xBins = d3.scaleLinear()
                  .domain([binCounts[0].x0, binCounts[binCounts.length - 1].x1])
                  .range([0, innerWidth]);
    let y = d3.scaleLinear()
                .domain([0, d3.max(binCounts, (d) => {return d.length; })])
                .range([innerHeight, 0]);
    let bars: JSX.Element[];
    // let barWidth = innerWidth * 0.9 / bins;
    let selectionVis: JSX.Element = null;
    if (this.props.selection) {
      selectionVis = <line x1={this.props.selection[0] * innerWidth} y1={innerHeight - 2} x2={this.props.selection[1] * innerWidth} y2={innerHeight - 2} strokeWidth={2} stroke={"black"}/>;
    }
    console.log("Bins", binCounts);
    let binRects = binCounts.map((d, i) => <rect key={"bins_" + id + chart + "_" + i} x={xBins(d.x0)} y={innerHeight - y(d.length)} width={xBins(d.x1) - xBins(d.x0) - 1} height={y(d.length)} fill={color} fillOpacity={0.3} data-x0={d.x0} data-x1={d.x1}></rect>);
    return(<div className="chart-wrapper inline-block">
        <svg width={width} height={height}>
          <g transform={"translate(" + marginLeft + "," + marginTop + ")"}>
          </g>
          {binRects}
          {brushDiv}
          {selectionVis}
        </svg>
      </div>);
  }
}