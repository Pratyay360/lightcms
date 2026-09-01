import {
  isGitHubStatus,
  isNotFoundError,
  RepositoryFileExistsError,
  wrapGitHubError,
} from "./errors.js";
import { assertRepositoryPath, encodeContent, parseRepository } from "./helpers.js";
import { getFileContent } from "./read.js";
import type { GitHubClient, Repository } from "./types.js";

async function createOrUpdateContents(
  path: string,
  content: string,
  message: string,
  client: GitHubClient,
  repository: Repository,
  branch: string | undefined,
  sha: string | undefined,
) {
  const { owner, repo } = parseRepository(repository);
  return client.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: encodeContent(content),
    ...(branch ? { branch } : {}),
    ...(sha ? { sha } : {}),
  });
}

/**
 * Internal helper to attempt creation with a branch, falling back to default branch if needed.
 */
async function createOrUpdateWithBranchFallback(
  path: string,
  content: string,
  message: string,
  client: GitHubClient,
  repository: Repository,
  branch: string | undefined,
  existingSha: string | undefined,
) {
  try {
    const response = await createOrUpdateContents(
      path,
      content,
      message,
      client,
      repository,
      branch,
      existingSha,
    );
    return {
      commitSha: response.data.commit.sha,
      path: response.data.content?.path ?? path,
    };
  } catch (error) {
    // If the branch is invalid or missing, retry without specifying a branch (uses default).
    if (
      branch &&
      (isGitHubStatus(error, 404) || isGitHubStatus(error, 409) || isGitHubStatus(error, 422))
    ) {
      const response = await createOrUpdateContents(
        path,
        content,
        message,
        client,
        repository,
        undefined,
        existingSha,
      );
      return {
        commitSha: response.data.commit.sha,
        path: response.data.content?.path ?? path,
      };
    }
    wrapGitHubError(`create or update file: ${path}`, error);
  }
}

/**
 * Creates a new file or updates an existing one. If the file exists, its SHA is used to avoid conflicts.
 */
export async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
  client: GitHubClient,
  repository: Repository,
  branch?: string,
) {
  assertRepositoryPath(path);
  let sha: string | undefined;
  try {
    sha = (await getFileContent(path, client, repository, branch)).sha;
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
    // File does not exist, so sha remains undefined.
  }
  return createOrUpdateWithBranchFallback(path, content, message, client, repository, branch, sha);
}

/**
 * Creates a new file. Throws `RepositoryFileExistsError` if the file already exists.
 */
export async function createFile(
  path: string,
  content: string,
  message: string,
  client: GitHubClient,
  repository: Repository,
  branch?: string,
) {
  assertRepositoryPath(path);
  // Ensure the file does not already exist.
  try {
    await getFileContent(path, client, repository, branch);
    throw new RepositoryFileExistsError(`File "${path}" already exists.`);
  } catch (error) {
    if (error instanceof RepositoryFileExistsError) throw error;
    if (!isNotFoundError(error)) throw error;
    // File does not exist, proceed.
  }
  return createOrUpdateWithBranchFallback(
    path,
    content,
    message,
    client,
    repository,
    branch,
    undefined,
  );
}

/**
 * Deletes a file.
 */
export async function deleteFile(
  path: string,
  message: string,
  client: GitHubClient,
  repository: Repository,
  branch?: string,
) {
  assertRepositoryPath(path);
  const { owner, repo } = parseRepository(repository);
  const { sha } = await getFileContent(path, client, repository, branch);
  try {
    await client.rest.repos.deleteFile({
      owner,
      repo,
      path,
      message,
      sha,
      ...(branch ? { branch } : {}),
    });
  } catch (error) {
    wrapGitHubError(`delete file: ${path}`, error);
  }
}
