-- Web3 + caja fuerte lógica (sin wallet on-chain hasta deploy)

ALTER TABLE caja_fuerte
  ALTER COLUMN wallet_id DROP NOT NULL;

ALTER TABLE caja_fuerte
  ALTER COLUMN contract_address DROP NOT NULL;

ALTER TABLE herederos
  DROP CONSTRAINT IF EXISTS herederos_caja_fuerte_id_slot_key;

ALTER TABLE herederos
  ADD COLUMN email TEXT;

ALTER TABLE herederos
  ADD COLUMN rol TEXT;

UPDATE herederos
SET
  rol = 'heir'
WHERE
  rol IS NULL;

ALTER TABLE herederos
ALTER COLUMN rol SET NOT NULL;

ALTER TABLE herederos
ADD CONSTRAINT herederos_rol_check CHECK (rol IN ('guardian', 'heir'));

ALTER TABLE herederos
ADD CONSTRAINT herederos_caja_fuerte_id_rol_slot_key UNIQUE (caja_fuerte_id, rol, slot);
