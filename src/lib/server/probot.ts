import { Probot } from "probot";

export async function getProbot(): Promise<Probot> {
	return new Probot({
		appId: process.env.GITHUB_APP_ID!,
		privateKey: process.env.GITHUB_PRIVATE_KEY!,
		secret: process.env.GITHUB_WEBHOOK_SECRET!,
	});
}
