import * as React from "react";
import * as d3 from "d3";

import { Indicator } from "./Indicator";
import { db } from "../records/setup";
import { Datum } from "../lib/data";
import { getXFilterStmts } from "../records/XFilter/setup";

interface XFilterChartProps {
  baseData: {x: number, y: number}[];
  xFilterData: {x: number, y: number}[];
  pending: boolean;
  control: boolean;
  chart: string;
  baseFill?: string;
  selectFill?: string;
  height?: number;
  width?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  yDomain?: [number, number];
  maxZoomScale?: number;
}

interface XFilterChartState {
  scale: number;
}

export default class XFilterChart extends React.Component<XFilterChartProps, XFilterChartState> {
  // bars: SVGGElement;
  // gX: SVGGElement;
  // gY: SVGGElement;

  static defaultProps = {
    colorOverride: false,
    baseFill: "rgb(255, 192, 203, 0.5)",
    selectFill: "rgb(176, 224, 230, 0.8)",
    height: 150,
    marginBottom: 40,
    marginLeft: 45,
    marginRight: 20,
    marginTop: 20,
    width: 220,
    showLabel: false,
    showAxesLabels: true,
    maxZoomScale: 5,
  };
  constructor(props: XFilterChartProps) {
    super(props);
    this.zoomed = this.zoomed.bind(this);
    this.state = {
      scale: 1,
    };
  }
  zoomed() {
    // console.log("zoom called, setting scale to ", d3.event.transform.k);
    let scale = d3.event.transform.k;
    if (Math.abs(scale - this.state.scale) > 0.05 * scale) {
      this.setState({
        scale
      });
    }
  }
  render() {
    let { chart, width, height, baseFill, marginLeft, marginRight, marginTop, marginBottom, baseData, xFilterData, pending, selectFill, maxZoomScale, control } = this.props;
    let { scale } = this.state;
    let stmts = getXFilterStmts();
    let spinner: JSX.Element = null;
    let vis: JSX.Element = null;
    if (pending) {
      spinner = <Indicator />;
    }
    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;
    let bandwidth = innerWidth * 0.8 / baseData.length;
    let x = d3.scaleLinear()
              .rangeRound([0, innerWidth])
              .domain([d3.min(baseData, (d) => d.x), d3.max(baseData, (d) => d.x)]);
    if (scale > 1) {
      let maxVal = d3.max(baseData, (d) => d.y);
      let limit = maxVal / maxZoomScale * (maxZoomScale - scale + 1);
      baseData = baseData.filter((d) => {return d.y < limit; });
    }
    let y = d3.scaleLinear()
              .rangeRound([innerHeight, 0])
              .domain([0, d3.max(baseData, (d) => d.y)]);
    let yAxis = d3.axisLeft(y).ticks(5, "d");
    let xAxis = d3.axisBottom(x).ticks(4);
    let baseBars = baseData.map((d, i) => <rect x={x(d.x)} y={y(d.y)} width={bandwidth} height={innerHeight - y(d.y)} fill={baseFill}></rect>);
    let selectBars = (xFilterData ? xFilterData : []).map((d, i) => <rect x={x(d.x)} y={y(d.y)} width={bandwidth} height={innerHeight - y(d.y)} fill={selectFill}></rect>);
    if (!xFilterData) {
      spinner = <><Indicator />Processing Request</>;
    }
    let brushDiv = null;
    if (control) {
      let brush = d3.brushX()
                    .extent([[0, 0], [innerWidth, innerHeight]])
                    .on("start", function() {
                      // TODO
                      console.log("brush started");
                    })
                    .on("end", function() {
                      const s = d3.brushSelection(this) as [number, number];
                      if (s !== null) {
                        let v1 = x.invert(s[0]);
                        let v2 = x.invert(s[1]);
                        stmts.insertBrushItx.run([+new Date(), Math.min(v1, v2), Math.max(v1, v2), chart]);
                      }
                    });
      brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
    }
    vis = <svg width={width} height={height} ref={(g) => {d3.select(g).call(zoom); }} style={{cursor: "ns-resize"}}>
            <g  transform={`translate(${marginLeft}, ${marginTop})`} >
              {baseBars}
              {selectBars}
              <g ref={(g) => {d3.select(g).call(yAxis); }}></g>
              <g ref={(g) => { d3.select(g).call(xAxis); }} transform={"translate(0," + innerHeight + ")"}></g>
              {brushDiv}
              {spinner}
            </g>
          </svg>;
    let zoom = d3.zoom()
                 .scaleExtent([1, maxZoomScale])
                 .translateExtent([[0, -100], [width, height]])
                 .on("zoom", this.zoomed);

    // console.log("brush", brushDiv);
    return(<div style={{float: "left"}}>
      {vis}
    </div>);
  }
}