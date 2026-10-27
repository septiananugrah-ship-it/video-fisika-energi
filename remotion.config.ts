import {Config} from '@remotion/cli/config';
import os from 'node:os';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Jangan melebihi jumlah inti CPU (Codespace standar hanya 2 inti).
Config.setConcurrency(Math.max(1, Math.min(4, os.cpus().length)));
if (process.env.CHROME_PATH) {
  Config.setBrowserExecutable(process.env.CHROME_PATH);
}
