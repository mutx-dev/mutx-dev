/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (every deploy / cold start).
 * Sends a deploy notification to Discord if RAILWAY_ENVIRONMENT is set.
 */

export async function register() {
  // Only run on server (not edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
    const webhookUrl = process.env.DOCS_SYNC_ALERT_WEBHOOK;

    if (isRailway && webhookUrl) {
      const service = process.env.RAILWAY_SERVICE_NAME ?? "unknown";
      const env = process.env.RAILWAY_ENVIRONMENT ?? "unknown";
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN ?? "unknown";
      const deployId = process.env.RAILWAY_DEPLOYMENT_ID ?? "local";
      const commit = process.env.RAILWAY_SNAPSHOT_ID ?? "unknown";

      const message = {
        embeds: [
          {
            title: "Deploy Complete",
            color: 0x22c55e, // green
            fields: [
              { name: "Service", value: service, inline: true },
              { name: "Environment", value: env, inline: true },
              { name: "Domain", value: domain, inline: true },
              {
                name: "Deployment",
                value: deployId.slice(0, 8),
                inline: true,
              },
              {
                name: "Snapshot",
                value: commit.slice(0, 8),
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // Fire and forget — don't block server startup
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      }).catch(() => {
        // Best effort
      });
    }
  }
}
