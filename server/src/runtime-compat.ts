// `buffer-equal-constant-time`, pulled in by the legacy JWT/OCI dependency
// chain, still reads Buffer.SlowBuffer. Node 26 removed that alias. Restore the
// alias before those packages load so the server remains compatible while the
// upstream dependency tree catches up.
const bufferModule = require('buffer');

if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = bufferModule.Buffer;
}
