"""Offline safety contract for the existing-only Azure static upload helper.

All `az` operations use a temporary fake CLI, never real Azure credentials.
"""
from pathlib import Path
import json
import os
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts' / 'deploy_existing_static.sh'
PUBLIC = {
    'index.html', 'styles.css', 'app.js', 'runtime-config.js',
    'data/curriculum.json', 'data/lessons.json',
    'speech/azure-speech-adapter.js', 'genie/guide.js',
    'genie/progress/story.js', 'genie/effects/cosmic-polish.js',
    'genie/effects/cosmic-polish.css', 'galaxy/handoff/planet-flight.js',
    'galaxy/handoff/planet-flight.css',
}

FAKE_AZ = '''#!/usr/bin/env python3
import json, os, pathlib, sys
args = sys.argv[1:]
log = pathlib.Path(os.environ['MOCK_AZ_LOG'])
with log.open('a') as file:
    file.write(json.dumps({'command': args}) + '\\n')
if args[:3] == ['storage', 'account', 'show']:
    print('/subscriptions/mock/resourceGroups/GenAI_Galaxy/providers/Microsoft.Storage/storageAccounts/gengalaxy1429841605')
elif args[:3] == ['storage', 'account', 'blob-service-properties']:
    print(os.environ.get('MOCK_STATIC_ENABLED','true'))
elif args[:3] == ['storage', 'container', 'show']:
    if os.environ.get('MOCK_BLOB_ACCESS', 'true') != 'true':
        print('AuthorizationPermissionMismatch', file=sys.stderr)
        sys.exit(1)
    print('$web')
elif args[:3] == ['storage', 'blob', 'upload-batch']:
    folder = pathlib.Path(args[args.index('--source') + 1])
    assets = sorted(str(p.relative_to(folder)) for p in folder.rglob('*') if p.is_file())
    with log.open('a') as file:
        file.write(json.dumps({'assets': assets}) + '\\n')
else:
    print('Unexpected Azure operation', args, file=sys.stderr)
    sys.exit(99)
'''


class AzureStaticDeployTest(unittest.TestCase):
    def run_script(self, *, rg='GenAI_Galaxy', storage='gengalaxy1429841605', enabled='true', blob_access='true'):
        with tempfile.TemporaryDirectory() as temp:
            binpath = Path(temp)
            az = binpath / 'az'
            az.write_text(FAKE_AZ)
            az.chmod(0o755)
            log = binpath / 'commands.jsonl'
            env = dict(os.environ, PATH=str(binpath) + os.pathsep + os.environ.get('PATH', ''),
                       GALAXY_AZ_RG=rg, GALAXY_AZ_STORAGE=storage,
                       MOCK_AZ_LOG=str(log), MOCK_STATIC_ENABLED=enabled,
                       MOCK_BLOB_ACCESS=blob_access)
            result = subprocess.run(['bash', str(SCRIPT)], text=True, capture_output=True,
                                    env=env, timeout=10)
            operations = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
            return result, operations

    def test_only_allowlisted_frontend_files_uploaded(self):
        result, operations = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([op['command'][:3] for op in operations if 'command' in op],
                         [['storage','account','show'], ['storage','account','blob-service-properties'],
                          ['storage','container','show'], ['storage','blob','upload-batch']])
        self.assertEqual(set(operations[-1]['assets']), PUBLIC)
        self.assertTrue(all('V3_REFERENCE.html' not in v for v in operations[-1]['assets']))
        self.assertIn('login', operations[-2]['command'])
        self.assertIn('$web', operations[-2]['command'])

    def test_no_blob_role_fails_before_upload(self):
        result, operations = self.run_script(blob_access='false')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Blob data access', result.stderr)
        self.assertFalse(any(op.get('command', [])[:3] ==
                             ['storage', 'blob', 'upload-batch'] for op in operations))

    def test_website_property_check_uses_arm_not_data_plane(self):
        result, operations = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('--resource-group', operations[1]['command'])
        self.assertNotIn('--auth-mode', operations[1]['command'])
        self.assertIn('--auth-mode', operations[2]['command'])

    def test_wrong_resource_group_cannot_touch_azure(self):
        result, operations = self.run_script(rg='RetailGrowthAI')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(operations, [])

    def test_other_valid_storage_account_refused_before_azure(self):
        result, operations = self.run_script(storage='othersite1234')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(operations, [])
        self.assertIn('not the owner-approved existing', result.stderr)

    def test_invalid_storage_name_cannot_touch_azure(self):
        result, operations = self.run_script(storage='GenAI_Galaxy')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(operations, [])

    def test_disabled_static_website_refuses_upload(self):
        result, operations = self.run_script(enabled='false')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any(op.get('command', [])[:3] == ['storage', 'blob', 'upload-batch'] for op in operations))


if __name__ == '__main__':
    unittest.main()
