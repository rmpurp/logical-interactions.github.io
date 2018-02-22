-- all interactions so far will be zooms or panning
CREATE TABLE mapInteractions (itxId INTEGER PRIMARY KEY, ts INTEGER, latMin INTEGER, latMax INTEGER, longMin INTEGER, longMax INTEGER, undoed INTEGER DEFAULT 0);

CREATE TABLE mapRequests (itxId INTEGER, ts INTEGER);

-- many pin could map to the same pinData
-- overloading this itxId
CREATE TABLE pinData (itxId INTEGER, long INTEGER, lat INTEGER);

-- see https://sqlite.org/foreignkeys.html
-- cannot really use FOREIGN KEY(dataId) REFERENCES pinData(itxId)
-- since it's not unique...
-- if dataId is null, then it's referencing it self
CREATE TABLE pinResponses (itxId INTEGER, ts INTEGER, dataId INTEGER);

CREATE TABLE barResponese (itxId INTEGER, ts INTEGER, x TEXT, y INTEGER);

-- states
CREATE TABLE mapState(itxId INTEGER, ts INTEGER, latMin INTEGER, latMax INTEGER, longMin INTEGER, longMax INTEGER);

CREATE TABLE pinState(itxId INTEGER, ts INTEGER, lat INTEGER, long INTEGER);

CREATE TEMP TABLE IF NOT EXISTS Variables (Name TEXT PRIMARY KEY, Value TEXT); 