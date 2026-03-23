import { execSync } from "child_process";

async function globalTeardown() {
  try {
    execSync("docker rm -f cors-wildcard-e2e", { stdio: "pipe" });
    console.log("CORS wildcard server stopped");
  } catch {
    // Container may not exist, that's fine
  }
  try {
    execSync("docker rm -f cors-single-origin-e2e", { stdio: "pipe" });
    console.log("CORS single-origin server stopped");
  } catch {
    // Container may not exist, that's fine
  }
  try {
    execSync("docker rm -f cors-multi-origin-e2e", { stdio: "pipe" });
    console.log("CORS multi-origin server stopped");
  } catch {
    // Container may not exist, that's fine
  }
}

export default globalTeardown;
