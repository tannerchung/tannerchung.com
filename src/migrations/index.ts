import * as migration_20261120_055024_initial_tannerchung_payload_schema from './20261120_055024_initial_tannerchung_payload_schema';
import * as migration_20261120_063948_trade_sheets from './20261120_063948_trade_sheets';
import * as migration_20261121_011814_mcp_plugin from './20261121_011814_mcp_plugin';
import * as migration_20261121_044647_lumen_globals from './20261121_044647_lumen_globals';
import * as migration_20261125_072529_trade_desk_payload_blocks from './20261125_072529_trade_desk_payload_blocks';

export const migrations = [
  {
    up: migration_20261120_055024_initial_tannerchung_payload_schema.up,
    down: migration_20261120_055024_initial_tannerchung_payload_schema.down,
    name: '20261120_055024_initial_tannerchung_payload_schema',
  },
  {
    up: migration_20261120_063948_trade_sheets.up,
    down: migration_20261120_063948_trade_sheets.down,
    name: '20261120_063948_trade_sheets',
  },
  {
    up: migration_20261121_011814_mcp_plugin.up,
    down: migration_20261121_011814_mcp_plugin.down,
    name: '20261121_011814_mcp_plugin',
  },
  {
    up: migration_20261121_044647_lumen_globals.up,
    down: migration_20261121_044647_lumen_globals.down,
    name: '20261121_044647_lumen_globals',
  },
  {
    up: migration_20261125_072529_trade_desk_payload_blocks.up,
    down: migration_20261125_072529_trade_desk_payload_blocks.down,
    name: '20261125_072529_trade_desk_payload_blocks'
  },
];
