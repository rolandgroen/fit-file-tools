import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
/**
 * Vite plugin to patch fit-file-parser at transform time.
 * This is more reliable than patch-package for Vite's pre-bundling.
 *
 * 1. Adds message 104 (device_battery_status) definition to FIT.messages
 * 2. Fixes the default handler to collect arrays instead of overwriting
 */
function fitParserPatch(): import('vite').Plugin {
  return {
    name: 'fit-parser-patch',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('fit-file-parser')) return;

      let modified = false;

      // Patch fit.js: add message 104 definition before message 108
      if (id.includes('fit.js') && !code.includes('device_battery_status')) {
        code = code.replace(
          /(\n\s*108:\s*\{\s*\n\s*name:\s*'o_hr_settings')/,
          `
        104: {
            name: 'device_battery_status',
            253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: '' },
            0: { field: 'battery_voltage', type: 'uint16', scale: 1000, offset: 0, units: 'V' },
            2: { field: 'battery_level', type: 'uint8', scale: null, offset: 0, units: 'percent' },
            3: { field: 'temperature', type: 'sint8', scale: null, offset: 0, units: 'C' },
        },
$1`,
        );
        modified = true;
      }

      // Patch fit-parser.js: fix default handler to collect arrays
      if (id.includes('fit-parser.js') && code.includes('fitObj[messageType] = message;')) {
        code = code.replace(
          'fitObj[messageType] = message;',
          `if (!fitObj[messageType]) fitObj[messageType] = [];
                        if (Array.isArray(fitObj[messageType])) {
                            fitObj[messageType].push(message);
                        } else {
                            fitObj[messageType] = [fitObj[messageType], message];
                        }`,
        );
        modified = true;
      }

      if (modified) return code;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fitParserPatch()],
})
