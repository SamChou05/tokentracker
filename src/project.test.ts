import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGitRemote } from './project.ts';

describe('parseGitRemote', () => {
  it('parses HTTPS GitHub URL', () => {
    const result = parseGitRemote('https://github.com/samchou/aimonsters.git');
    assert.deepEqual(result, { owner: 'samchou', repo: 'aimonsters' });
  });

  it('parses HTTPS URL without .git suffix', () => {
    const result = parseGitRemote('https://github.com/samchou/aimonsters');
    assert.deepEqual(result, { owner: 'samchou', repo: 'aimonsters' });
  });

  it('parses SSH URL', () => {
    const result = parseGitRemote('git@github.com:samchou/aimonsters.git');
    assert.deepEqual(result, { owner: 'samchou', repo: 'aimonsters' });
  });

  it('parses SSH URL without .git suffix', () => {
    const result = parseGitRemote('git@github.com:samchou/aimonsters');
    assert.deepEqual(result, { owner: 'samchou', repo: 'aimonsters' });
  });

  it('parses GitLab SSH URL', () => {
    const result = parseGitRemote('git@gitlab.com:team/project.git');
    assert.deepEqual(result, { owner: 'team', repo: 'project' });
  });

  it('parses Bitbucket HTTPS URL', () => {
    const result = parseGitRemote('https://bitbucket.org/team/repo.git');
    assert.deepEqual(result, { owner: 'team', repo: 'repo' });
  });

  it('returns null for unparseable input', () => {
    const result = parseGitRemote('not-a-url');
    assert.equal(result, null);
  });

  it('handles URLs with extra whitespace', () => {
    const result = parseGitRemote('  https://github.com/samchou/aimonsters.git  ');
    assert.deepEqual(result, { owner: 'samchou', repo: 'aimonsters' });
  });

  it('handles hyphenated names', () => {
    const result = parseGitRemote('git@github.com:my-org/my-cool-project.git');
    assert.deepEqual(result, { owner: 'my-org', repo: 'my-cool-project' });
  });
});
