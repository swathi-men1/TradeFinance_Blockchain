-- /* Author: Abdul Samad | */
-- Zero-Failure Architecture: Immutability Enforcers

-- Function to prevent deletion
CREATE OR REPLACE FUNCTION prevent_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Deletion is not allowed on this immutable table: %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Ledger Entries (DELETE & UPDATE prevention)
DROP TRIGGER IF EXISTS trg_prevent_delete_ledger ON ledger_entries;
CREATE TRIGGER trg_prevent_delete_ledger
BEFORE DELETE ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_deletion();

DROP TRIGGER IF EXISTS trg_prevent_update_ledger ON ledger_entries;
CREATE TRIGGER trg_prevent_update_ledger
BEFORE UPDATE ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_deletion();

-- Trigger for Audit Logs (DELETE & UPDATE prevention)
DROP TRIGGER IF EXISTS trg_prevent_delete_audit ON audit_logs;
CREATE TRIGGER trg_prevent_delete_audit
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_deletion();

DROP TRIGGER IF EXISTS trg_prevent_update_audit ON audit_logs;
CREATE TRIGGER trg_prevent_update_audit
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_deletion();

-- Function to prevent Hash mutation
CREATE OR REPLACE FUNCTION prevent_hash_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hash <> OLD.hash THEN
        RAISE EXCEPTION 'The Document Hash is immutable. Tampering detected.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Document Hash Immutability
DROP TRIGGER IF EXISTS trg_prevent_hash_change ON documents;
CREATE TRIGGER trg_prevent_hash_change
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION prevent_hash_change();

