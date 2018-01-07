import { stocks } from "./stockData";
import { Rect } from "./geometry";

export interface Datum {
  x: number;
  y: number;
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const facetValues = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function getStockData(selection: string) {
  let stock = stocks[1];
  let offset = facetValues.indexOf(selection);
  let result = [];
  for (let i: number = 0; i < 5; i ++) {
    result.push({x: i + 2008, y: stock[i][offset]});
  }
  // console.log("result", result);
  return result;
}

export function getData(selection: string, avgDelay: number, varDelay: number, itxid: number) {
  let data = getStockData(selection);
  return new Promise((resolve, reject) => {
    let delay = getRandomInt(avgDelay - varDelay, avgDelay + varDelay);
    setTimeout(
      () => resolve({selection: selection, data, itxid}),
      delay
    );
  });
}

export function getScatterData(rawArray: number[]) {
  // TODO: randomize
  let result: Datum[] = [];
  for (let i = 0; i < rawArray.length - 1; i ++) {
    result.push({x: rawArray[i], y: rawArray[i + 1] * 2 % 100});
  }
  return result;
}

export function filterZoomData(originalData: Datum[], selection: Rect, key: number, avgDelay: number, varDelay: number) {
  let data = originalData.filter((d) => {return (d.x < selection.x2) && (d.x > selection.x1) && (d.y < selection.y2) && (d.y > selection.y1); });
  return new Promise((resolve, reject) => {
    let delay = getRandomInt(avgDelay - varDelay, avgDelay + varDelay);
    setTimeout(
      () => resolve({selection: selection, data, key}),
      delay
    );
  });
}