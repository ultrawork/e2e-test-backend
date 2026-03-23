import { execSync } from "child_process";

const CONTAINER_NAME = "cors-wildcard-e2e";

async function globalSetup() {
  try {
    // Clean up any leftover container from a previous run
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: "pipe" });
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

    // Wait for the server to be ready (up to 30 seconds)
    for (let i = 0; i < 30; i++) {
      try {
        execSync("curl -sf http://localhost:4001/health", { stdio: "pipe" });
        console.log("CORS wildcard server ready on port 4001");
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    console.warn("CORS wildcard server: timeout waiting for port 4001");
  } catch (e) {
    console.warn("CORS wildcard server setup failed:", e);
  }
}

export default globalSetup;
