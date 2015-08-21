-- triggers

CREATE FUNCTION prohibit_update_and_delete() RETURNS trigger AS
  $$
  BEGIN
    RAISE EXCEPTION 'UPDATE and DELETE are prohibited';
  END
  $$ IMMUTABLE LANGUAGE plpgsql;

-- tables

CREATE TABLE actiontype (
  actiontype_id SERIAL PRIMARY KEY,

  name TEXT NOT NULL,
  view_order INTEGER DEFAULT 0 NOT NULL,

  archived BOOLEAN DEFAULT FALSE NOT NULL,
  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE action (
  action_id SERIAL,
  actiontype_id INTEGER REFERENCES actiontype(actiontype_id), -- ON DELETE CASCADE

  started TIMESTAMP WITH TIME ZONE,
  ended TIMESTAMP WITH TIME ZONE,
  deleted TIMESTAMP WITH TIME ZONE,
  entered TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL,

  -- if deleted IS NOT NULL, then actiontype_id, started, and ended should all be NOT NULL
  --   but it's also okay for those columns to be NOT NULL if deleted IS NULL
  CONSTRAINT action_check CHECK ((deleted IS NOT NULL) OR
    (actiontype_id IS NOT NULL AND started IS NOT NULL AND ended IS NOT NULL))
);

CREATE TRIGGER action_before_update_or_delete
  BEFORE DELETE OR UPDATE
  ON action
  FOR EACH ROW EXECUTE PROCEDURE prohibit_update_and_delete();

-- in a DISTINCT ON query, the WHERE clause is interpreted before the DISTINCT,
-- so it's helpful to have this VIEW, so that we can use a WHERE clause after
-- the DISTINCT has been applied
CREATE VIEW distinct_action AS
  SELECT DISTINCT ON(action_id) * FROM action ORDER BY action_id, entered DESC;
