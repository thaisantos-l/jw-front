"""Package, select and confirm JW static releases without rebuilding at publication."""
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
import time
from urllib.request import Request, urlopen
import zipfile

REPOSITORY = 'thaisantos-l/jw-front'
WORKFLOW = '.github/workflows/build-production.yml'
SITE_URL = 'https://jwusinvest.com.br'
CMS_URL = 'https://cms.jwusinvest.com.br/graphql'
MAX_BYTES = 100 * 1024 * 1024
MAX_FILES = 10000
ROOT = Path('.deploy')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n').encode()


def site_path(name):
    path = PurePosixPath(name)
    require(isinstance(name, str) and name and not path.is_absolute() and
            path.as_posix() == name and '\\' not in name and
            all(part not in ('.', '..') and not part.startswith('.') for part in path.parts) and
            path.parts[0] not in ('cms', 'cgi-bin') and
            path.suffix.lower() not in ('.php', '.sql', '.pem', '.key', '.yml', '.yaml') and
            not any(ord(char) < 32 for char in name), 'Unsafe release path')
    return name


def verify_release(blob, checksum):
    require(0 < len(blob) <= MAX_BYTES and sha(blob) == checksum.strip(), 'Release checksum mismatch')
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        entries = archive.infolist()
        require(0 < len(entries) <= MAX_FILES and
                sum(entry.file_size for entry in entries) <= MAX_BYTES and
                len({entry.filename for entry in entries}) == len(entries), 'Invalid release size or duplicate entries')
        for entry in entries:
            require(not entry.is_dir() and stat.S_ISREG(entry.external_attr >> 16) and
                    not entry.flag_bits & 1 and
                    (entry.filename == 'manifest.json' or entry.filename.startswith('site/')), 'Invalid release entry')
            if entry.filename.startswith('site/'):
                site_path(entry.filename[5:])
        data = {entry.filename: archive.read(entry) for entry in entries}
    manifest = json.loads(data.pop('manifest.json'))
    require(manifest['schemaVersion'] == 1 and manifest['repository'] == REPOSITORY and
            manifest['siteUrl'] == SITE_URL and manifest['graphqlUrl'] == CMS_URL and
            re.fullmatch(r'[a-f0-9]{40}', manifest['commit']) and
            all(re.fullmatch(r'[1-9][0-9]*', str(manifest[k])) for k in ('runId', 'attempt')), 'Invalid release identity')
    files = {name[5:]: body for name, body in data.items()}
    require(set(manifest['files']) == set(files), 'Manifest file list mismatch')
    for name, body in files.items():
        require(manifest['files'][name] == {'sha256': sha(body), 'bytes': len(body)}, 'Release file checksum mismatch')
    require({'index.html', '404.html', 'robots.txt', 'sitemap.xml', 'build-manifest.json',
             'jw-release.json', 'privacidade/index.html', 'termos/index.html'} <= files.keys(), 'Incomplete export')
    marker = json.loads(files['jw-release.json'])
    require(marker == {k: manifest[k] for k in ('schemaVersion', 'repository', 'commit', 'runId', 'attempt')}, 'Release marker mismatch')
    build = json.loads(files['build-manifest.json'])
    require(build['indexSha256'] == sha(files['index.html']), 'Build manifest mismatch')
    return manifest, files


def package():
    require(os.environ.get('GITHUB_REPOSITORY') == REPOSITORY and
            os.environ.get('GITHUB_REF') == 'refs/heads/main', 'Only main builds can produce production artifacts')
    require(os.environ.get('SITE_URL') == SITE_URL and
            os.environ.get('WORDPRESS_GRAPHQL_URL') == CMS_URL and
            os.environ.get('SITE_INDEXABLE') == 'true', 'Incorrect production configuration')
    manifest = dict(schemaVersion=1, repository=REPOSITORY, commit=os.environ['GITHUB_SHA'],
                    runId=os.environ['GITHUB_RUN_ID'], attempt=os.environ['GITHUB_RUN_ATTEMPT'],
                    siteUrl=SITE_URL, graphqlUrl=CMS_URL)
    files = {}
    require(not Path('out').is_symlink(), 'Unsafe export root')
    for item in sorted(Path('out').rglob('*')):
        require(not item.is_symlink(), 'Symlinks cannot be deployed')
        if not item.is_file():
            continue
        name = site_path(item.relative_to('out').as_posix())
        body = item.read_bytes()
        require(not re.search(rb'PRIVATE KEY|/Applications/XAMPP|https?://(?:localhost|127\.0\.0\.1)(?=[:/"\s])', body), 'Local or private data in production export')
        files[name] = body
    require('jw-release.json' not in files, 'Stale release marker in export')
    files['jw-release.json'] = encoded({k: manifest[k] for k in ('schemaVersion', 'repository', 'commit', 'runId', 'attempt')})
    manifest['files'] = {name: {'sha256': sha(body), 'bytes': len(body)} for name, body in files.items()}
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, body in [('manifest.json', encoded(manifest)), *[('site/' + k, v) for k, v in files.items()]]:
            entry = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = (stat.S_IFREG | 0o644) << 16
            archive.writestr(entry, body, compress_type=zipfile.ZIP_DEFLATED)
    blob = output.getvalue()
    verify_release(blob, sha(blob))
    ROOT.mkdir(exist_ok=True)
    require(not ROOT.is_symlink(), 'Unsafe working directory')
    (ROOT / 'release.zip').write_bytes(blob)
    (ROOT / 'release.sha256').write_text(sha(blob) + '\n')
    print('Production release packaged:', manifest['commit'], sha(blob))


def api(resource, binary=False):
    data = subprocess.check_output(['gh', 'api', 'repos/' + REPOSITORY + '/' + resource])
    return data if binary else json.loads(data)


def validate_selection(run, artifact, main_sha, deploy_sha, operation):
    require(operation in ('deploy', 'rollback'), 'Unknown operation')
    require(run['repository']['full_name'] == REPOSITORY and
            run['head_repository']['full_name'] == REPOSITORY and run['path'] == WORKFLOW and
            run['head_branch'] == 'main' and run['event'] in ('push', 'workflow_dispatch') and
            run['status'] == 'completed' and run['conclusion'] == 'success', 'Build is not a successful main release')
    require(deploy_sha == main_sha and (operation == 'rollback' or run['head_sha'] == main_sha), 'Outdated deployment or build; rebuild current main')
    require(not artifact['expired'] and artifact['size_in_bytes'] <= MAX_BYTES and
            artifact['workflow_run']['id'] == run['id'] and
            artifact['workflow_run']['head_sha'] == run['head_sha'] and
            artifact['workflow_run']['head_branch'] == 'main' and
            artifact['name'] == f"jw-{run['head_sha']}-{run['id']}-{run['run_attempt']}", 'Artifact does not belong to this successful build attempt')


def select():
    require(os.environ.get('GITHUB_REPOSITORY') == REPOSITORY and
            os.environ.get('GITHUB_REF') == 'refs/heads/main', 'Publish only from main')
    run_id, artifact_id = os.environ['BUILD_RUN_ID'], os.environ['BUILD_ARTIFACT_ID']
    require(all(re.fullmatch(r'[1-9][0-9]*', value) for value in (run_id, artifact_id)), 'IDs must be numeric')
    run, artifact = api('actions/runs/' + run_id), api('actions/artifacts/' + artifact_id)
    main_sha = api('git/ref/heads/main')['object']['sha']
    operation = os.environ['CODE_OPERATION']
    validate_selection(run, artifact, main_sha, os.environ['GITHUB_SHA'], operation)
    if operation == 'rollback':
        require(api('compare/' + run['head_sha'] + '...' + main_sha)['status'] in ('ahead', 'identical'), 'Rollback commit is not integrated into main')
    outer = api('actions/artifacts/' + artifact_id + '/zip', binary=True)
    require(len(outer) <= MAX_BYTES and artifact.get('digest') == 'sha256:' + sha(outer), 'GitHub artifact digest mismatch')
    with zipfile.ZipFile(io.BytesIO(outer)) as archive:
        require(len(archive.infolist()) == 2 and set(archive.namelist()) == {'release.zip', 'release.sha256'} and
                sum(x.file_size for x in archive.infolist()) <= MAX_BYTES, 'Unexpected artifact contents')
        manifest, files = verify_release(archive.read('release.zip'), archive.read('release.sha256').decode())
    require((manifest['commit'], manifest['runId'], manifest['attempt']) ==
            (run['head_sha'], str(run['id']), str(run['run_attempt'])), 'Artifact provenance mismatch')
    ROOT.mkdir(exist_ok=True)
    require(not ROOT.is_symlink(), 'Unsafe working directory')
    site = ROOT / 'site'
    require(not site.is_symlink(), 'Unsafe extraction directory')
    if site.exists():
        shutil.rmtree(site)
    site.mkdir()
    for name, body in files.items():
        dest = site / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(body)
    (ROOT / 'selected.json').write_bytes(encoded(manifest))
    print('Selected verified release:', manifest['commit'])


def confirm():
    manifest = json.loads((ROOT / 'selected.json').read_bytes())
    for origin in (SITE_URL, 'https://www.jwusinvest.com.br'):
        for name in ('jw-release.json', 'index.html'):
            for attempt in range(6):
                try:
                    url = origin + '/' + ('' if name == 'index.html' else name) + '?release=' + manifest['commit']
                    with urlopen(Request(url, headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'}), timeout=20) as response:
                        body = response.read(MAX_BYTES + 1)
                        require(response.url == url, 'Unexpected HTTP redirect')
                    require(sha(body) == manifest['files'][name]['sha256'], 'Public file does not match release')
                    break
                except Exception:
                    if attempt == 5:
                        raise
                    time.sleep(3)
    print('Deployment confirmed over HTTPS, with and without www:', manifest['commit'])


if __name__ == '__main__':
    try:
        {'package': package, 'select': select, 'confirm': confirm}[sys.argv[1]]()
    except (ValueError, KeyError, OSError, IndexError, zipfile.BadZipFile, subprocess.CalledProcessError) as error:
        print('Release failed:', str(error), file=sys.stderr)
        sys.exit(1)
