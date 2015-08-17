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
  actiontype_id INTEGER REFERENCES actiontype(actiontype_id) ON DELETE CASCADE NOT NULL,

  started TIMESTAMP WITH TIME ZONE NOT NULL,
  ended TIMESTAMP WITH TIME ZONE NOT NULL,
  deleted TIMESTAMP WITH TIME ZONE,
  entered TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TRIGGER action_before_update_or_delete
  BEFORE DELETE OR UPDATE
  ON action
  FOR EACH ROW EXECUTE PROCEDURE prohibit_update_and_delete();
