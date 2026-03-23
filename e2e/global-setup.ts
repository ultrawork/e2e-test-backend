import { execSync } from "child_process";
import {
  CORS_WILDCARD_CONTAINER,
  CORS_SINGLE_ORIGIN_CONTAINER,
  CORS_MULTI_ORIGIN_CONTAINER,
} from "./container-names";

async function waitForServer(
  url: string,
  containerName: string,
  port: number
): Promise<void> {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      execSync(`curl -sf ${url}/health`, { stdio: "pipe" });
      console.log(`CORS ${containerName} server ready on port ${port}`);
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!ready) {
    console.warn(`CORS ${containerName} server: timeout waiting for port ${port}`);
  }
}

async function globalSetup() {
  try {
    // Clean up any leftover containers from a previous run
    for (const name of [
      CORS_WILDCARD_CONTAINER,
      CORS_SINGLE_ORIGIN_CONTAINER,
      CORS_MULTI_ORIGIN_CONTAINER,
    ]) {
      try {
        execSync(`docker rm -f ${name}`, { stdio: "pipe" });
      } catch {
        // Container didn't exist, that's fine
      }
    }

    // Find the running backend container by e2e label
    const containerId = execSync(
      'docker ps --filter "label=e2e-request" -q | head -1'
    )
      .toString()
      .trim();

    if (!containerId) {
      console.warn(
        "CORS wildcard setup: no backend container found, SC-002 will use default server"
      );
      return;
    }

    // Get image and network from the running container
    // Use .Config.Image first; if empty (common with compose-built images), fall back to .Image (sha256 hash)
    let image = execSync(
      `docker inspect --format '{{.Config.Image}}' ${containerId}`
    )
      .toString()
      .trim();

    if (!image) {
      image = execSync(
        `docker inspect --format '{{.Image}}' ${containerId}`
      )
        .toString()
        .trim();
    }

    const network = execSync(
      `docker inspect --format '{{range $key, $val := .NetworkSettings.Networks}}{{println $key}}{{end}}' ${containerId} | head -1`
    )
      .toString()
      .trim();

    // Start wildcard server (CORS_ORIGINS=*)
    console.log(
      `Starting CORS wildcard server: image=${image}, network=${network}`
    );
    execSync(
      `docker run -d --name ${CORS_WILDCARD_CONTAINER} ` +
        `--network "${network}" ` +
        `-p 4001:3000 ` +
        `-e CORS_ORIGINS="*" ` +
        `-e PORT=3000 ` +
        `-e DATABASE_URL="postgresql://postgres:postgres@db:5432/notes" ` +
        `-e JWT_SECRET=test-secret ` +
        `-e NODE_ENV=test ` +
        `"${image}"`,
      { stdio: "pipe" }
    );
    await waitForServer("http://localhost:4001", "wildcard", 4001);

    // Start single-origin server (CORS_ORIGINS=http://allowed.com) for SC-003/SC-005
    console.log(
      `Starting CORS single-origin server: image=${image}, network=${network}`
    );
    execSync(
      `docker run -d --name ${CORS_SINGLE_ORIGIN_CONTAINER} ` +
        `--network "${network}" ` +
        `-p 4002:3000 ` +
        `-e CORS_ORIGINS="http://allowed.com" ` +
        `-e PORT=3000 ` +
        `-e DATABASE_URL="postgresql://postgres:postgres@db:5432/notes" ` +
        `-e JWT_SECRET=test-secret ` +
        `-e NODE_ENV=test ` +
        `"${image}"`,
      { stdio: "pipe" }
    );
    await waitForServer("http://localhost:4002", "single-origin", 4002);

    // Start multi-origin server (CORS_ORIGINS=http://first.com,http://second.com) for SC-004
    console.log(
      `Starting CORS multi-origin server: image=${image}, network=${network}`
    );
    execSync(
      `docker run -d --name ${CORS_MULTI_ORIGIN_CONTAINER} ` +
        `--network "${network}" ` +
        `-p 4003:3000 ` +
        `-e CORS_ORIGINS="http://first.com,http://second.com" ` +
        `-e PORT=3000 ` +
        `-e DATABASE_URL="postgresql://postgres:postgres@db:5432/notes" ` +
        `-e JWT_SECRET=test-secret ` +
        `-e NODE_ENV=test ` +
        `"${image}"`,
      { stdio: "pipe" }
    );
    await waitForServer("http://localhost:4003", "multi-origin", 4003);
  } catch (e) {
    console.warn("CORS wildcard server setup failed:", e);
  }
}

export default globalSetup;
