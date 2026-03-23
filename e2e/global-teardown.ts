import { execSync } from "child_process";
import {
  CORS_WILDCARD_CONTAINER,
  CORS_SINGLE_ORIGIN_CONTAINER,
  CORS_MULTI_ORIGIN_CONTAINER,
} from "./container-names";

async function globalTeardown() {
  try {
    execSync(`docker rm -f ${CORS_WILDCARD_CONTAINER}`, { stdio: "pipe" });
    console.log("CORS wildcard server stopped");
  } catch {
    // Container may not exist, that's fine
  }
  try {
    execSync(`docker rm -f ${CORS_SINGLE_ORIGIN_CONTAINER}`, { stdio: "pipe" });
    console.log("CORS single-origin server stopped");
  } catch {
    // Container may not exist, that's fine
  }
  try {
    execSync(`docker rm -f ${CORS_MULTI_ORIGIN_CONTAINER}`, { stdio: "pipe" });
    console.log("CORS multi-origin server stopped");
  } catch {
    // Container may not exist, that's fine
  }
}

export default globalTeardown;
