INSERT INTO guest_types (id, name, color, sort_order) VALUES
  ('gt_director','Director (a)','#0f766e',50),
  ('gt_regidor','Regidor (a)','#be123c',60),
  ('gt_oferente','Oferente','#a16207',70),
  ('gt_junta_vecinos','Junta de vecinos','#0369a1',80)
ON DUPLICATE KEY UPDATE color=VALUES(color), sort_order=VALUES(sort_order);
