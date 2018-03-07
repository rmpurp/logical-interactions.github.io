CREATE TRIGGER xFilterAtomicResponse AFTER INSERT ON chartDataAtomic
BEGIN
  -- if all the charts are here
  SELECT log(NEW.requestId, 'xFilterAtomicResponse');
  INSERT INTO xFilterResponse
  SELECT NEW.requestId, timeNow(), NEW.requestId
  FROM (
    SELECT GROUP_CONCAT(DISTINCT chart) AS val
    FROM chartDataAtomic d
    WHERE d.requestId = NEW.requestId) charts
  WHERE checkAtomic(charts.val) = 1;
END;

CREATE TRIGGER xFilterRenderTrigger AFTER INSERT ON xFilterResponse
BEGIN
  SELECT refreshXFilter(), log(NEW.requestId, 'xFilterRenderTrigger');
END;