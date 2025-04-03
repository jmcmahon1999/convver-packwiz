const fs = require('fs');
const path = require('path');
const TOML = require('smol-toml');

module.exports = {
  name: "packwiz",
  description: "plugin for packwiz projects",
  file: "pack.toml",
  async read() {
    const data = fs.readFileSync(path.join(process.cwd(), this.file));
    if (data) {
        return TOML.parse(data.toString())
    } else {
        return;
    }
  },
  async version() {
    const project = await this.read();
    return project.version;
  },
  async update(version) {
    const project = await this.read();
    project.version = version;
    fs.writeFileSync(path.join(process.cwd(), this.file), TOML.stringify(project));
  },
};
