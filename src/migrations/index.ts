import * as migration_20261120_055024_initial_tannerchung_payload_schema from './20261120_055024_initial_tannerchung_payload_schema';
import * as migration_20261120_063948_trade_sheets from './20261120_063948_trade_sheets';

export const migrations = [
  {
    up: migration_20261120_055024_initial_tannerchung_payload_schema.up,
    down: migration_20261120_055024_initial_tannerchung_payload_schema.down,
    name: '20261120_055024_initial_tannerchung_payload_schema',
  },
  {
    up: migration_20261120_063948_trade_sheets.up,
    down: migration_20261120_063948_trade_sheets.down,
    name: '20261120_063948_trade_sheets'
  },
];
