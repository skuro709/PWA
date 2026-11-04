export async function loadWasm() {
  const moduleFactory = (await import("./dist/simulation.js")).default;
  return moduleFactory();
}