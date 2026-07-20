SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM companions;
DELETE FROM visits;
DELETE FROM visitors;
DELETE FROM attendance_logs;
DELETE FROM guests;
DELETE FROM event_sessions;
DELETE FROM events;

SET FOREIGN_KEY_CHECKS = 1;
