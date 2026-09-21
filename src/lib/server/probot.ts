import { Probot } from "probot";
import botApp from "$lib/bot/index.js";

let cachedProbot: Probot | undefined;

function readRequiredEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined || value === "") {
		throw new Error(`Missing required environment variable ${name}`);
	}
	return value;
}

function normalizePrivateKey(value: string): string {
	if (value.includes("\\n")) {
		return value.replace(/\\n/g, "\n");
	}
	return value;
}

/**
 * Return a process-wide Probot instance with the LightCMS bot loaded.
 *
 * Probot construction reads and decrypts the GitHub App private key, so
 * creating one instance per webhook request wastes CPU and risks key
 * parsing failures under load. The singleton is created once and reused
 * by every call to the webhook endpoint.
 */
export async function getProbot(): Promise<Probot> {
	if (cachedProbot !== undefined) {
		return cachedProbot;
	}

	const appIdValue = readRequiredEnv("GITHUB_APP_ID");
	const appId = Number(appIdValue);
	if (Number.isNaN(appId)) {
		throw new Error("Environment variable GITHUB_APP_ID must be a number");
	}

	const privateKey = normalizePrivateKey(readRequiredEnv("GITHUB_PRIVATE_KEY"));
	const secret = readRequiredEnv("GITHUB_WEBHOOK_SECRET");

	const probot = new Probot({
		appId,
		privateKey,
		secret,
	});

	await probot.load(botApp);
	cachedProbot = probot;
	return probot;
}
