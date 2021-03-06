import { feature } from "topojson";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { geoMercator, geoPath } from "d3-geo";

import { db, executeFile } from "../setup";
import { getMapEventData, getUserData, Coords, MapSelection,  mapBoundsToTransform } from "../../lib/data";
import { getTranslatedMapping } from "../../lib/helper";
import { POP, MAXPOP } from "../../data/pop";
import { Statement } from "sql.js";

export function setupMapDB() {
  // we need to wait for the UDFs to be loaded, trigger by the respective components
  ["tables", "views", "dataFetchTriggers", "renderTriggers"].map(f => {executeFile("MapZoom", f); });

  let stmts: {[index: string]: Statement} = {};
  const stmtSQL: {[index: string]: string} = {
    insertPinResponse: "INSERT INTO pinResponses (itxId, ts) VALUES (?, ?)",
    insertPin: "INSERT OR IGNORE INTO pinData (long, lat, userId) VALUES (?, ?, ?)",
    insertUserData: "INSERT INTO userData (userId, Q1, Q2, Q3, Q4) VALUES (?, ?, ?, ?, ?);"
  };

  function getStmt(key: string) {
    if (Object.keys(stmtSQL).indexOf(key) < 0) {
      throw new Error("prepared statement undefined");
    }
    if (!stmts[key]) {
      stmts[key] = db.prepare(stmtSQL[key]);
    }
    return stmts[key];
  }

  function processPinResponse(response: any) {
    // console.log("received response", response);
    const {selection, data, itxId} = response;
    if (!data) {
      throw new Error("Pin data should be defined");
    }
    db.exec("BEGIN TRANSACTION;");
    // also want to insert into pinResponse to indicate that we have values...
    // if it's here, it must be that the dataId is the same as interaction Id, that is, the same query was issued.
    data.forEach((d: any) => {
      // d.unshift(itxId);
      getStmt("insertPin").run(d);
    });
    // this response must be the most recent one...
    getStmt("insertPinResponse").run([itxId, +new Date()]);
    db.exec("COMMIT;");
  }

  function queryPin(itxId: number, latMin: number, latMax: number, longMin: number, longMax: number) {
    console.log("sending request for", itxId, latMin, latMax, longMin, longMax);
    getMapEventData(itxId, {nw: [longMin, latMax], se: [longMax, latMin]}).then(processPinResponse);
  }

  function queryUserData(userId: string) {
    getUserData(userId).then(processUserDataResponse);
  }

  function processUserDataResponse(response: any) {
    // store it in the
    let {data, userId, itxid} = response;
    getStmt("insertUserData").run([userId, ...data]);
  }

  db.create_function("queryPin", queryPin);
  db.create_function("queryUserData", queryUserData);
  // let UDFs: any[] = [queryPin, queryUserData];
  // UDFs.forEach((f) => {
  //   db.create_function(f.name, f);
  // });
}

export function setupCanvasDependentUDFs(ctx: CanvasRenderingContext2D, scale: number, width: number, height: number) {

  // data needed for canvas drawing map
  // can always keep in the context
  let worldDataLoaded: boolean = false;
  let worldData: any[];
  // fixme: this seems a bit wasteful, but it would be automatically correct synchronization wise...
  // i wonder how expensive it actually is...
  function setPinState(latMin: number, latMax: number, longMin: number, longMax: number, long: number, lat: number) {
    let s = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    let t = mapBoundsToTransform(s, scale, width, height);
    let p = getTranslatedMapping(t, scale, width, height);
    // hard code for now
    // console.log("Drawing pin", arguments);
    ctx.fillStyle = "red";
    ctx.beginPath();
    let d = p([long, lat]);
    ctx.arc(d[0], d[1], 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  function renderText(text: string) {
    ctx.font = "20px arial";
    ctx.fillStyle = "black";
    ctx.fillText(text, width - 100, height - 100);
  }

  function setBrushState(latMax: number, longMax: number, latMin: number, longMin: number, brushLatMax: number, brushLongMax: number, brushLatMin: number, brushLongMin: number) {
    let s = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    let t = mapBoundsToTransform(s, scale, width, height);
    let p = getTranslatedMapping(t, scale, width, height);
    ctx.fillStyle = "rgba(119,136,153,0.4)";
    let p1 = p([brushLongMin, brushLatMax]);
    let p2 = p([brushLongMax, brushLatMin]);
    if (isNaN(p1[0]) || isNaN(p1[1]) || isNaN(p2[0]) || isNaN(p2[1])) {
      throw new Error(`Brush calculation went wrong! for ${arguments}`);
    }
    ctx.fillRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
    // console.log("Brush filling", p1[0], p1[1], p2[0], p2[1]);
  }

  function setMapState(latMin: number, latMax: number, longMin: number, longMax: number) {
    // console.log("setting map state", arguments);
    ctx.clearRect(0, 0, width, height);
    let s = {
      nw: [longMin, latMax] as Coords,
      se: [longMax, latMin] as Coords
    };
    let t = mapBoundsToTransform(s, scale, width, height);
    // console.log("transformation for render", t);
    let p = getTranslatedMapping(t, scale, width, height);
    let path = geoPath()
                .projection(p)
                .context(ctx);

    function _setMapStateHelper(d: any, i: number) {
      let colorVal = POP[d.id] ? Math.pow(POP[d.id] / MAXPOP, 0.4) * 0.6 + 0.1 : 0.2;
      let rgb = d3ScaleChromatic.interpolateBlues(colorVal);
      // adding transparency, brittle
      ctx.fillStyle = rgb.substring(0, rgb.length - 1) + ", 0.5)";
      ctx.beginPath();
      path(d);
      ctx.fill();
    }
    if (!worldDataLoaded) {
      fetch("./dist/world.json")
        .then(response => {
          if (response.status !== 200) {
            console.log(`There was a problem: ${response.status}`);
            return;
          }
          response.json().then(worldDataRaw => {
            worldData = feature(worldDataRaw, worldDataRaw.objects.countries).features;
            worldDataLoaded = true;
            worldData.forEach(_setMapStateHelper);
          });
        });
      } else {
        worldData.forEach(_setMapStateHelper);
    }
  }
  db.create_function("setPinState", setPinState);
  db.create_function("setMapState", setMapState);
  db.create_function("setBrushState", setBrushState);
  db.create_function("renderText", renderText);

  // let UDFs: any[] = [setPinState, setMapState, setBrushState, renderText];
  // UDFs.forEach((f) => {
  //   db.create_function(f.name, f);
  // });
}

export const removeCacheSQL = `
  DELETE FROM pinResponses;
  DELETE FROM pinData;
`;

// undo redo logic: where a branch is lost from the linear path forward (much like how copy paste's clip board copy is gone after a second copy)
export const undoSQL = `
SELECT log('started', 'undo');
UPDATE mapItx
  SET undoed = 1 WHERE itxId IN (SELECT itxId FROM mapItx ORDER BY itxId DESC LIMIT 1);
INSERT INTO mapItx (ts, latMin, latMax, longMin, longMax, undoed)
  SELECT timeNow(), latMin, latMax, longMin, longMax, 2
  FROM mapItx
  WHERE undoed = 0
  ORDER BY itxId DESC LIMIT 1;
UPDATE mapItx
  SET undoed = 1
  WHERE itxId IN (
    SELECT itxId
    FROM mapItx
    WHERE undoed = 0
    ORDER BY itxId DESC LIMIT 1);
UPDATE mapItx
  SET undoed = 0 WHERE undoed = 2;
`;

let stmts: {
  insertNavItx: Statement;
  insertBrushItx: Statement;
  insertBrushItxItems: Statement;
  // brushItxDone: Statement;
  undoQuery: Statement;
};

export function getMapZoomStatements() {
  if (!stmts) {
    stmts = {
      insertNavItx: db.prepare("INSERT INTO mapItx (ts, longMin, latMax, longMax, latMin) VALUES (?, ?, ?, ?, ?)"),
      insertBrushItx: db.prepare(`
        INSERT INTO brushItx (ts, mapItxId)
        SELECT ?, h.mapItxId
        FROM renderItxs h
        JOIN (SELECT MAX(ts) AS ts FROM renderItxs) AS m ON m.ts = h.ts;
      `),
      insertBrushItxItems: db.prepare(`
        INSERT INTO brushItxItems (itxId, ts, longMin, latMax, longMax, latMin)
          SELECT MAX(itxId), ?, ?, ?, ?, ?
          FROM brushItx;
      `),
      // brushItxDone: db.prepare("UPDATE currentBrushItx SET done = 1;"),
      undoQuery: db.prepare(undoSQL),
    };
  }
  return stmts;
}

export function showPastMapBrushes() {
  // TODO
  // render all the brushes
  db.exec(`
     SELECT
      setBrushState(mapLatMax, mapLongMax, mapLatMin, mapLongMin, brushLatMax, brushLongMax, brushLatMin, brushLongMin)
     FROM getAllBrushState
  `);
}

export function replayBackwardsSession(waitTime: number, end?: any) {
  // using a time mechanism, iterate thru the render histories.
  // while playing history, we dont want to have interactions
  // just disable this in react, and react can call stop replay backwards session.
  // we return the object that contains the function stop the interval
  // pause and resume
  // ideally, we have a streaming implementation
  let result = db.exec(`
    SELECT
      DISTINCT mapItxId, brushItxId
    FROM
      renderItxs
    WHERE cause != 'replay'
    ORDER BY ts DESC
  `);
  if (result[0] && result[0].values && result[0].values.length) {
    let itxIds = result[0].values;
    // if we had a yield pattern we wouldn't need to do this ugly thing...
    let counter = 0;
    // i think the context would work here...
    let repeatId = window.setInterval(() => {
      db.exec(`
        INSERT INTO renderItxs VALUES (${itxIds[counter][0]}, ${itxIds[counter][1]}, 'replay', timeNow());
        SELECT renderText('step ${itxIds.length - counter}');
      `);
      counter += 1;
      if (counter === itxIds.length) {
        window.clearInterval(repeatId);
        if (end) {
          end();
        }
      }
    }, waitTime);
    return repeatId;
  } else {
    return null;
  }
}

export const switchToBlocking = `
  DROP VIEW mapOnlyState;
  CREATE VIEW mapOnlyState AS
    SELECT * FROM mapOnlyStateBlocking;
`;

export const switchToNoneBlocking = `
  DROP VIEW mapOnlyState;
  CREATE VIEW mapOnlyState AS
    SELECT * FROM mapOnlyStateNoneBlocking;
`;