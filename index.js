const fs = require('fs');
const path = require('path');
const TOML = require('smol-toml');
const convver = require('@jmcmahon1999/convver');

module.exports = {
  name: "packwiz",
  description: "plugin for packwiz projects",
  file: "pack.toml",
  async read() {
    const data = fs.readFileSync(path.resolve(this.file));
    if (data) {
        return TOML.parse(data.toString())
    } else {
        return;
    }
  },
  async version() {
    const project = await this.read();
    return convver.api.verifyVersion(project.version);
  },
  async update(version) {
    const project = await this.read();
    project.version = version;
    fs.writeFileSync(path.resolve(this.file), TOML.stringify(project));
  },
};
