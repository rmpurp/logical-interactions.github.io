!function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}var n={};t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:r})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="/dist",t(t.s=5)}([function(e,t){e.exports=React},function(e,t,n){"use strict";function r(e){try{t.db.run(e)}catch(t){console.log("%cDB execution error for query "+e+", "+t,"background: red")}}function o(e){var n=t.db.exec(e);n.length>0?(n[0].values.map(function(e){e.map(function(e,t){"ts"===n[0].columns[t]&&(e=new Date(e).toDateString())})}),console.log(n[0].columns.join("\t")),console.log(JSON.stringify(n[0].values).replace(/\],\[/g,"\n").replace("[[","").replace("]]","").replace(/,/g,"\t"))):console.log("NO RESULT")}function a(e,n){var r=g?"./dist/sql":"/src/records",o=p.readFileSync(r+"/"+e+"/"+n+".sql"),a=o.split(";\n\n");a.forEach(function(e,n){e=e.replace(/^ *--.*$/gm,""),n<a.length-1&&(e+=";"),console.log("executing ",e),t.db.run(e)})}function i(e,t){return console.log("["+t+"] "+e),1}function s(){return+new Date}function c(e,t,n){if(e>t)throw new Error(e+" is larger than "+t+", "+n)}function l(e,t){var n=document.createElement("a");n.href=window.URL.createObjectURL(e),n.download=t,n.onclick=function(){setTimeout(function(){window.URL.revokeObjectURL(n.href)},1500)},n.click()}function u(){console.log("download session");var e=t.db.export();l(new Blob([e]),"session.db")}function d(e){var n="",r=t.db.exec(e);if(r.length&&r[0].values){n+=r[0].columns.join(",")+"\r\n",r[0].values.forEach(function(e){var t=e.join(",");n+=t+"\r\n"});l(new Blob([n],{type:"text/plain;charset=UTF-8"}),"userData.csv"),console.log("should have downloaded",n)}else console.log("NO RESULT")}function f(e){var n=new FileReader;n.onload=function(){console.log("Updated to the updated session");var e=new Uint8Array(n.result);t.db=new h.Database(e)},n.readAsArrayBuffer(e)}Object.defineProperty(t,"__esModule",{value:!0});var h=n(11),p=n(4),g=!0;console.log("DB setup file executing"),t.db=new h.Database,window.db=t.db,t.db.run("PRAGMA foreign_keys = ON;"),t.tryDB=r,window.d=o,t.executeFile=a,t.db.create_function("timeNow",s),t.db.create_function("log",i),t.db.create_function("assertNoBigger",c),t.downloadDB=u,window.downloadDB=u,t.downloadQueryResultAsCSV=d,t.loadDb=f},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0);t.Indicator=function(){return r.createElement("div",{className:"indicator inline-block"})}},function(e,t,n){"use strict";function r(e){if(e[0]&&e[0].values&&e[0].values.length>0){var t=e[0].columns;if("chart"!==t[0]||"bin"!==t[1]||"count"!==t[2]||"itxId"!==t[3])throw new Error("Section do not match");var n=e[0].values,r={};return n.forEach(function(e){var t=e[3].toString(10);t in r||(r[t]={hour:[],delay:[],distance:[]});var n=e[0];r[t][n].push({x:e[1],y:e[2]})}),console.log("returning data",r),{data:r}}return{data:null}}function o(){["tables","views","dataFetchTriggers","renderTriggers"].map(function(e){l.executeFile("XFilter",e)}),l.db.create_function("queryWorker",i),l.db.create_function("checkAtomic",function(e){return e&&t.XFILTERCHARTS.reduce(function(t,n){return t&&e.indexOf(n)>-1},!0)?1:0})}function a(){var e;return e||(e={insertBrushItx:l.db.prepare("INSERT INTO xBrushItx (ts, low, high, chart) VALUES (?, ?, ?, ?)")}),e}function i(e,t){console.log("worker doing job",e);var n="xFilterRequest",r=l.db.exec("\n    SELECT sql\n    FROM sqlite_master\n    WHERE\n      type = 'table'\n      AND name = 'xFilterRequest';\n  ")[0].values[0];if(!r)throw new Error(n+" not defined in client db");var o=l.db.exec("SELECT * FROM xFilterRequest WHERE requestId = "+e)[0];if(!o||!o.values)throw new Error("This should not have happened, xFilterRequest should have been defined with "+e);var a="\n    DROP TABLE IF EXISTS xFilterRequest;\n    "+r+";\n    INSERT INTO "+n+" VALUES "+o.values.map(function(e){return"("+e.map(function(e){return e||"null"}).join(", ")+")"})+";\n  ";u.xFilterWorker().then(function(n){n.postMessage({id:"insertThenShare:"+e+":"+t,action:"exec",sql:a})})}function s(){l.db.run("\n  ")}function c(e){return"\n  SELECT\n    d.chart,\n    d.bin,\n    d.count,\n    req.itxId AS itxId\n  FROM\n    xFilterResponse res\n    JOIN xFilterRequest req ON res.requestId = req.requestId\n    JOIN chartData d ON d.requestId = res.dataId\n  WHERE req.itxId IN (\n      SELECT itxId FROM currentItx ORDER BY itxId DESC LIMIT "+e+"\n    )\n  ORDER BY itxId DESC;"}Object.defineProperty(t,"__esModule",{value:!0});var l=n(1),u=n(12);t.XFILTERCHARTS=["hour","delay","distance"],t.parseChartData=r,t.setupXFilterDB=o,t.getXFilterStmts=a,t.queryWorker=i,t.updateComponents=s,t.initialStateSQL="\nSELECT\n  d.chart, d.bin, d.count, 0 AS itxId\nFROM\n  chartData d\n  JOIN xFilterRequest r ON d.requestId = r.requestId\nWHERE\n  r.hourLow IS NULL AND r.hourHigh IS NULL\n  AND r.delayLow IS NULL AND r.delayHigh IS NULL\n  AND r.distanceLow IS NULL AND r.distanceHigh IS NULL;",t.getXFilterChroniclesSQL=c},function(e,t,n){"use strict";function r(e){var t=new XMLHttpRequest;return t.open("GET",e,!1),t.send(null),200===t.status?t.responseText:""}function o(e){return new Promise(function(t,n){var r=new XMLHttpRequest;r.open("GET",e,!0),r.onload=function(){return t(r.responseText)},r.onerror=function(){return n(r.statusText)},r.send()})}Object.defineProperty(t,"__esModule",{value:!0}),t.readFileSync=r,t.readFileAsync=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),o=n(6),a=n(7);o.render(r.createElement(a.PageContainer,null),document.getElementById("wrapper"))},function(e,t){e.exports=ReactDOM},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),o=n(8);t.PageContainer=function(){return r.createElement(r.Fragment,null,r.createElement(o.default,null))}},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var o=n(0),a=n(2),i=n(9),s=n(1),c=n(3),l=function(e){function t(t){var n=e.call(this,t)||this;n.refreshXFilterData=n.refreshXFilterData.bind(n),n.setPending=n.setPending.bind(n),n.changeBuffer=n.changeBuffer.bind(n),c.setupXFilterDB(),s.db.create_function("refreshXFilter",n.refreshXFilterData),s.db.create_function("setXFilterPending",n.setPending);var r=+new Date;return s.db.exec("\n      INSERT INTO xBrushItx (ts, chart) VALUES "+c.XFILTERCHARTS.map(function(e){return"("+r+", '"+e+"')"}).join(", ")+";\n    "),n.state={baseData:null,data:null,itxIdSet:[],pending:!0,additionalLatency:0,bufferSize:1},n}return r(t,e),t.prototype.refreshXFilterData=function(){if(!this.state.baseData){var e=s.db.exec(c.initialStateSQL),t=c.parseChartData(e);if(t.data){if(1!==Object.keys(t.data).length)throw new Error("Basedata result should be exactly 1");var n=Object.keys(t.data)[0];s.db.exec("INSERT INTO xFilterRender (itxId, ts) VALUES ("+n+", "+ +new Date+")"),this.setState({baseData:t.data[n]})}}var r=c.getXFilterChroniclesSQL(this.state.bufferSize),o=s.db.exec(r),a=c.parseChartData(o);if(a.data){var i=Math.max.apply(Math,Object.keys(a.data).map(function(e){return parseInt(e,10)}));s.db.exec("INSERT INTO xFilterRender (itxId, ts) VALUES ("+i+", "+ +new Date+")"),console.log("for xFitlerRend, we have the id",i,"and values",a.data),this.setState(function(e){return{data:a.data,pending:!1}})}},t.prototype.setPending=function(e){console.log("setting pending to",e);var t=!1;e&&(t=!0),this.setState({pending:t})},t.prototype.changeBuffer=function(e){this.setState({bufferSize:e.target.value})},t.prototype.render=function(){var e,t=this.state,n=t.baseData,r=t.data,s=(t.pending,[]);if(n)if(r)for(var c=Object.keys(r).map(function(e){return parseInt(e,10)}).sort().reverse(),l=0;l<c.length;l++)!function(e){var t=r[c[e]],a=Object.keys(n).map(function(r){return o.createElement(i.default,{baseData:n[r],xFilterData:t[r],control:0===e,chart:r,key:r,pending:!t[r]})});s.push(o.createElement(o.Fragment,null,a,o.createElement("div",{style:{clear:"both"}})))}(l);else s=Object.keys(n).map(function(e){return o.createElement(i.default,{baseData:n[e],control:!0,xFilterData:null,chart:e,key:e,pending:!0})});else e=o.createElement(o.Fragment,null,o.createElement(a.Indicator,null),"Loading Initial Data...");return o.createElement("div",{style:{position:"sticky",top:0,backgroundColor:"white"}},s,e,o.createElement("select",{value:this.state.bufferSize,onChange:this.changeBuffer},o.createElement("option",{value:1},"1"),o.createElement("option",{value:2},"2"),o.createElement("option",{value:3},"3"),o.createElement("option",{value:4},"4")))},t}(o.Component);t.default=l},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var o=n(0),a=n(10),i=n(2),s=n(3),c=function(e){function t(t){var n=e.call(this,t)||this;return n.zoomed=n.zoomed.bind(n),n.state={scale:1},n}return r(t,e),t.prototype.zoomed=function(){var e=a.event.transform.k;Math.abs(e-this.state.scale)>.05*e&&this.setState({scale:e})},t.prototype.render=function(){var e=this.props,t=e.chart,n=e.width,r=e.height,c=e.baseFill,l=e.marginLeft,u=e.marginRight,d=e.marginTop,f=e.marginBottom,h=e.baseData,p=e.xFilterData,g=e.pending,v=e.selectFill,m=e.maxZoomScale,b=e.control,x=this.state.scale,E=s.getXFilterStmts(),w=null,y=null;g&&(w=o.createElement(i.Indicator,null));var S=n-l-u,I=r-d-f,D=.8*S/h.length,F=a.scaleLinear().rangeRound([0,S]).domain([a.min(h,function(e){return e.x}),a.max(h,function(e){return e.x})]);if(x>1){var O=a.max(h,function(e){return e.y}),R=O/m*(m-x+1);h=h.filter(function(e){return e.y<R})}var L=a.scaleLinear().rangeRound([I,0]).domain([0,a.max(h,function(e){return e.y})]),_=a.axisLeft(L).ticks(5,"d"),T=a.axisBottom(F).ticks(4),N=h.map(function(e,t){return o.createElement("rect",{x:F(e.x),y:L(e.y),width:D,height:I-L(e.y),fill:c})}),k=(p||[]).map(function(e,t){return o.createElement("rect",{x:F(e.x),y:L(e.y),width:D,height:I-L(e.y),fill:v})});p||(w=o.createElement(o.Fragment,null,o.createElement(i.Indicator,null),"Processing Request"));var q=null;if(b){var A=a.brushX().extent([[0,0],[S,I]]).on("start",function(){console.log("brush started")}).on("end",function(){var e=a.brushSelection(this);if(null!==e){var n=F.invert(e[0]),r=F.invert(e[1]);E.insertBrushItx.run([+new Date,Math.min(n,r),Math.max(n,r),t])}});q=o.createElement("g",{ref:function(e){return a.select(e).call(A)}})}y=o.createElement("svg",{width:n,height:r,ref:function(e){a.select(e).call(B)},style:{cursor:"ns-resize"}},o.createElement("g",{transform:"translate("+l+", "+d+")"},N,k,o.createElement("g",{ref:function(e){a.select(e).call(_)}}),o.createElement("g",{ref:function(e){a.select(e).call(T)},transform:"translate(0,"+I+")"}),q,w));var B=a.zoom().scaleExtent([1,m]).translateExtent([[0,-100],[n,r]]).on("zoom",this.zoomed);return o.createElement("div",{style:{float:"left"}},y)},t.defaultProps={colorOverride:!1,baseFill:"rgb(255, 192, 203, 0.5)",selectFill:"rgb(176, 224, 230, 0.8)",height:150,marginBottom:40,marginLeft:45,marginRight:20,marginTop:20,width:220,showLabel:!1,showAxesLabels:!0,maxZoomScale:5},t}(o.Component);t.default=c},function(e,t){e.exports=d3},function(e,t){e.exports=SQL},function(e,t,n){"use strict";function r(){return new Promise(function(e,t){i?e(i):(i=new Worker("./dist/worker.sql.js"),fetch("./dist/flight_small.db").then(function(e){return 200!==e.status?void console.log("There was a problem: "+e.status):e.arrayBuffer()}).then(function(e){console.log("Setting up db in the worker",e),i.postMessage({id:"open",action:"open",buffer:e})}),i.onmessage=function(t){var n=t.data.id.split(":");n[0];switch(n[0]){case"open":if(console.log("[Worker] Database opened",t),s)throw new Error("Should not open worker DB twice");s=!0;var r=o.readFileSync("./dist/sql/XFilter/workerViews.sql");i.postMessage({id:"setup",action:"exec",sql:r});break;case"setup":if(c)throw new Error("Should not setup worker DB twice");c=!0,e(i);break;case"insertThenShare":if(!s||!c)throw new Error("Need to setup worker DB before using");var l=n[1],u=n[2];console.log("[Worker: insertThenShare] querying db to share data for requestId "+l+", except "+u),["hour","delay","distance"].map(function(e){if(e!==u){var t="\n                  SELECT * FROM "+e+"ChartDataView;\n                ";i.postMessage({id:"share:"+l+":"+e,action:"exec",sql:t})}});break;case"share":var d=n[1],f=n[2];if(t.data.results[0]&&t.data.results[0].values.length>0){var h=t.data.results[0].values,p="\n                INSERT INTO chartData VALUES "+h.map(function(e){return"("+d+", "+e[0]+", "+e[1]+", '"+f+"')"})+";\n                INSERT INTO chartDataAtomic VALUES ("+d+", '"+f+"');\n              ";a.db.exec(p)}else console.log("No result for",f,d)}},i.onerror=function(e){console.log("Worker error: ",e)})})}Object.defineProperty(t,"__esModule",{value:!0});var o=n(4),a=n(1),i=null,s=!1,c=!1;window.worker=i,t.xFilterWorker=r}]);
//# sourceMappingURL=bundle.js.map