"""Main integration gate for the isolated 17-world V6 3D experience.

GitHub's legacy main workflow predates the V6 subtree. Include its build and
headless pure-motion tests in the existing Python CI job; no Azure writes.
"""
import os
import pathlib
import subprocess
import tempfile
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]

class GalaxyV6MainIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.experience=ROOT/"experience"
        if not cls.experience.is_dir():
            raise AssertionError("V6 experience folder absent from main integration")

    def test_01_orbit_spin_and_contact_contracts(self):
        suites=[
            "worldOrbit.test.mjs",
            "orbitalApproach.test.mjs",
            "orbitalPluckPose.test.mjs",
            "cinematicLayout.test.mjs",
        ]
        subprocess.run(
            ["node","--test",*[str(self.experience/"tests"/s) for s in suites]],
            cwd=ROOT,check=True,timeout=90,
        )

    def test_02_build_and_stage_isolated_preview(self):
        if os.environ.get("CI")!="true":
            self.skipTest("Full dependency/download build runs only in GitHub CI")
        env={**os.environ,"GALAXY_V6_ANATOMY":"1","VITE_GALAXY_ANATOMY":"1"}
        subprocess.run(
            ["npm","ci","--prefix","experience","--no-audit","--no-fund"],
            cwd=ROOT,env=env,check=True,timeout=300,
        )
        subprocess.run(
            ["npm","run","--prefix","experience","build"],
            cwd=ROOT,env=env,check=True,timeout=360,
        )
        with tempfile.TemporaryDirectory(prefix="galaxy-v6-ci-") as stage:
            subprocess.run(
                ["bash","scripts/p16/stage-preview.sh"],
                cwd=ROOT,env={**env,"GALAXY_SOURCE_ROOT":str(ROOT),"GALAXY_STAGE":stage},
                check=True,timeout=90,
            )
            preview=pathlib.Path(stage)
            self.assertTrue((preview/"index.html").is_file())
            self.assertTrue((preview/"lesson/index.html").is_file())
            self.assertTrue((preview/"models/kaykit/Skeleton_Mage.glb").is_file())
            self.assertTrue((preview/"models/cc0/InnersceneAnatomicalSkeleton.glb").is_file())

if __name__=="__main__":
    unittest.main()
