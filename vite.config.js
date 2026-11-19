import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function watchGalFolder() {
  return {
    name: 'watch-gal-folder',
    configureServer(server) {
      const galDir = path.resolve(__dirname, 'GAL');
      const dataFile = path.resolve(__dirname, 'src/data/portfolioData.js');
      server.watcher.add(galDir);
      const reload = (file) => {
        if (file && file.startsWith(galDir)) {
          const mod = server.moduleGraph.getModuleById(dataFile);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), watchGalFolder()]
});
