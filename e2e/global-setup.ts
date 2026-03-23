import { execSync } from "child_process";

const CONTAINER_NAME = "cors-wildcard-e2e";
const SINGLE_ORIGIN_CONTAINER = "cors-single-origin-e2e";
const MULTI_ORIGIN_CONTAINER = "cors-multi-origin-e2e";

async function globalSetup() {
  try {
    // Clean up any leftover container from a previous run
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: "pipe" });
    } catch {
      // Container didn't exist, that's fine
    }
    try {
      execSync(`docker rm -f ${SINGLE_ORIGIN_CONTAINER}`, { stdio: "pipe" });
    } catch {
      // Container didn't exist, that's fine
    }
    try {
      execSync(`docker rm -f ${MULTI_ORIGIN_CONTAINER}`, { stdio: "pipe" });
    } catch {
      // Container didn't exist, that's fine
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
    const image = execSync(
      `docker inspect --format '{{.Config.Image}}' ${containerId}`
    )
      .toString()
      .trim();

    const network = execSync(
      `docker inspect --format '{{range $key, $val := .NetworkSettings.Networks}}{{println $key}}{{end}}' ${containerId} | head -1`
    )
      .toString()
      .trim();

    console.log(
      `Starting CORS wildcard server: image=${image}, network=${network}`
    );

    // Start a second container with CORS_ORIGINS=*
    execSync(
      `docker run -d --name ${CONTAINER_NAME} ` +
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

    // Wait for the wildcard server to be ready (up to 30 seconds)
    for (let i = 0; i < 30; i++) {
      try {
        execSync("curl -sf http://localhost:4001/health", { stdio: "pipe" });
        console.log("CORS wildcard server ready on port 4001");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Start a third container with CORS_ORIGINS=http://allowed.com for SC-003/SC-005
    console.log(
      `Starting CORS single-origin server: image=${image}, network=${network}`
    );
    execSync(
      `docker run -d --name ${SINGLE_ORIGIN_CONTAINER} ` +
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

    // Wait for the single-origin server to be ready (up to 30 seconds)
    let singleOriginReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        execSync("curl -sf http://localhost:4002/health", { stdio: "pipe" });
        console.log("CORS single-origin server ready on port 4002");
        singleOriginReady = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (!singleOriginReady) {
      console.warn("CORS single-origin server: timeout waiting for port 4002");
    }

    // Start a fourth container with CORS_ORIGINS=http://first.com,http://second.com for SC-004
    console.log(
      `Starting CORS multi-origin server: image=${image}, network=${network}`
    );
    execSync(
      `docker run -d --name ${MULTI_ORIGIN_CONTAINER} ` +
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

    // Wait for the multi-origin server to be ready (up to 30 seconds)
    for (let i = 0; i < 30; i++) {
      try {
        execSync("curl -sf http://localhost:4003/health", { stdio: "pipe" });
        console.log("CORS multi-origin server ready on port 4003");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  } catch (e) {
    console.warn("CORS wildcard server setup failed:", e);
  }
}

export default globalSetup;
